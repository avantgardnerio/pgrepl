package net.squarelabs.uat


import net.squarelabs.pgrepl.App
import org.junit.AfterClass
import org.junit.Assert
import org.junit.BeforeClass
import org.junit.Test
import org.openqa.selenium.WebDriver
import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.chrome.ChromeOptions
import org.openqa.selenium.remote.DesiredCapabilities



class AcceptanceTest {

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

    companion object {

        lateinit var driver: WebDriver

        @BeforeClass
        @JvmStatic
        @Throws(Exception::class)
        fun setup() {
            val chromeOptions = ChromeOptions()
            //chromeOptions.setBinary("/path/to/google-chrome-stable")
            chromeOptions.addArguments("--headless")
            chromeOptions.addArguments("--disable-gpu")

            val dc = DesiredCapabilities()
            dc.isJavascriptEnabled = true
            dc.setCapability(
                    ChromeOptions.CAPABILITY, chromeOptions
            )
            driver = ChromeDriver(dc)

            val app = App()
            app.start()
        }

        @AfterClass
        @JvmStatic
        fun tearDown() {
            driver.close()
        }
    }
}
