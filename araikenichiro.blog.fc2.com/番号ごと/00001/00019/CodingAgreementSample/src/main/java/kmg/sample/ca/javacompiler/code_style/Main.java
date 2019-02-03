package kmg.sample.ca.javacompiler.code_style;

/**
 * メイン
 *
 * @author KenichiroArai
 */
public class Main {

    /** クラス変数1 */
    private static int staticVar1 = 1;

    /** クラス変数2 */
    private static int staticVar2 = 1;

    /**
     * クラス変数2を取得する。
     *
     * @return クラス変数2
     */
    public static int getStaticVar2() {

        final int result = Main.staticVar2;
        return result;
    }

    /**
     * 静的クラス
     *
     * @author KenichiroArai
     */
    static class StaticClass {

        /**
         * 処理
         */
        @SuppressWarnings("static-method")
        public void proc() {

            /* エンクロージング型のアクセス不可メンバーへのアクセス */
            // ネストした内側のクラスを入れ子クラス、エンクロージング型やネストしたクラスという。
            System.out.println("v1  :" + Main.staticVar1);       // エンクロージング型のアクセス不可メンバーへのアクセス
            System.out.println("v1  :" + Main.getStaticVar2());       // 対策
        }
    }

    /**
     * 処理
     *
     * @param arg
     *            オプション
     * @return 処理結果
     */
    @SuppressWarnings("static-method")
    public String proc(final String arg) {

        final String result = null;

        System.out.println("Hello World!");
        final StaticClass sc = new StaticClass();
        sc.proc();

        return result;
    }

    /**
     * エントリポイン
     *
     * @param args
     *            オプション
     */
    public static void main(final String[] args) {

        final Main main = new Main();
        main.proc("123");

    }

}
