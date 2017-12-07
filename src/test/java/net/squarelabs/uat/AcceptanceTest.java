package net.squarelabs.uat;

import net.squarelabs.pgrepl.App;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

public class AcceptanceTest {

    static WebDriver driver;

    @BeforeClass
    public static void setup() throws Exception {
        System.setProperty("webdriver.chrome.driver", "/usr/bin/chdriver");
        driver = new ChromeDriver();
        App app = new App();
        app.start();
    }

    @AfterClass
    public static void tearDown() {
        driver.close();
    }

    @Test
    public void test() {
        try {
            System.out.println("--- AcceptanceTest");
            String baseUrl = "http://127.0.0.1:8080/";
            String expectedTitle = "Jetty WebSocket Echo Examples";
            driver.get(baseUrl);

            String actualTitle = driver.getTitle();
            Assert.assertEquals(expectedTitle, actualTitle);
            System.out.println("--- AcceptanceTest: Passed " + actualTitle);
        } catch (Exception ex) {
            System.out.println("--- AcceptanceTest: FAILED " );
            ex.printStackTrace();
        }
    }
}
