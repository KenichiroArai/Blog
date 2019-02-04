/**
 *
 */
package kmg.sample.ca.java.methodprocess;

/**
 * 番号003：if文の階層
 *
 * @author KenichiroArai
 */
public class Num003IfOfHierarchy {

    /** 文字列 */
    private final String str;

    /**
     * デフォルトコンストラクタ
     */
    public Num003IfOfHierarchy() {

        this.str = "ABC";
    }

    /**
     * 悪い例<br>
     * 文字列の結合<br>
     * 文字列１と文字列２に値が設定されているかつ文字列１と文字列２が異なる場合のみ文字列の結合を行う。
     *
     * @param str1
     *                 文字列１
     * @param str2
     *                 文字列２
     * @return 文字列の結合。結合を行わい場合はnullを返す。
     */
    public String badExample(final String str1, final String str2) {

        String result = null;

        // 文字列結合がメインの処理だが、メインの処理が分かりづらい。
        // メインの処理が階層が深く、インデントも多く、読み取りづらい。
        if ((str1 != null) && (str2 != null)) {
            if (!str1.equals(str2)) {
                result = this.str.concat(str1).concat(str2);
            }
        }
        return result;

    }

    /**
     * 原則の例 文字列の結合<br>
     * 文字列１と文字列２に値が設定されているかつ文字列１と文字列２が異なる場合のみ文字列の結合を行う。
     *
     * @param str1
     *                 文字列１
     * @param str2
     *                 文字列２
     * @return 文字列の結合。結合を行わい場合はnullを返す。
     */
    public String basicExample(final String str1, final String str2) {

        String result = null;

        // 事前判定や例外チェックとしてメイン処理にふさわしくない場合はその場で処理を終わらせる。

        // 文字列１がnullか
        if (str1 == null) {
            // nullの場合
            return result;
        }
        // 文字列２がnullか
        if (str2 == null) {
            // nullの場合
            return result;
        }
        // 文字列１＝文字列２か
        if (str1.equals(str2)) {
            // 一致する場合
            return result;
        }

        // メインの処理は文字列の結合だとわかる。
        // この例は、１行だが複数続いても階層の中ではなく、インデントもされていないので見やすい。
        result = this.str.concat(str1).concat(str2);

        return result;

    }

    /**
     * エントリポイント
     *
     * @param args
     *                 引数
     */
    public static void main(final String[] args) {

        final Num003IfOfHierarchy proc = new Num003IfOfHierarchy();
        System.out.println(proc.badExample(null, null));
        System.out.println(proc.badExample("123", null));
        System.out.println(proc.badExample(null, "456"));
        System.out.println(proc.badExample("123", "456"));
        System.out.println(proc.badExample("123", "123"));
        System.out.println(proc.basicExample(null, null));
        System.out.println(proc.basicExample("123", null));
        System.out.println(proc.basicExample(null, "456"));
        System.out.println(proc.basicExample("123", "456"));
        System.out.println(proc.basicExample("123", "123"));

    }

}
