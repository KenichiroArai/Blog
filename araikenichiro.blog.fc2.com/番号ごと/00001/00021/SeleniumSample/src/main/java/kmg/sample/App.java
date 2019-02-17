package kmg.sample;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.ie.InternetExplorerDriver;

/**
 * Hello world!
 */
public class App {

    /**
     * エントリポイント
     *
     * @param args
     *                 オプション
     */
    public static void main(final String[] args) {

        System.out.println("開始");

        //        final String path = "C:\\Users\\KenichiroArai\\wk\\github_local\\araikenichiro.blog.fc2.com\\番号ごと\\00001\\00021\\SeleniumSample\\lib\\geckodriver.exe";
        final String path = "C:\\Users\\KenichiroArai\\wk\\github_local\\araikenichiro.blog.fc2.com\\番号ごと\\00001\\00021\\SeleniumSample\\lib\\IEDriverServer.exe";
        //System.setProperty("webdriver.gecko.driver", path);
        System.setProperty("webdriver.ie.driver", path);
        //        final WebDriver driver = new FirefoxDriver();
        final WebDriver driver = new InternetExplorerDriver();
        //        final String baseUrl = "http://www.google.co.jp/";
        final String baseUrl = "file:///C:\\Users\\KenichiroArai\\wk\\github_local\\araikenichiro.blog.fc2.com\\番号ごと\\00001\\00021\\SeleniumSample\\web\\index.html";

        try {
            driver.get(baseUrl);
            //            final WebDriverWait wait = new WebDriverWait(driver, 60);
            //            final WebElement qWe = wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("q")));
            final WebElement qWe = driver.findElement(By.name("q"));
            qWe.sendKeys("Selenium");
        } finally {
            driver.quit();
        }

        System.out.println("終了");
    }
}
