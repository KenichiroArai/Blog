package kmg.sample.ca.java.type;

import java.time.LocalDate;
import java.time.Month;
import java.time.format.DateTimeFormatter;

/**
 * 番号006：値の受け渡しの型
 *
 * @author KenichiroArai
 */
public class Num006TypeOfValuePassing {

    /**
     * 悪い例<br>
     *
     * @param date
     *                 日付（yyyy/MM/dd形式）
     * @return 悪い例の年月
     */
    @SuppressWarnings("static-method")
    public String badExample(final String date) {

        String result = null;

        final LocalDate temp = LocalDate.parse(date, DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        result = temp.format(DateTimeFormatter.ofPattern("MM/dd"));

        return result;

    }

    /**
     * 原則の例<br>
     *
     * @param date
     *                 日付
     * @return 原則の例の年月
     */
    @SuppressWarnings("static-method")
    public String basicExample(final LocalDate date) {

        final String result = date.format(DateTimeFormatter.ofPattern("MM/dd"));
        return result;

    }

    /**
     * エントリポイント
     *
     * @param args
     *                 引数
     */
    public static void main(final String[] args) {

        // 悪い例
        final String badExample = "2019/02/09";

        // 原則の例
        final LocalDate basicExample = LocalDate.of(2019, Month.FEBRUARY, 9);

        final Num006TypeOfValuePassing proc = new Num006TypeOfValuePassing();
        System.out.println(String.format("悪い例:%s", proc.badExample(badExample)));
        System.out.println(String.format("原則の例:%s", proc.basicExample(basicExample)));

    }

}
