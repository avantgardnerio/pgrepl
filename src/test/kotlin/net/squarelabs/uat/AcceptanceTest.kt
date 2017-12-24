package net.squarelabs.uat

import com.google.inject.Guice
import net.squarelabs.pgrepl.App
import net.squarelabs.pgrepl.DefaultInjector
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.DbService
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
            chromeOptions.addArguments("--headless") // TODO: override with env var for local testing
            chromeOptions.addArguments("--disable-gpu")
            val dc = DesiredCapabilities()
            dc.isJavascriptEnabled = true
            dc.setCapability(
                    ChromeOptions.CAPABILITY, chromeOptions
            )
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
    fun twoClientsShouldConvergeOnSameState() {
        // Browse
        val baseUrl = "http://127.0.0.1:8080/"
        driver.get(baseUrl)
        val svg = driver.findElement(By.cssSelector("#leftRoot svg"))
        Assert.assertNotNull("given I am on the home page, then I see a canvas", svg)

        // Wait for initial sync
        val leftLsnField = driver.findElement(By.cssSelector("#leftRoot .lsn"))
        WebDriverWait(driver, 20).until(not(textToBe(By.cssSelector("#leftRoot .lsn"), "0")))
        val originalLsnText = leftLsnField.text
        val originalLsn = originalLsnText.toLong()

        // Click and wait for left client to update
        Actions(driver).moveToElement(svg, 10, 25).click().build().perform()
        WebDriverWait(driver, 20).until(not(textToBePresentInElement(leftLsnField, originalLsnText)))
        val newLsnText = leftLsnField.text
        val newLsn = newLsnText.toLong()
        val diff = newLsn - originalLsn
        Assert.assertTrue("given an initial LSN, when the canvas is clicked, then the LSN increases monotonically", diff > 0)

        // Wait for update to reach right client, and when it does, ensure states are identical
        val rghtLsnField = driver.findElement(By.cssSelector("#rightRoot .lsn"))
        WebDriverWait(driver, 20).until(textToBePresentInElement(rghtLsnField, newLsnText))

        // Assert state convergence
        val leftCircleCount = driver.findElement(By.cssSelector("#leftRoot .numCircles"))
        val rghtCircleCount = driver.findElement(By.cssSelector("#rightRoot .numCircles"))
        val leftCount = leftCircleCount.text.toLong()
        val rghtCount = rghtCircleCount.text.toLong()
        println("left=${leftCount} right=${rghtCount}")
        Assert.assertEquals("given two clients, when the LSNs match, the circle count should be equal", leftCount, rghtCount)
    }

}
