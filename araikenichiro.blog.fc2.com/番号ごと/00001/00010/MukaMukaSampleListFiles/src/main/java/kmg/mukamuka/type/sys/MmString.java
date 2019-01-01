package kmg.mukamuka.type.sys;

/**
 * ムカムカ文字列
 *
 * @author KenichiroArai
 */
public class MmString {

    /** 空 */
    public static final String EMPTY = "";

    /** 値 */
    private String             value;

    /**
     * コンストラクタ
     *
     * @param value
     *            値
     */
    public MmString(final String value) {

        this.value = value;
    }

    /**
     * 値を返す。
     *
     * @return 値
     */
    public String getValue() {

        final String result = this.value;
        return result;
    }

    /**
     * 置換対象文字列を置換文字列に置換する。
     *
     * @param target
     *            置換対象文字列
     * @param replacemen
     *            置換文字列
     */
    public void replace(final CharSequence target, final CharSequence replacemen) {

        this.value = this.value.replace(target, replacemen);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String toString() {

        final String result = this.value;
        return result;
    }

}
