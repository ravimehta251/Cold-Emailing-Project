package com.smartcoldmailer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "smtp_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SMTPConfig {
    @Id
    private String id;
    private String userId;
    private String email;
    private String encryptedPassword;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isActive;
}
