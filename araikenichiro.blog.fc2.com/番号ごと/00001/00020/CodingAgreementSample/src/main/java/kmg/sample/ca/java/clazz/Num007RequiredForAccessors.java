package kmg.sample.ca.java.clazz;

/**
 * 番号007：アクセサの必須
 *
 * @author KenichiroArai
 */
public class Num007RequiredForAccessors {

    /** 悪い例 */
    public String  badExample;

    /** 原則の例 */
    private String basicExample;

    /**
     * 原則の例を設定する。
     *
     * @param basicExample
     *                         原則の例
     */
    public void setBasicExample(final String basicExample) {

        this.basicExample = basicExample;
    }

    /**
     * 原則の例を返す。
     *
     * @return 原則の例
     */
    public String getBasicExample() {

        final String result = this.basicExample;
        return result;
    }

    /**
     * エントリポイント
     *
     * @param args
     *                 引数
     */
    public static void main(final String[] args) {

        final Num007RequiredForAccessors proc = new Num007RequiredForAccessors();
        proc.badExample = "悪い例";
        System.out.println(String.format("悪い例:%s", proc.badExample));
        proc.setBasicExample("原則の例");
        System.out.println(String.format("原則の例:%s", proc.getBasicExample()));

    }

}
