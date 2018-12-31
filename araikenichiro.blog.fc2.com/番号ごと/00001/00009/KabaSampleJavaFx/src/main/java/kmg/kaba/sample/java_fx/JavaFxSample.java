package kmg.kaba.sample.java_fx;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Path;
import java.nio.file.Paths;

import javafx.application.Application;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.layout.AnchorPane;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

/**
 * JavaFXのサンプル
 */
public class JavaFxSample extends Application {

    /** 主ステージ */
    private Stage     primaryStage;

    /** 入力ファイルテキストボックス */
    @FXML
    private TextField txtInputFile;

    /** 入力ファイル読み込みボタン */
    @FXML
    private Button    btnInputFileOpen;

    /** 出力ファイルテキストボックス */
    @FXML
    private TextField txtOutputFile;

    /** 出力ファイル読み込みボタン */
    @FXML
    private Button    btnOutputFileOpen;

    /** 実行ボタン */
    @FXML
    private Button    btnRun;

    /** 処理時間ラベル */
    @FXML
    private Label     lblProcTime;

    /** 処理時間単位ラベル */
    @FXML
    private Label     lblProcTimeUnit;

    /**
     * エントリポイント
     *
     * @param args
     *            オプション
     */
    public static void main(final String[] args) {

        Application.launch(args);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void start(final Stage stage) {

        this.primaryStage = stage;

        stage.setTitle("JavaFxSample");
        try {
            final URL url = this.getClass().getResource("JavaFxSample.fxml");
            final FXMLLoader fxml = new FXMLLoader(url);
            AnchorPane root;
            root = fxml.load();
            final Scene scene = new Scene(root);
            this.primaryStage.setScene(scene);
            this.primaryStage.show();
        } catch (final IOException e) {
            e.printStackTrace();
        }
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

    /**
     * 入力ファイル読み込みボタンクリックイベント
     *
     * @param event
     *            アクションイベント
     */
    @FXML
    private void onCalcInputFileOpenClicked(final ActionEvent event) {

        final FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("ファイル選択");
        String defaultFilePath = this.txtInputFile.getText();
        if ((defaultFilePath == null) || defaultFilePath.isEmpty()) {
            defaultFilePath = "c:/";
        }
        File defaultFile = new File(defaultFilePath);
        if (defaultFile.isFile()) {
            defaultFile = defaultFile.getParentFile();
        }
        fileChooser.setInitialDirectory(defaultFile);
        final File file = fileChooser.showOpenDialog(this.primaryStage);
        this.txtInputFile.setText(file.getAbsolutePath());
    }

    /**
     * 出力ファイル読み込みボタンクリックイベント
     *
     * @param event
     *            アクションイベント
     */
    @FXML
    private void onCalcOutputFileOpenClicked(final ActionEvent event) {

        final FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("ファイル選択");
        String defaultFilePath = this.txtOutputFile.getText();
        if ((defaultFilePath == null) || defaultFilePath.isEmpty()) {
            defaultFilePath = "c:/";
        }
        File defaultFile = new File(defaultFilePath);
        if (defaultFile.isFile()) {
            defaultFile = defaultFile.getParentFile();
        }
        fileChooser.setInitialDirectory(defaultFile);
        final File file = fileChooser.showOpenDialog(this.primaryStage);
        this.txtOutputFile.setText(file.getAbsolutePath());
    }

    /**
     * 実行ボタンクリックイベント
     *
     * @param event
     *            アクションイベント
     */
    @FXML
    private void onCalcRunClicked(final ActionEvent event) {

        final long startTime = System.nanoTime();
        try {
            // メイン処理
            final Path inputPath = Paths.get(this.txtInputFile.getText());
            final Path outputPath = Paths.get(this.txtOutputFile.getText());
            this.mainProc(inputPath, outputPath);
        } finally {
            final long endTime = System.nanoTime();
            final String[] time = JavaFxSample.getTime(startTime, endTime);
            this.lblProcTime.setText(String.valueOf(time[0]));
            this.lblProcTimeUnit.setText(String.valueOf(time[1]));
        }
    }

    /**
     * メイン処理
     *
     * @param inputPath
     *            入力パス
     * @param outputPath
     *            出力パス
     */
    @SuppressWarnings("static-method")
    protected void mainProc(final Path inputPath, final Path outputPath) {

        System.out.println(String.format("入力ファイルパス：%s", inputPath.toAbsolutePath()));
        System.out.println(String.format("出力ファイルパス：%s", outputPath.toAbsolutePath()));

    }
}
