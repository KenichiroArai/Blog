package kmg.mukamuka.types.ctl;

import java.util.HashMap;
import java.util.Map;

/**
 * 並行レベルの種類
 *
 * @author KenichiroArai
 */
public enum ConcurrentOfLevelTypes {

    /* 定義：開始 */

    /** 指定無し */
    NONE("指定無し", -1),

    /** シングル */
    SINGLE("シングル", 0),

    /** パラレル */
    PARALLEL("パラレル", 1),

    /* 定義：終了 */
    ;

    /** 名称 */
    private String                                            name;

    /** 値 */
    private Integer                                           value;

    /** 種類のマップ */
    private static final Map<Integer, ConcurrentOfLevelTypes> valuesMap = new HashMap<>();

    static {

        /* 種類のマップにプット */
        for (final ConcurrentOfLevelTypes type : ConcurrentOfLevelTypes.values()) {
            ConcurrentOfLevelTypes.valuesMap.put(type.getValue(), type);
        }
    }

    /**
     * コンストラクタ
     *
     * @param name
     *            名称
     * @param value
     *            値
     */
    private ConcurrentOfLevelTypes(final String name, final int value) {

        this.name = name;
        this.value = Integer.valueOf(value);

    }

    /**
     * 値に該当する種類を返す。
     *
     * @param value
     *            値
     * @return 種類
     */
    public static ConcurrentOfLevelTypes getEnum(final Integer value) {

        final ConcurrentOfLevelTypes result = ConcurrentOfLevelTypes.valuesMap.get(value);
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
