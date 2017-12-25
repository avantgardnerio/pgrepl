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

    @Test
    fun `state of two clients should converge on insert`() {

        // Setup
        browseAndWaitForConnect()
        val svg = driver.findElement(By.cssSelector("#leftRoot svg"))
        val leftLsnField = driver.findElement(By.cssSelector("#leftRoot .lsn"))
        val rghtLsnField = driver.findElement(By.cssSelector("#rightRoot .lsn"))
        val originalLsnText = leftLsnField.text

        // Exercise
        Actions(driver).moveToElement(svg, 10, 25).click().build().perform()
        WebDriverWait(driver, 3).until(textToBePresentInElement(rghtLsnField, originalLsnText))

        // Assert state convergence
        val leftCount = driver.findElement(By.cssSelector("#leftRoot .numCircles"))
        val rghtCount = driver.findElement(By.cssSelector("#rightRoot .numCircles"))
        Assert.assertEquals("given two clients, when the LSNs match, the circle count should be equal",
                leftCount.text, rghtCount.text
        )
    }

    @Test
    fun `state of two clients should converge on update`() {
        // Setup
        val id = UUID.randomUUID().toString()
        val curtxnid = UUID.randomUUID().toString()
        val circle = Circle(id, 10, 10, 20, "red", "1px", "blue", curtxnid, null)
        dbSvc.insert(cfgSvc.getAppDbUrl(), circle)
        browseAndWaitForConnect()
        val svg = driver.findElement(By.cssSelector("#leftRoot svg")) as Locatable
        val circleEl = driver.findElement(By.id(id)) as Locatable
        val mouse = (driver as HasInputDevices).mouse
        val leftLsnField = driver.findElement(By.cssSelector("#leftRoot .lsn"))
        val originalLsnText = leftLsnField.text

        // Exercise
        mouse.mouseDown(circleEl.coordinates)
        mouse.mouseUp(svg.coordinates)
        WebDriverWait(driver, 3).until(not(textToBePresentInElement(leftLsnField, originalLsnText)))

        // Assert state convergence
        val leftCount = driver.findElement(By.cssSelector("#leftRoot .numCircles"))
        val rghtCount = driver.findElement(By.cssSelector("#rightRoot .numCircles"))
        Assert.assertEquals("given two clients, when the LSNs match, the circle count should be equal",
                leftCount.text, rghtCount.text
        )
    }

    fun browseAndWaitForConnect() {
        val baseUrl = "http://127.0.0.1:8080/"
        driver.get(baseUrl)
        WebDriverWait(driver, 3).until(not(textToBe(By.cssSelector("#leftRoot .lsn"), "0")))
        WebDriverWait(driver, 3).until(not(textToBe(By.cssSelector("#rightRoot .lsn"), "0")))
    }

}
