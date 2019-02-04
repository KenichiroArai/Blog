package kmg.sample.ca.java.enumeration.types;

import java.util.HashMap;
import java.util.Map;

/**
 * サンプルステータスの種類
 *
 * @author KenichiroArai
 */
public enum SampleStatusTypes {

    /* 定義：開始 */

    /** 指定無し */
    NONE("指定無し", null),

    /** 致命的 */
    FATAL("致命", -2),

    /** エラー */
    ERROR("エラー", -1),

    /** 警告 */
    WARN("警告", 0),

    /** 成功 */
    SUCCESS("成功", 1),

    /* 定義：終了 */
    ;

    /** 名称 */
    private String                                       name;

    /** 値 */
    private Integer                                      value;

    /** 種類のマップ */
    private static final Map<Integer, SampleStatusTypes> valuesMap = new HashMap<>();

    static {

        /* 種類のマップにプット */
        for (final SampleStatusTypes type : SampleStatusTypes.values()) {
            SampleStatusTypes.valuesMap.put(type.getValue(), type);
        }
    }

    /**
     * コンストラクタ
     *
     * @param name
     *                  名称
     * @param value
     *                  値
     */
    private SampleStatusTypes(final String name, final Integer value) {

        this.name = name;
        this.value = value;

    }

    /**
     * 値に該当する種類を返す。
     *
     * @param value
     *                  値
     * @return 種類
     */
    public static SampleStatusTypes getEnum(final Integer value) {

        final SampleStatusTypes result = SampleStatusTypes.valuesMap.get(value);
        return result;
    }

    /**
     * 名称を返す。
     *
     * @return 名称
     */
    public String getName() {

        final String result = this.name;
        return result;
    }

    /**
     * 値を返す。
     *
     * @return 値
     */
    public Integer getValue() {

        final Integer result = this.value;
        return result;
    }

    /**
     * 値を返す。
     *
     * @return 値
     */
    @Override
    public String toString() {

        final String result = String.valueOf(this.value);
        return result;
    }

}
