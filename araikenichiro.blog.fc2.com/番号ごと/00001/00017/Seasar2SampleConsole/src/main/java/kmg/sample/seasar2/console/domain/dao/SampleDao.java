/**
 *
 */
package kmg.sample.seasar2.console.domain.dao;

/**
 * サンプルDAO
 *
 * @author KenichiroArai
 */
public class SampleDao {

    /**
     * 検索
     *
     * @param id
     *            ID
     * @return 検索結果
     */
    @SuppressWarnings("static-method")
    public String findById(final String id) {

        String result = null;

        result = "Hello World!";

        return result;
    }
}
