package kmg.sample.ca.java.enumeration;

import java.util.stream.IntStream;

import kmg.sample.ca.java.enumeration.types.SampleStatusTypes;

/**
 * 番号012：switch文の利用
 *
 * @author KenichiroArai
 */
public class Num012UseOfSwitch {

    /** サンプルステータスの種類：致命的 */
    private static final int SAMPLE_STATUS_TYPES_FATAL   = -2;

    /** サンプルステータスの種類：エラー */
    private static final int SAMPLE_STATUS_TYPES_ERROR   = -1;

    /** サンプルステータスの種類：警告 */
    private static final int SAMPLE_STATUS_TYPES_WARN    = 0;

    /** サンプルステータスの種類：成功 */
    private static final int SAMPLE_STATUS_TYPES_SUCCESS = 1;

    /**
     * 悪い例<br>
     * ステータスによる返却値の違い<br>
     *
     * @param status
     *                   ステータス
     * @return "成功":成功の場合、null：警告以上の場合
     */
    @SuppressWarnings("static-method")
    public String badExample(final int status) {

        String result = null;

        if (status < Num012UseOfSwitch.SAMPLE_STATUS_TYPES_FATAL) {
            System.out.print(String.valueOf("エラー"));
            return result;
        }

        if (status <= Num012UseOfSwitch.SAMPLE_STATUS_TYPES_WARN) {
            return result;
        }

        if (status > Num012UseOfSwitch.SAMPLE_STATUS_TYPES_SUCCESS) {
            System.out.print(String.valueOf("エラー"));
            return result;
        }

        result = "成功";          // サンプルとしてハードコードで実装しているが、本来はこれも列挙型で行うこと。
        return result;

    }

    /**
     * 原則の例<br>
     * ステータスによる返却値の違い<br>
     *
     * @param status
     *                   ステータス
     * @return "成功":成功の場合、null：警告以上の場合
     */
    @SuppressWarnings("static-method")
    public String basicExample(final int status) {

        String result = null;

        final SampleStatusTypes sampleStatus = SampleStatusTypes.getEnum(status);
        switch (sampleStatus) {
            case NONE:
                // 指定無しの場合は処理に応じて対応する。
                System.out.print(String.valueOf("エラー"));
                return result;
            case FATAL:
            case ERROR:
            case WARN:
                return result;
            case SUCCESS:
                result = "成功";          // サンプルとしてハードコードで実装しているが、本来はこれも列挙型で行うこと。
                break;
            default:
                System.out.print(String.valueOf("エラー"));
                // 本来であればエラー処理を記載する。
                return result;

        }
        return result;

    }

    /**
     * エントリポイント
     *
     * @param args
     *                 引数
     */
    public static void main(final String[] args) {

        final Num012UseOfSwitch proc = new Num012UseOfSwitch();
        System.out.println("悪い例");
        IntStream.rangeClosed(-3, 2).forEach(i -> {
            System.out.println(String.format("%d:%s", i, proc.badExample(i)));
        });
        System.out.println();

        System.out.println("原則の例");
        IntStream.rangeClosed(-3, 2).forEach(i -> {
            System.out.println(String.format("%d:%s", i, proc.basicExample(i)));
        });

    }

}
