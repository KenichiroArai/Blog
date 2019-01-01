package kmg.mukamuka.types.file;

import java.util.HashMap;
import java.util.Map;

import kmg.mukamuka.type.sys.MmString;

/**
 * ファイル一覧実行方法の種類
 *
 * @author KenichiroArai
 */
public enum FileListExecuteMethodTypes {

    /* 定義：開始 */

    /** 指定無し */
    NONE("指定無し", MmString.EMPTY),

    /** NIO.2 */
    NIO2("NIO.2", "nio.2"),

    /** キュー */
    QUEUE("キュー", "queue"),

    /* 定義：終了 */
    ;

    /** 名称 */
    private String                                               name;

    /** 値 */
    private String                                               value;

    /** 種類のマップ */
    private static final Map<String, FileListExecuteMethodTypes> valuesMap = new HashMap<>();

    static {

        /* 種類のマップにプット */
        for (final FileListExecuteMethodTypes type : FileListExecuteMethodTypes.values()) {
            FileListExecuteMethodTypes.valuesMap.put(type.getValue(), type);
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
    private FileListExecuteMethodTypes(final String name, final String value) {

        this.name = name;
        this.value = value;

    }

    /**
     * 値に該当する種類を返す。
     *
     * @param value
     *            値
     * @return 種類
     */
    public static FileListExecuteMethodTypes getEnum(final String value) {

        final FileListExecuteMethodTypes result = FileListExecuteMethodTypes.valuesMap.get(value);
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
    public String getValue() {

        final String result = this.value;
        return result;
    }

    /**
     * 値を返す。
     *
     * @return 値
     */
    @Override
    public String toString() {

        final String result = this.value;
        return result;
    }

}
