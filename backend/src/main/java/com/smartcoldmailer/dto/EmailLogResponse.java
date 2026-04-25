package com.smartcoldmailer.dto;

import com.smartcoldmailer.model.EmailLog;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailLogResponse {
    private String id;
    private String recipientEmail;
    private String recipientName;
    private String subject;
    private String body;
    private EmailLog.EmailStatus status;
    private String errorMessage;
    private LocalDateTime sentAt;
    private Integer retryCount;
}
