package com.example.demo;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

public class HttpUrlConnectionSample {

    public static void main(String[] args) {
        try {
            /* URLの作成 */
            URL url = new URL("http://localhost:8080/sample");

            /* リクエストヘッダの作成 */
            HttpURLConnection con = (HttpURLConnection) url.openConnection();
            con.setRequestMethod("POST");			                            // メソッド
            con.setRequestProperty("Connection", "Keep-Alive");                             // コネクション
            con.setRequestProperty("Content-Type", "application/json; charset=UTF-8");      // コンテンツタイプ
            con.setRequestProperty("Authorization", "Test1234");                             // 認可
            con.setRequestProperty("Connection", "Keep-Alive");                             // コネクション
            con.setRequestProperty("Cookie", "userId=U1111; password=abc");                 // クッキ

            /* 設定 */
            con.setDoOutput(true);              // リクエストボディを有効にする

            /* コネクション */
            con.connect();

            /* リクエストボディの作成 */
            String bodyJson = "{\"name\":\"新井健一朗\",\"birthday\":\"1986-11-03\"}";    // リクエストボディ

            // 書き込み
            try (OutputStream out = con.getOutputStream()) {
                try (PrintStream print = new PrintStream(out)) {
                    print.print(bodyJson);
                }
            }

            /* リクエストし、レスポンスを受け取る */
            int responseCode = con.getResponseCode();           // レスポンスコード

            // レスポンスボディの読み込み
            StringBuilder resBody = new StringBuilder();
            String line = null;
            try (BufferedReader br = new BufferedReader(new InputStreamReader(con.getInputStream(), "UTF-8"))) {
                while ((line = br.readLine()) != null) {
                    resBody.append(line);
                }
            }

            /* レスポンスの確認 */
            System.out.println("レスポンスコード:" + responseCode);
            System.out.println("レスポンスボディ:" + resBody);

        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

}
