package kmg.sample;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * SeleniumSample
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
        final String baseUrl = "http://www.google.co.jp/";
        final WebDriver driver = new EdgeDriver();
        try {
            driver.get(baseUrl);
            final WebDriverWait wait = new WebDriverWait(driver, 60);
            final WebElement qWe = wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("q")));
            qWe.sendKeys("Selenium");
            final WebElement btnKWe = wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("btnK")));
            btnKWe.submit();
            try {
                Thread.sleep(2000);
            } catch (final InterruptedException e) {
                e.printStackTrace();
            }
        } finally {
            driver.quit();
        }

        System.out.println("終了");
    }
}
