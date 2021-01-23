package wav.sample;

import java.io.File;
import java.io.IOException;

import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioFileFormat.Type;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;

public class WavSample01 {

	public static void main(String[] args) throws Exception {
		File auidoFile = new File("bin/2021-01-16_09-40-01.wav");

		WavSample01 sample = new WavSample01();
		sample.run(auidoFile);
	}

	public void run(File auidoFile) {
		try {
			/* ストリーム取得 */
			AudioInputStream ais = AudioSystem.getAudioInputStream(auidoFile);

			/* 使用できるタイプを表示 */
			System.out.println("------ 使用できるタイプ一覧 ------");
			Type[] types = AudioSystem.getAudioFileTypes(ais);
			for (Type type : types) {
				System.out.println(type);
			}
			System.out.println();

			/* ファイルフォーマットを表示 */
			AudioFileFormat aff = AudioSystem.getAudioFileFormat(auidoFile);
			System.out.println("------ ファイルフォーマット一覧 ------");
			System.out.println("オーディオ・ファイル全体のサイズ（バイト）：" + aff.getByteLength());
			System.out.println("サンプル・フレーム数で表される、ファイルに含まれるオーディオ・データの長さ：" + aff.getFrameLength());
			System.out.println("オーディオ・ファイル・タイプ：" + aff.getType());
			System.out.println("ファイル形式の文字列表現：" + aff.toString());
			System.out.println();

			/* フォーマットを表示 */
			AudioFormat af = ais.getFormat();
			System.out.println("------ フォーマット一覧 ------");
			System.out.println("チャネル数：" + af.getChannels());
			System.out.println("エンコーディング・タイプ：" + af.getEncoding());
			System.out.println("フレーム・レートを1秒当たりのフレーム数：" + af.getFrameRate());
			System.out.println("フレーム・サイズをバイト数で：" + af.getFrameSize());
			System.out.println("サンプル・レート：" + af.getSampleRate());
			System.out.println("サンプルのサイズ：" + af.getSampleSizeInBits());
			System.out.println("格納順序：" + (af.isBigEndian() ? "ビッグ・エデンディアン" : "リトル・エンディアン"));

		} catch (UnsupportedAudioFileException e) {
			e.printStackTrace();
			return;
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
