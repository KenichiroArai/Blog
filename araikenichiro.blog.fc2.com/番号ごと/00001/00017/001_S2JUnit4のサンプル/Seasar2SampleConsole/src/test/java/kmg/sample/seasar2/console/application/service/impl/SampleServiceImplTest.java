/**
 *
 */
package kmg.sample.seasar2.console.application.service.impl;

import org.junit.Assert;
import org.junit.runner.RunWith;

import kmg.sample.seasar2.console.application.SortedSeasar2;
import kmg.sample.seasar2.console.application.service.SampleService;

/**
 * @author KenichiroArai
 */
@RunWith(SortedSeasar2.class)
public class SampleServiceImplTest {

    /** テスト対象 */
    private SampleService sampleService;

    /**
     * テストサンプル０１
     */
    public void testSample01() {

        final String processResult = this.sampleService.process();

        Assert.assertEquals("Hello World!", processResult);
    }

    /**
     * テストサンプル０２
     */
    public void testSample02() {

        final String processResult = this.sampleService.process();

        Assert.assertEquals("Hello World!", processResult);
    }

    /**
     * テストサンプル０３
     */
    public void testSample03() {

        final String processResult = this.sampleService.process();

        Assert.assertEquals("Hello World!", processResult);
    }

    /**
     * テストサンプル０４
     */
    public void testSample04() {

        final String processResult = this.sampleService.process();

        Assert.assertEquals("Hello World!", processResult);
    }

}
