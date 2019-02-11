package kmg.sample.ca.java.type;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Date;

/**
 * 番号022：日付・時刻
 *
 * @author KenichiroArai
 */
public class Num022DateTime {

    /**
     * 悪い例<br>
     */
    @SuppressWarnings("static-method")
    public void badExample() {

        System.out.println("悪い例");

        /* java.util.Dateを使用して現在日を取得 */
        final Date now = new Date();

        /* シンプルデータフォーマットを使用して、yyyy-MM-ddで出力 */
        final SimpleDateFormat sdf1 = new SimpleDateFormat("yyyy-MM-dd");
        final String dateStr1 = sdf1.format(now);
        System.out.println(dateStr1);

        /* シンプルデータフォーマットを使用して、MM/ddで出力 */
        final SimpleDateFormat sdf2 = new SimpleDateFormat("MM/dd");
        final String dateStr2 = sdf2.format(now);
        System.out.println(dateStr2);

    }

    /**
     * 原則の例<br>
     */
    @SuppressWarnings("static-method")
    public void basicExample() {

        System.out.println("原則の例");

        /* java.time.LocalDateを使用して現在日を取得 */
        final LocalDate now = LocalDate.now();

        /* 日付/時刻フォーマッターを使用して、yyyy-MM-ddで出力 */
        final String dateStr1 = now.format(DateTimeFormatter.ISO_DATE);
        System.out.println(dateStr1);

        /* 日付/時刻フォーマッターを使用して、MM/ddで出力 */
        final String dateStr2 = now.format(DateTimeFormatter.ofPattern("MM/dd"));
        System.out.println(dateStr2);
    }

    /**
     * エントリポイント
     *
     * @param args
     *                 引数
     */
    public static void main(final String[] args) {

        final Num022DateTime proc = new Num022DateTime();
        proc.badExample();
        System.out.println();
        proc.basicExample();

    }

}
