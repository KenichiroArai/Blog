/**
 *
 */
package kmg.sample.seasar2.console.application;

import org.junit.runner.manipulation.Sorter;
import org.seasar.framework.unit.Seasar2;

/**
 * ソートされたSeasar2
 *
 * @author KenichiroArai
 */
public class SortedSeasar2 extends Seasar2 {

    /**
     * コンストラクタ
     *
     * @param clazz
     *            クラス
     * @throws Exception
     *             例外
     */
    public SortedSeasar2(final Class<?> clazz) throws Exception {

        super(clazz);

        /* メソッド順に実行できるように設定 */
        super.sort(new Sorter((o1, o2) -> o1.getMethodName().compareTo(o2.getMethodName())));
    }

}
