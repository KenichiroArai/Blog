/**
 *
 */
package kmg.mukamuka.sample.service.sample.impl;

import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.AccessDeniedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Queue;
import java.util.stream.Stream;

import kmg.mukamuka.sample.service.sample.FileListSampleService;
import kmg.mukamuka.types.ctl.ConcurrentOfLevelTypes;
import kmg.mukamuka.types.file.FileListExecuteMethodTypes;

/**
 * ファイル一覧のサンプルサービス
 *
 * @author KenichiroArai
 */
public class FileListSampleServiceImpl implements FileListSampleService {

    /**
     * エントリポイント
     *
     * @param args
     *            オプション
     */
    public static void main(final String[] args) {

        final FileListSampleService sample = new FileListSampleServiceImpl();

        final Path inputPath = Paths.get("C:\\pleiades");
        final Path outputPath = Paths.get("d:/");

        sample.mainProc(inputPath, outputPath, FileListExecuteMethodTypes.NIO2);

    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void mainProc(final Path inputPath, final Path outputPath,
            final FileListExecuteMethodTypes fileListExecuteMethod) {

        System.out.println(String.format("入力ファイルパス：%s", inputPath.toAbsolutePath()));
        System.out.println(String.format("出力ファイルパス：%s", outputPath.toAbsolutePath()));

        switch (fileListExecuteMethod) {
            case NONE:
                break;
            case NIO2:
                this.listFileForNio2(inputPath, ConcurrentOfLevelTypes.SINGLE);
                break;
            case QUEUE:
                this.listFileForQueue(inputPath);
                break;
            default:
                break;
        }

    }

    /**
     * ファイルリスト（NIO.2形式）
     *
     * @param inputPath
     *            入力パス
     * @param concurrentOfLevel
     *            並行レベル
     */
    private void listFileForNio2(final Path inputPath, final ConcurrentOfLevelTypes concurrentOfLevel) {

        final long startTime = System.nanoTime();
        try {
            try {
                @SuppressWarnings("resource")
                Stream<Path> stream = Files.walk(inputPath);
                switch (concurrentOfLevel) {
                    case NONE:
                    case SINGLE:
                        break;
                    case PARALLEL:
                        stream = stream.parallel();
                        break;
                    default:
                        break;
                }
                stream.forEach(t -> this.fileProc(t));
            } catch (final UncheckedIOException e) {
                // アクセス権限なし
                System.err.println(e.getMessage());
            } catch (final AccessDeniedException e) {
                // アクセス権限なし
                System.err.println(e.getFile());
            } catch (final IOException e) {
                e.printStackTrace();
            }
        } finally {
            final long endTime = System.nanoTime();
            final String[] time = FileListSampleServiceImpl.getTime(startTime, endTime);
            System.out.println(String.format("%s%s", time[0], time[1]));
        }

    }

    /**
     * ファイルリスト（キュー形式）
     *
     * @param inputPath
     *            入力パス
     */
    private void listFileForQueue(final Path inputPath) {

        final long startTime = System.nanoTime();
        try {
            // 対象ファイルのキュー
            final Queue<File> targetFileQueue = new ArrayDeque<>();

            // 入力パス配下のファイル一覧を対象ファイルのキーにすべて追加
            final File[] inputListFiles = inputPath.toFile().listFiles();
            targetFileQueue.addAll(Arrays.asList(inputListFiles));

            // 全ファイルにアクセスする
            while (!targetFileQueue.isEmpty()) {

                // 対象ファイルの先頭を取り出す
                final File targetFile = targetFileQueue.poll();
                this.fileProc(targetFile.toPath());

                // ディレクトリか
                if (targetFile.isDirectory()) {
                    // ディレクトリの場合

                    // 対象ファイル配下のファイル一覧を対象ファイルのキューに追加する。
                    final File[] targetListFiles = targetFile.listFiles();
                    if (targetListFiles == null) {
                        continue;
                    }
                    targetFileQueue.addAll(Arrays.asList(targetListFiles));
                }
            }
        } finally {
            final long endTime = System.nanoTime();
            final String[] time = FileListSampleServiceImpl.getTime(startTime, endTime);
            System.out.println(String.format("%s%s", time[0], time[1]));
        }
    }

    /**
     * ファイル処理
     *
     * @param targetPath
     *            対象パス
     */
    @SuppressWarnings("static-method")
    private void fileProc(final Path targetPath) {

        System.out.println(targetPath.toString());
    }

    /**
     * 開始時間と終了時間の差を返す。 <br>
     * 単位は時間に応じて設定する。
     *
     * @param startTime
     *            開始時刻
     * @param endTime
     *            終了時刻
     * @return 差の時刻と単位
     */
    private static String[] getTime(final long startTime, final long endTime) {

        final String[] result = new String[2];

        double diffTime = endTime - startTime;
        result[0] = String.valueOf(diffTime);
        result[1] = "ナノ秒";

        if (diffTime >= 1000.0) {
            diffTime /= 1000.0;
            result[1] = "マイクロ秒";
        }
        if (diffTime >= 1000.0) {
            diffTime /= 1000.0;
            result[1] = "ミリ秒";
        }
        if (diffTime >= 1000.0) {
            diffTime /= 1000.0;
            result[1] = "秒";
        }
        result[0] = String.valueOf(diffTime);

        return result;
    }

}
