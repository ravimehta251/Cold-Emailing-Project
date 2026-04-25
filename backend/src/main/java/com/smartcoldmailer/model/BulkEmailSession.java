package com.smartcoldmailer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "bulk_email_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkEmailSession {
    @Id
    private String id;
    private String userId;
    private int totalEmails;
    private int sentEmails;
    private int failedEmails;
    private String currentEmail;
    private SessionStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String errorMessage;
    private List<EmailResult> results;

    public enum SessionStatus {
        PENDING, IN_PROGRESS, COMPLETED, FAILED
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailResult {
        private String recipientEmail;
        private String recipientName;
        private String status;  // SUCCESS, FAILED
        private String errorMessage;
        private LocalDateTime sentAt;
    }
}
