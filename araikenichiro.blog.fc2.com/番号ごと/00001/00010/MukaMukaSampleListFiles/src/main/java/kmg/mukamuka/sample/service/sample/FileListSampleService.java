package kmg.mukamuka.sample.service.sample;

import java.nio.file.Path;

import kmg.mukamuka.types.file.FileListExecuteMethodTypes;

/**
 * ファイル一覧のサンプルサービスインタフェース
 *
 * @author KenichiroArai
 */
public interface FileListSampleService {

    /**
     * メイン処理
     *
     * @param inputPath
     *            入力パス
     * @param outputPath
     *            出力パス
     * @param fileListExecuteMethod
     *            ファイル一覧実行方法
     */
    void mainProc(final Path inputPath, final Path outputPath, final FileListExecuteMethodTypes fileListExecuteMethod);
}
