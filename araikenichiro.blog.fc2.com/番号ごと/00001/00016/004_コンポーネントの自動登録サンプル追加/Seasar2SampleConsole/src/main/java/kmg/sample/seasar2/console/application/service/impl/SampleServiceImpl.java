/**
 *
 */
package kmg.sample.seasar2.console.application.service.impl;

import javax.annotation.Resource;

import kmg.sample.seasar2.console.application.logic.SampleLogic;
import kmg.sample.seasar2.console.application.service.SampleService;

/**
 * サンプルサービス
 *
 * @author KenichiroArai
 */
public class SampleServiceImpl implements SampleService {

    /** サンプルロジック */
    @Resource
    private SampleLogic sampleLogic;

    /**
     * {@inheritDoc}
     */
    @Override
    public void process() {

        this.sampleLogic.process();
    }

}
