package com.smartcoldmailer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private Long totalEmailsSent;
    private Long successfulEmails;
    private Long failedEmails;
    private Double successRate;
    private Long emailsSentToday;
}
