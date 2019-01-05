package kmg.gori.dao;

import java.nio.file.Path;

/**
 * XMLサンプルDAO
 *
 * @author KenichiroArai
 */
public interface XmlSampleDao {

    /**
     * 読み込み
     *
     * @param inputPath
     *            入力パス
     */
    void read(final Path inputPath);

    /**
     * 書き込み
     *
     * @param outputPath
     *            出力パス
     */
    void write(final Path outputPath);
}
