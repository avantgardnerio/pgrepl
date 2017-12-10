package net.squarelabs.uat

import com.google.inject.Guice
import net.squarelabs.pgrepl.App
import net.squarelabs.pgrepl.DefaultInjector
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.DbService
import org.junit.AfterClass
import org.junit.Assert
import org.junit.BeforeClass
import org.junit.Test
import org.openqa.selenium.WebDriver
import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.chrome.ChromeOptions
import org.openqa.selenium.remote.DesiredCapabilities

class AcceptanceTest {

    companion object {

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
            chromeOptions.addArguments("--headless")
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
    fun test() {
        try {
            val baseUrl = "http://127.0.0.1:8080/"
            val expectedTitle = "Jetty WebSocket Echo Examples"
            driver.get(baseUrl)

            val actualTitle = driver.title
            Assert.assertEquals(expectedTitle, actualTitle)
        } catch (ex: Exception) {
            ex.printStackTrace()
        }

    }

}
