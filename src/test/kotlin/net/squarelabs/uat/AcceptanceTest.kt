package net.squarelabs.uat

import com.google.inject.Guice
import net.squarelabs.pgrepl.App
import net.squarelabs.pgrepl.DefaultInjector
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.DbService
import org.apache.commons.lang3.StringUtils
import org.eclipse.jetty.util.log.Log
import org.junit.AfterClass
import org.junit.Assert
import org.junit.BeforeClass
import org.junit.Test
import org.openqa.selenium.By
import org.openqa.selenium.WebDriver
import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.chrome.ChromeOptions
import org.openqa.selenium.interactions.Actions
import org.openqa.selenium.remote.DesiredCapabilities
import org.openqa.selenium.support.ui.ExpectedConditions.*
import org.openqa.selenium.support.ui.WebDriverWait

class AcceptanceTest {

    companion object {

        private val LOG = Log.getLogger(AcceptanceTest::class.java)
        lateinit var driver: WebDriver

        private val injector = Guice.createInjector(DefaultInjector())!!
        private val cfgSvc = injector.getInstance(ConfigService::class.java)!!
        private val conSvc = injector.getInstance(ConnectionService::class.java)!!
        private val app = injector.getInstance(App::class.java)!!

        @BeforeClass
        @JvmStatic
        @Throws(Exception::class)
        fun setup() {
            // Database
            val dbName = cfgSvc.getAppDbName()
            val url = cfgSvc.getJdbcDatabaseUrl()
            DbService(url, conSvc).use {
                if (it.list().contains(dbName)) it.drop(dbName)
                it.create(dbName)
            }

            // Selenium
            val chromeOptions = ChromeOptions()
            if(StringUtils.equalsIgnoreCase("true", System.getenv("headless"))) {
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
        fun tearDown() {
            LOG.info("Shutting down AcceptanceTest...")
            app.close()
            driver.close()
            val dbName = cfgSvc.getAppDbName()
            val url = cfgSvc.getJdbcDatabaseUrl()
            DbService(url, conSvc).use {
                it.drop(dbName)
            }
        }
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
        WebDriverWait(driver, 20).until(not(textToBePresentInElement(leftLsnField, originalLsnText)))
        WebDriverWait(driver, 20).until(textToBePresentInElement(rghtLsnField, leftLsnField.text))

        // Assert state convergence
        val leftCount = driver.findElement(By.cssSelector("#leftRoot .numCircles"))
        val rghtCount = driver.findElement(By.cssSelector("#rightRoot .numCircles"))
        Assert.assertEquals("given two clients, when the LSNs match, the circle count should be equal", leftCount.text, rghtCount.text)
    }

    fun browseAndWaitForConnect() {
        val baseUrl = "http://127.0.0.1:8080/"
        driver.get(baseUrl)
        WebDriverWait(driver, 20).until(not(textToBe(By.cssSelector("#leftRoot .lsn"), "0")))
    }

}
