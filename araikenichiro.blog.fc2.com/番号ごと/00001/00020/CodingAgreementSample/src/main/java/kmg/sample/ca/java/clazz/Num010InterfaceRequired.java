package kmg.sample.ca.java.clazz;

import java.time.LocalDate;

/**
 * 番号010：インタフェース必須
 *
 * @author KenichiroArai
 */
public interface Num010InterfaceRequired {

    /**
     * 悪い例<br>
     *
     * @param date
     *                 日付（yyyy/MM/dd形式）
     * @return 悪い例の年月
     */
    String badExample(final String date);

    /**
     * 原則の例<br>
     *
     * @param date
     *                 日付
     * @return 原則の例の年月
     */
    String basicExample(final LocalDate date);

}
