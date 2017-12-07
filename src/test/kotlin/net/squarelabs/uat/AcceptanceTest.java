package net.squarelabs.uat;

import net.squarelabs.pgrepl.Main;
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
        Main.main(new String[] {}); // TODO: non-static app class
    }

    @AfterClass
    public static void tearDown() {
        driver.close();
    }

    @Test
    public void test() {
        String baseUrl = "http://127.0.0.1:8080/";
        String expectedTitle = "Welcome: Mercury Tours";
        driver.get(baseUrl);

        String actualTitle = driver.getTitle();
        Assert.assertEquals(expectedTitle, actualTitle);
    }
}
