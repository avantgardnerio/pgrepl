package net.squarelabs.uat

import com.google.inject.Guice
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

    companion object {

        private val LOG = Log.getLogger(AcceptanceTest::class.java)
        lateinit var driver: WebDriver

        private val injector = Guice.createInjector(DefaultInjector())!!
        private val cfgSvc = injector.getInstance(ConfigService::class.java)!!
        private val conSvc = injector.getInstance(ConnectionService::class.java)!!
        private val dbSvc = injector.getInstance(DbService::class.java)!!
        private val app = injector.getInstance(App::class.java)!!

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
            app.start()
        }

        @AfterClass
        @JvmStatic
        fun close() {
            LOG.info("Shutting down AcceptanceTest...")
            app.close()
            driver.close()
        }
    }

    @Before
    fun setup() {
        // Database
        val dbName = cfgSvc.getAppDbName()
        if (dbSvc.list().contains(dbName)) dbSvc.drop(dbName)
        dbSvc.create(dbName)
        val flyway = Flyway()
        flyway.setDataSource(cfgSvc.getAppDbUrl(), null, null)
        flyway.migrate()
    }

    @After
    fun tearDown() {
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
    @Ignore
    fun `state of two clients should converge on update`() {
        // Setup
        val id = UUID.randomUUID().toString()
        val curTxnId = UUID.randomUUID().toString()
        val circle = Circle(id, 10, 10, 20, "red", "1px", "blue", curTxnId, null)
        dbSvc.insert(cfgSvc.getAppDbUrl(), circle)

        val circleEl = driver.findElement(By.id(id))
        (driver as HasInputDevices).mouse.mouseDown((circleEl as Locatable).coordinates)
    }

    fun browseAndWaitForConnect() {
        val baseUrl = "http://127.0.0.1:8080/"
        driver.get(baseUrl)
        WebDriverWait(driver, 3).until(not(textToBe(By.cssSelector("#leftRoot .lsn"), "0")))
        WebDriverWait(driver, 3).until(not(textToBe(By.cssSelector("#rightRoot .lsn"), "0")))
    }

}
