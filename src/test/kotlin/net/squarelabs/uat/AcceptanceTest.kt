package net.squarelabs.uat

import com.google.inject.Guice
import com.google.inject.Injector
import net.squarelabs.pgrepl.App
import net.squarelabs.pgrepl.DefaultInjector
import net.squarelabs.pgrepl.model.Circle
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.DbService
import org.apache.commons.lang3.StringUtils
import org.eclipse.jetty.util.log.Log
import org.flywaydb.core.Flyway
import org.junit.*
import org.openqa.selenium.By
import org.openqa.selenium.WebDriver
import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.chrome.ChromeOptions
import org.openqa.selenium.interactions.Actions
import org.openqa.selenium.interactions.HasInputDevices
import org.openqa.selenium.internal.Locatable
import org.openqa.selenium.remote.DesiredCapabilities
import org.openqa.selenium.support.ui.ExpectedConditions.*
import org.openqa.selenium.support.ui.WebDriverWait
import java.util.*

class AcceptanceTest {

    lateinit var injector: Injector
    lateinit var cfgSvc: ConfigService
    lateinit var conSvc: ConnectionService
    lateinit var dbSvc: DbService
    lateinit var app: App

    companion object {

        private val LOG = Log.getLogger(AcceptanceTest::class.java)
        lateinit var driver: WebDriver

        @BeforeClass
        @JvmStatic
        @Throws(Exception::class)
        fun init() {
            // Selenium
            val chromeOptions = ChromeOptions()
            if (StringUtils.equalsIgnoreCase("true", System.getenv("headless"))) {
                chromeOptions.addArguments("--headless")
            }
            chromeOptions.addArguments("--disable-gpu")
            val dc = DesiredCapabilities()
            dc.isJavascriptEnabled = true
            dc.setCapability(ChromeOptions.CAPABILITY, chromeOptions)
            driver = ChromeDriver(dc)

            // Guice
        }

        @AfterClass
        @JvmStatic
        fun close() {
            LOG.info("Shutting down AcceptanceTest...")
            driver.close()
        }
    }

    @Before
    fun setup() {
        injector = Guice.createInjector(DefaultInjector())!!
        cfgSvc = injector.getInstance(ConfigService::class.java)!!
        conSvc = injector.getInstance(ConnectionService::class.java)!!
        dbSvc = injector.getInstance(DbService::class.java)!!
        app = injector.getInstance(App::class.java)!!

        val dbName = cfgSvc.getAppDbName()
        if (dbSvc.list().contains(dbName)) dbSvc.drop(dbName)
        dbSvc.create(dbName)
        val flyway = Flyway()
        flyway.setDataSource(cfgSvc.getAppDbUrl(), null, null)
        flyway.migrate()

        app.start()
    }

    @After
    fun tearDown() {
        app.close()
        conSvc.audit()
        conSvc.reset()
        val dbName = cfgSvc.getAppDbName()
        dbSvc.drop(dbName)
        conSvc.reset()
    }

    private fun loadResource(path: String): String {
        var text = this.javaClass.getResource(path)
        if (text != null) return text.readText() // Gradle
        text = this.javaClass.getResource("/" + path)
        return text.readText() // IntelliJ
    }

    @Test
    fun `clients should begin in expected state`() {

        // Setup
        val expected = loadResource("fixtures/initialState.json")
        clearIndexedDb()

        // Exercise
        navigateAndWaitForLoad()

        // Assert
        val leftActual = driver.findElement(By.cssSelector("#leftRoot .tbState")).getAttribute("value")
        val rghtActual = driver.findElement(By.cssSelector("#rightRoot .tbState")).getAttribute("value")
        Assert.assertEquals(
                "given an uninitialized IndexedDB, when a user visits the page, then the expected state is shown",
                expected, leftActual
        )
        Assert.assertEquals(
                "given an uninitialized IndexedDB, when a user visits the page, then the expected state is shown",
                expected, rghtActual
        )
    }

    @Test
    fun `client can draw multiple circles`() {
        // Setup
        clearIndexedDb()
        navigateAndWaitForLoad()
        val svg = driver.findElement(By.cssSelector("#rightRoot svg"))
        val numCircles = driver.findElement(By.cssSelector("#rightRoot .numCircles"))
        val logLength = driver.findElement(By.cssSelector("#rightRoot .logLength"))

        // Exercise: insert
        Actions(driver).moveToElement(svg, 10, 25).click().build().perform()

        Actions(driver).moveToElement(svg, 50, 50).click().build().perform()

        WebDriverWait(driver, 3).until(textToBe(By.cssSelector("#rightRoot .numCircles"), "2"))

        val circles = driver.findElements(By.cssSelector("circle"))
        Assert.assertEquals("Both circles should be on page", 2, circles.size);
        Assert.assertEquals("Circle one should be visible", true, circles[0].isDisplayed)
        Assert.assertEquals("Circle one should be visible", true, circles[1].isDisplayed)
        Assert.assertEquals("Two circles should be in DB", "2", numCircles.text)
        Assert.assertEquals("Two transactions should be in the log", "2", logLength.text)
    }

    // Black box test by necessity: can't populate indexeddb from selenium
    @Test
    fun `clients should CRUD while disconnected`() {

        // Setup
        clearIndexedDb()
        navigateAndWaitForLoad()

        // Exercise: insert
        val svg = driver.findElement(By.cssSelector("#rightRoot svg"))
        Actions(driver).moveToElement(svg, 10, 25).click().build().perform()
        WebDriverWait(driver, 3).until(presenceOfElementLocated(By.cssSelector("#rightRoot circle")))
        val circle = driver.findElement(By.cssSelector("#rightRoot circle"))
        val numCircles = driver.findElement(By.cssSelector("#rightRoot .numCircles"))
        val logLength = driver.findElement(By.cssSelector("#rightRoot .logLength"))

        // Assert
        Assert.assertNotNull("given offline mode, when canvas is clicked, then a circle should be created", circle)
        Assert.assertEquals("when a circle is visible, then there should be a record in the database", "1", numCircles.text)
        Assert.assertEquals("given offline mode, when a circle is created, then there should be a transaction in the log", "1", logLength.text)

        // Exercise: update
        val oldX = circle.getAttribute("cx")
        val oldY = circle.getAttribute("cy")
        val mouse = (driver as HasInputDevices).mouse
        mouse.mouseDown((circle as Locatable).coordinates)
        mouse.mouseUp((svg as Locatable).coordinates)
        WebDriverWait(driver, 3).until(textToBePresentInElement(logLength, "2"))

        // Assert: update
        Assert.assertNotEquals("given an existing circle, when it is dragged, then it moves to the new coordinates",
                oldX, circle.getAttribute("cx")
        )
        Assert.assertNotEquals("given an existing circle, when it is dragged, then it moves to the new coordinates",
                oldY, circle.getAttribute("cy")
        )
        Assert.assertEquals("given offline mode, when a circle is moved, then there should be a transaction in the log", "2", logLength.text)

        // Exercise: delete
        circle.click()
        WebDriverWait(driver, 3).until(presenceOfElementLocated(By.cssSelector("#rightRoot .dragItem")))
        svg.sendKeys("d")
        WebDriverWait(driver, 3).until(textToBePresentInElement(logLength, "3"))
        val circles = driver.findElements(By.cssSelector("#rightRoot circle"))

        // Assert delete
        Assert.assertEquals("when all circles have been deleted, then there should be none on the screen", 0, circles.size)
        Assert.assertEquals("when all circles have been deleted, then there should be none in the DB", "0", numCircles.text)
        Assert.assertEquals("given offline mode, when a circle is deleted, then there should be a transaction in the log", "3", logLength.text)
    }

    // Black box test by necessity: can't populate indexeddb from selenium
    @Test
    fun `client state should survive reloads`() {

        // Setup
        clearIndexedDb()
        navigateAndWaitForLoad()

        // Exercise: insert
        val svg = driver.findElement(By.cssSelector("#leftRoot svg"))
        Actions(driver).moveToElement(svg, 10, 25).click().build().perform()
        WebDriverWait(driver, 3).until(presenceOfElementLocated(By.cssSelector("#leftRoot circle")))

        // Exercise: reload
        navigateAndWaitForLoad()

        // Assert
        val numCircles = driver.findElement(By.cssSelector("#leftRoot .numCircles"))
        val logLength = driver.findElement(By.cssSelector("#leftRoot .logLength"))
        val circle = driver.findElement(By.cssSelector("#leftRoot circle"))
        Assert.assertNotNull("given offline mode, when canvas is clicked, then a circle should be created", circle)
        Assert.assertEquals("when a circle is visible, then there should be a record in the database", "1", numCircles.text)
        Assert.assertEquals("given offline mode, when a circle is created, then there should be a transaction in the log", "1", logLength.text)
    }

    @Test
    fun `offline work should flush to server on connect`() {
        // Setup
        clearIndexedDb()
        navigateAndWaitForLoad()

        // Exercise: insert
        val svg = driver.findElement(By.cssSelector("#leftRoot svg"))
        Actions(driver).moveToElement(svg, 10, 25).click().build().perform()
        WebDriverWait(driver, 3).until(presenceOfElementLocated(By.cssSelector("#leftRoot circle")))

        // Exercise: connect
        driver.findElement(By.cssSelector("#leftRoot .btnConnect")).click()
        WebDriverWait(driver, 3).until(not(textToBe(By.cssSelector("#leftRoot .lsn"), "0")))
        driver.findElement(By.cssSelector("#rightRoot .btnConnect")).click()
        WebDriverWait(driver, 3).until(not(textToBe(By.cssSelector("#rightRoot .lsn"), "0")))

        // Assert: left
        val leftNumCircles = driver.findElement(By.cssSelector("#leftRoot .numCircles"))
        val leftLogLength = driver.findElement(By.cssSelector("#leftRoot .logLength"))
        val leftCircleEl = driver.findElement(By.cssSelector("#leftRoot circle"))
        Assert.assertNotNull("given a client has a circle, when they connect, then the circle should remain on screen", leftCircleEl)
        Assert.assertEquals("given a client has a circle, when they connect, then the circle should remain in DB", "1", leftNumCircles.text)
        Assert.assertEquals("given a client with offline change, when they connect, changes should flush to server", "0", leftLogLength.text)

        // Assert: right
        val rightNumCircles = driver.findElement(By.cssSelector("#rightRoot .numCircles"))
        val rightLogLength = driver.findElement(By.cssSelector("#rightRoot .logLength"))
        val rightCircleEl = driver.findElement(By.cssSelector("#rightRoot circle"))
        Assert.assertNotNull("given a client connects to the server, when there is a circle, the client should receive it", rightCircleEl)
        Assert.assertEquals("given a circle is on the screen, then it should also be in the DB", "1", rightNumCircles.text)
        Assert.assertEquals("given a client connects to a server with a change, it is not stored in the local log", "0", rightLogLength.text)
    }

    @Test
    fun `client should get state from server on connect`() {

        // Setup
        val id = UUID.randomUUID().toString()
        val curTxnId = UUID.randomUUID().toString()
        val circle = Circle(id, 10, 10, 20, "blue", 1, "red", curTxnId, null)
        dbSvc.insert(cfgSvc.getAppDbUrl(), circle)
        clearIndexedDb()

        // Exercise
        navigateAndWaitForLoad()
        driver.findElement(By.cssSelector("#leftRoot .btnConnect")).click()
        WebDriverWait(driver, 3).until(not(textToBe(By.cssSelector("#leftRoot .lsn"), "0")))

        // Assert
        val numCircles = driver.findElement(By.cssSelector("#leftRoot .numCircles"))
        val logLength = driver.findElement(By.cssSelector("#leftRoot .logLength"))
        val circleEl = driver.findElement(By.cssSelector("#leftRoot circle"))
        Assert.assertNotNull("given a server has a circle, when the user connects, then they should see the circle", circleEl)
        Assert.assertEquals("given a server has a circle, when the user connects, then the circle should be in the database", "1", numCircles.text)
        Assert.assertEquals("given offline mode, when a circle is created, then there should be a transaction in the log", "0", logLength.text)
    }

    @Test
    fun `log entries should be removed from indexedDb`() {

        // Setup
        clearIndexedDb()
        navigateAndWaitForLoad()
        driver.findElement(By.cssSelector("#leftRoot .btnConnect")).click()
        WebDriverWait(driver, 3).until(not(textToBe(By.cssSelector("#leftRoot .lsn"), "0")))
        val lsnField = driver.findElement(By.cssSelector("#leftRoot .lsn"))
        val originalLsnText = lsnField.text

        // Exercise: create a circle
        val svg = driver.findElement(By.cssSelector("#leftRoot svg"))
        Actions(driver).moveToElement(svg, 10, 25).click().build().perform()
        WebDriverWait(driver, 3).until(not(textToBePresentInElement(lsnField, originalLsnText)))

        // Assert
        val numCircles = driver.findElement(By.cssSelector("#leftRoot .numCircles"))
        val logLength = driver.findElement(By.cssSelector("#leftRoot .logLength"))
        val circleEl = driver.findElement(By.cssSelector("#leftRoot circle"))
        Assert.assertNotNull("given a server has a circle, when the user connects, then they should see the circle", circleEl)
        Assert.assertEquals("given a server has a circle, when the user connects, then the circle should be in the database", "1", numCircles.text)
        Assert.assertEquals("given online mode, when a circle is created, then there should be a transaction in the log", "0", logLength.text)

        // Exercise: reload
        navigateAndWaitForLoad()

        // Assert: log is the same
        val numCircles2 = driver.findElement(By.cssSelector("#leftRoot .numCircles"))
        val logLength2 = driver.findElement(By.cssSelector("#leftRoot .logLength"))
        val circleEl2 = driver.findElement(By.cssSelector("#leftRoot circle"))
        Assert.assertNotNull("given there is a circle, when the browser is refreshed, then there should still be a circle on the screen", circleEl2)
        Assert.assertEquals("given there is a circle, when the browser is refreshed, then there should still be a circle in the DB", "1", numCircles2.text)
        Assert.assertEquals("given there is no log, when the browser is refreshed, there should still be no log", "0", logLength2.text)
    }

    @Test
    fun `conflicting edits should be rolled back`() {
        // Setup
        clearIndexedDb()
        navigateAndWaitForLoad()
        driver.findElement(By.cssSelector("#leftRoot .btnConnect")).click()
        driver.findElement(By.cssSelector("#rightRoot .btnConnect")).click()
        WebDriverWait(driver, 3).until(not(textToBe(By.cssSelector("#leftRoot .lsn"), "0")))
        WebDriverWait(driver, 3).until(not(textToBe(By.cssSelector("#rightRoot .lsn"), "0")))
        val leftLsnField = driver.findElement(By.cssSelector("#leftRoot .lsn"))
        val rghtLsnField = driver.findElement(By.cssSelector("#rightRoot .lsn"))
        val originalLsnText = leftLsnField.text

        // Setup: create circle
        val leftSvg = driver.findElement(By.cssSelector("#leftRoot svg"))
        val rghtSvg = driver.findElement(By.cssSelector("#rightRoot svg"))
        Actions(driver).moveToElement(leftSvg, 10, 25).click().build().perform()
        WebDriverWait(driver, 3).until(not(textToBePresentInElement(leftLsnField, originalLsnText)))
        WebDriverWait(driver, 3).until(not(textToBePresentInElement(rghtLsnField, originalLsnText)))
        val circleCreatedLsn = leftLsnField.text

        // Exercise: go offline and make change
        driver.findElement(By.cssSelector("#leftRoot .btnConnect")).click()
        val mouse = (driver as HasInputDevices).mouse
        val leftCircle = driver.findElement(By.cssSelector("#leftRoot circle"))
        val leftLogLength = driver.findElement(By.cssSelector("#leftRoot .logLength"))

        // Move circle on left
        mouse.mouseDown((leftCircle as Locatable).coordinates)
        mouse.mouseUp((leftSvg as Locatable).coordinates)
        WebDriverWait(driver, 3).until(textToBe(By.cssSelector("#leftRoot .logLength"), "1"))

        // Delete circle on right
        driver.findElement(By.cssSelector("#rightRoot circle")).click()
        WebDriverWait(driver, 3).until(visibilityOfElementLocated(By.cssSelector("#rightRoot .dragItem")))
        driver.findElement(By.cssSelector("#rightRoot svg")).sendKeys("d")
        WebDriverWait(driver, 3).until(not(textToBe(By.cssSelector("#rightRoot .lsn"), circleCreatedLsn)))

        // Exercise: go back online
        driver.findElement(By.cssSelector("#leftRoot .btnConnect")).click()
        WebDriverWait(driver, 3).until(textToBe(By.cssSelector("#leftRoot .lsn"), rghtLsnField.text))

        // Assert
        Assert.assertEquals("given a conflicting change has been made, when a client goes back online, then the change is rolled back",
                "0", leftLogLength.text
        )
        // TODO: test is passing erroneously: assertion is missing for right circle final location
    }

    // ------------------------------------------- helpers ------------------------------------------------------------
    private fun navigateAndWaitForLoad() {
        driver.get("http://127.0.0.1:8080/")
        WebDriverWait(driver, 3).until(presenceOfElementLocated(By.cssSelector("#leftRoot table")))
    }

    private fun clearIndexedDb() {
        navigateAndWaitForLoad()
        val leftClear = driver.findElement(By.cssSelector("#leftRoot .btnClear"))
        val rghtClear = driver.findElement(By.cssSelector("#rightRoot .btnClear"))
        leftClear.click()
        rghtClear.click()
        WebDriverWait(driver, 3).until(not(elementToBeClickable(leftClear)))
        WebDriverWait(driver, 3).until(not(elementToBeClickable(rghtClear)))
    }

}
