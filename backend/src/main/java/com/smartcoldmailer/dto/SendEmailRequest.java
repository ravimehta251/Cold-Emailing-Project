package com.smartcoldmailer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendEmailRequest {
    private String templateId;

    private String scheduledFor;
    private String resumePath;
    private java.util.List<String> contactIds;
    private String subject;
    private String body;
}
