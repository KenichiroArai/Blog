package kmg.sample.seasar2.console.presentation.cui.console;

import javax.annotation.Resource;

import org.seasar.framework.container.SingletonS2Container;
import org.seasar.framework.container.factory.SingletonS2ContainerFactory;

import kmg.sample.seasar2.console.application.service.SampleService;

/**
 * Seasar2サンプルコンソール
 *
 * @author KenichiroArai
 */
public class Sample {

    /** サンプルロジック */
    @Resource
    private SampleService sampleService;

    /**
     * 処理
     */
    public void process() {

        this.sampleService.process();
    }

    /**
     * エントリポイント
     *
     * @param args
     *            オプション
     */
    public static void main(final String[] args) {

        SingletonS2ContainerFactory.init();

        final Sample sample = SingletonS2Container.getComponent(Sample.class);
        sample.process();

        SingletonS2ContainerFactory.destroy();
    }

}
