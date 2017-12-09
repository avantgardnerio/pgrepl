package net.squarelabs.uat

import com.google.inject.AbstractModule
import com.google.inject.Guice
import net.squarelabs.pgrepl.App
import net.squarelabs.pgrepl.services.ConfigService
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

        @BeforeClass
        @JvmStatic
        @Throws(Exception::class)
        fun setup() {
            // Database
            val dbName = ConfigService().getAppDbName()
            val url = ConfigService().getJdbcDatabaseUrl()
            val db = DbService(url)
            db.drop(dbName)
            db.create(dbName)

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
            val injector = Guice.createInjector(object : AbstractModule() {
                public override fun configure() {
                    //bind(ConfigService::class.java).to(ConfigService::class.java)
                }
            })
            val app: App = injector.getInstance(App::class.java)
            app.start()
        }

        @AfterClass
        @JvmStatic
        fun tearDown() {
            driver.close()
            val dbName = ConfigService().getAppDbName()
            val url = ConfigService().getJdbcDatabaseUrl()
            val db = DbService(url)
            db.drop(dbName)
        }
    }

    @Test
    fun test() {
        try {
            println("--- AcceptanceTest")
            val baseUrl = "http://127.0.0.1:8080/"
            val expectedTitle = "Jetty WebSocket Echo Examples"
            driver.get(baseUrl)

            val actualTitle = driver.title
            Assert.assertEquals(expectedTitle, actualTitle)
            println("--- AcceptanceTest: Passed " + actualTitle)
        } catch (ex: Exception) {
            println("--- AcceptanceTest: FAILED ")
            ex.printStackTrace()
        }

    }

}
