package com.example.demo.application.controller;

import java.time.LocalDate;

import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import lombok.Data;

@RestController
public class DemoController {

    @PostMapping("/sample")
    public String index(@RequestHeader(name = "Connection", required = false) String connection,
            @RequestHeader(name = "Content-Type", required = false) String contentType,
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @CookieValue(name = "userId", required = false) String userId,
            @CookieValue(name = "password", required = false) String password,
            @RequestBody BodySample bodySample) {

        System.out.println("コネクション:" + connection);
        System.out.println("コンテンツタイプ:" + contentType);
        System.out.println("認可:" + authorization);
        System.out.println("ユーザID:" + userId);
        System.out.println("パスワード:" + password);
        System.out.println("名前:" + bodySample.getName());
        System.out.println("生年月日:" + bodySample.getBirthday());

        return "OK";
    }

}

@Data
class BodySample {
    private String name;
    private LocalDate birthday;
}
