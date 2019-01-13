package kmg.sample.seasar2.console.application.logic.impl;

import javax.annotation.Resource;

import kmg.sample.seasar2.console.application.logic.SampleLogic;
import kmg.sample.seasar2.console.domain.dao.SampleDao;

/**
 * サンプルロジック
 *
 * @author KenichiroArai
 */
public class SampleLogicImpl implements SampleLogic {

    /** サンプルDAO */
    @Resource
    private SampleDao sampleDao;

    /**
     * {@inheritDoc}
     */
    @Override
    public void process() {

        final String searchResult = this.sampleDao.findById("sample");
        System.out.println(searchResult);
    }

}
