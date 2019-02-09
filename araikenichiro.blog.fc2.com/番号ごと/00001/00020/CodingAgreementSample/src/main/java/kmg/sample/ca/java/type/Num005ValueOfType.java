package kmg.sample.ca.java.type;

import java.time.LocalDate;
import java.time.Month;
import java.time.format.DateTimeFormatter;

/**
 * 番号005：値の型
 *
 * @author KenichiroArai
 */
public class Num005ValueOfType {

    /** 悪い例 */
    private final String    badExample   = "2019/02/09";

    /** 原則の例 */
    private final LocalDate basicExample = LocalDate.of(2019, Month.FEBRUARY, 9);

    /**
     * 悪い例<br>
     *
     * @return 悪い例の年月日
     */
    public String badExample() {

        String result = null;

        final LocalDate temp = LocalDate.parse(this.badExample, DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        result = temp.format(DateTimeFormatter.ofPattern("MM/dd"));

        return result;

    }

    /**
     * 原則の例<br>
     *
     * @return 原則の例の年月日
     */
    public String basicExample() {

        final String result = this.basicExample.format(DateTimeFormatter.ofPattern("MM/dd"));
        return result;

    }

    /**
     * エントリポイント
     *
     * @param args
     *                 引数
     */
    public static void main(final String[] args) {

        final Num005ValueOfType proc = new Num005ValueOfType();
        System.out.println(String.format("悪い例:%s", proc.badExample()));
        System.out.println(String.format("原則の例:%s", proc.basicExample()));

    }

}
