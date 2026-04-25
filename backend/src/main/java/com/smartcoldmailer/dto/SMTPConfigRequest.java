package com.smartcoldmailer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SMTPConfigRequest {
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "App password is required")
    private String appPassword;
}
