package com.smartcoldmailer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplateResponse {
    private String id;
    private String name;
    private String subject;
    private String body;
    private Boolean isDefault;
}
