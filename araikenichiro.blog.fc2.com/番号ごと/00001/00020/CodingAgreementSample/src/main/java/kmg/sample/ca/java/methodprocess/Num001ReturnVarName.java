/**
 *
 */
package kmg.sample.ca.java.methodprocess;

/**
 * 番号001：returnの変数名
 *
 * @author KenichiroArai
 */
public class Num001ReturnVarName {

    /**
     * 悪い例
     *
     * @return 計算結果
     */
    @SuppressWarnings("static-method")
    public int badExample() {

        final int num = 10;         // 先頭にreturnの変数名「result」で宣言されていない。
        return num * 2;             // 「return result;」以外になっている。

    }

    /**
     * 原則の例
     *
     * @return 計算結果
     */
    @SuppressWarnings("static-method")
    public int BasicExample() {

        int result = 0;             // 先頭にreturnの変数名「result」が宣言されている。
        result = 10 * 2;
        if (result > 10) {
            result -= 5;
            return result;              // 「return result;」になっている。
        }
        return result;              // 「return result;」になっている。

    }

    /**
     * エントリポイント
     *
     * @param args
     *            引数
     */
    public static void main(final String[] args) {

        final Num001ReturnVarName proc = new Num001ReturnVarName();
        proc.badExample();

    }

}
