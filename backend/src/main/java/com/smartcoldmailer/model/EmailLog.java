package com.smartcoldmailer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "email_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailLog {
    @Id
    private String id;
    private String userId;
    private String recipientEmail;
    private String recipientName;
    private String subject;
    private String body;
    private EmailStatus status;
    private String errorMessage;
    private LocalDateTime sentAt;
    private Integer retryCount;
    private LocalDateTime scheduledFor;

    public enum EmailStatus {
        PENDING, SUCCESS, FAILED, SCHEDULED
    }
}
