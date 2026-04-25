package com.smartcoldmailer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class SmartColdMailerApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartColdMailerApplication.class, args);
    }
}
