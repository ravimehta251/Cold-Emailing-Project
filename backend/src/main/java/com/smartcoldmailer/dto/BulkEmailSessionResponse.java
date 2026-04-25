package com.smartcoldmailer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkEmailSessionResponse {
    private String id;
    private String userId;
    private int totalEmails;
    private int sentEmails;
    private int failedEmails;
    private int pendingEmails;
    private String status;
    private double progress; // percentage 0-100
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String errorMessage;
    private List<EmailResultResponse> results;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailResultResponse {
        private String recipientEmail;
        private String recipientName;
        private String status;  // SUCCESS, FAILED
        private String errorMessage;
        private LocalDateTime sentAt;
    }
}
