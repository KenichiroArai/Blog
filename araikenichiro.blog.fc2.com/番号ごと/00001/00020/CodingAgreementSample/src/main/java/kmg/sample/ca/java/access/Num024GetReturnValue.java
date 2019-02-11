package kmg.sample.ca.java.access;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * 番号024：戻り値の取得
 *
 * @author KenichiroArai
 */
public class Num024GetReturnValue {

    /**
     * 悪い例<br>
     *
     * @param dateStr
     *                    日付（yyyy/MM/dd形式の文字列）
     */
    @SuppressWarnings("static-method")
    public void badExample(final String dateStr) {

        System.out.println(LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("yyyy/MM/dd"))
                .format(DateTimeFormatter.ofPattern("MM/dd")));

        System.out.println(Math.random() * 100);
    }

    /**
     * 原則の例<br>
     *
     * @param dateStr
     *                    日付（yyyy/MM/dd形式の文字列）
     */
    @SuppressWarnings("static-method")
    public void basicExample(final String dateStr) {

        // 原則変数の値に設定
        final DateTimeFormatter dtfYyyyMmDd = DateTimeFormatter.ofPattern("yyyy/MM/dd");
        final LocalDate date = LocalDate.parse(dateStr, dtfYyyyMmDd);

        // DateTimeFormatter.ofPatternは戻り値が決まっているため、冗長と判断した場合は省略可能
        final String dateStrMmDd = date.format(DateTimeFormatter.ofPattern("MM/dd"));

        System.out.println(dateStrMmDd);

        // 値の特定ができない下記のようなメソッドやDBからの取得などは原則に出来るだけ順守する
        final double random = Math.random();
        final double calcValue = random * 100;
        System.out.println(calcValue);

    }

    /**
     * エントリポイント
     *
     * @param args
     *                 引数
     */
    public static void main(final String[] args) {

        final Num024GetReturnValue proc = new Num024GetReturnValue();

        System.out.println("悪い例");
        proc.badExample("2019/02/11");
        System.out.println();
        System.out.println("原則の例");
        proc.basicExample("2019/02/11");

    }

}
