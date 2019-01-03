/**
 *
 */
package kmg.mukamuka.serivce.sample.poi;

import java.nio.file.Path;

/**
 * POIサンプルサービスインタフェース
 *
 * @author KenichiroArai
 */
public interface PoiSampleService {

    /**
     * メイン処理
     *
     * @param inputPath
     *            入力パス
     * @param outputPath
     *            出力パス
     */
    void mainProc(final Path inputPath, final Path outputPath);
}
