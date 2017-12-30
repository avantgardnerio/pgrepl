package net.squarelabs.uat

import com.google.inject.Guice
import com.google.inject.Injector
import net.squarelabs.pgrepl.App
import net.squarelabs.pgrepl.DefaultInjector
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
import org.openqa.selenium.remote.DesiredCapabilities
import org.openqa.selenium.support.ui.ExpectedConditions.*
import org.openqa.selenium.support.ui.WebDriverWait

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

    @Test
    fun `clients should begin in expected state`() {

        // Setup
        val expected = this.javaClass.getResource("/fixtures/initialState.json").readText()
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
    fun `clients should insert while disconnected`() {

        // Setup
        clearIndexedDb()
        navigateAndWaitForLoad()

        // Exercise
        val svg = driver.findElement(By.cssSelector("#leftRoot svg"))

        // Exercise
        Actions(driver).moveToElement(svg, 10, 25).click().build().perform()
        WebDriverWait(driver, 3).until(presenceOfElementLocated(By.cssSelector("#leftRoot circle")))
        val circle = driver.findElement(By.cssSelector("#leftRoot circle"))
        val numCircles = driver.findElement(By.cssSelector("#leftRoot .numCircles")).text
        val logLength = driver.findElement(By.cssSelector("#leftRoot .logLength")).text

        // Assert
        Assert.assertNotNull("given offline mode, when canvas is clicked, then a circle should be created", circle)
        Assert.assertEquals("when a circle is visible, then there should be a record in the database", "1", numCircles)
        Assert.assertEquals("given offline mode, when a circle is created, then there should be a transaction in the log", "1", logLength)
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
