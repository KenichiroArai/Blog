package kmg.sample.ca.java.comment;

/**
 * 番号011：if文などのコメント
 *
 * @author KenichiroArai
 */
public class Num011CommentSuchAsIfStatement {

    /**
     * 悪い例<br>
     *
     * @param str1
     *                 文字列１
     * @param str2
     *                 文字列２
     * @return 結果
     */
    @SuppressWarnings("static-method")
    public String badExample(final String str1, final String str2) {

        String result = null;

        if (str1 == null) {
            // 文字列１がnull
            return result;
        }

        if (str2 == null) {
            // 文字列２がnull
            return result;
        }

        if (str1.length() <= 3) {
            // 文字列１の長さが3以下

            if (str2.length() > 5) {
                // 文字列２の長さが5以上
                return result;
            } else if ((str2.length() - str1.length()) > 3) {
                // 文字列２と文字列１の差が3以上
                return result;
            }
        } else if (str1.length() <= 5) {
            // 文字列１の長さが5以下
            System.out.println("文字列１の長さが5以下");
        }

        result = "正常";
        return result;

    }

    /**
     * 原則の例<br>
     *
     * @param str1
     *                 文字列１
     * @param str2
     *                 文字列２
     * @return 結果
     */
    @SuppressWarnings("static-method")
    public String basicExample(final String str1, final String str2) {

        String result = null;

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

        // 文字列１の長さ
        if (str1.length() <= 3) {
            // 3以下

            // 文字列２の長さが5以上か
            if (str2.length() > 5) {
                // 5以上
                return result;
            }

            // if文と合わせる合わない場合は切り分ける
            // 文字列２と文字列１の差が3以上か
            if ((str2.length() - str1.length()) > 3) {
                // 3以上
                return result;
            }
        } else if (str1.length() <= 5) {
            // 5以下
            System.out.println("文字列１の長さが5以下");
        }

        result = "正常";
        return result;

    }

    /**
     * エントリポイント
     *
     * @param args
     *                 引数
     */
    public static void main(final String[] args) {

        final Num011CommentSuchAsIfStatement proc = new Num011CommentSuchAsIfStatement();
        System.out.println(proc.badExample(null, null));
        System.out.println(proc.badExample("123", null));
        System.out.println(proc.badExample(null, "456"));
        System.out.println(proc.badExample("123", "456"));
        System.out.println(proc.badExample("1234", "123"));
        System.out.println(proc.basicExample(null, null));
        System.out.println(proc.basicExample("123", null));
        System.out.println(proc.basicExample(null, "456"));
        System.out.println(proc.basicExample("123", "456"));
        System.out.println(proc.basicExample("1234", "123"));

    }

}
