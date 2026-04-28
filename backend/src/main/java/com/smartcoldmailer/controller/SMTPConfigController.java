package com.smartcoldmailer.controller;

import com.smartcoldmailer.dto.SMTPConfigRequest;
import com.smartcoldmailer.dto.SMTPConfigResponse;
import com.smartcoldmailer.service.SMTPConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import com.smartcoldmailer.security.UserPrincipal;

@Slf4j
@RestController
@RequestMapping("/api/smtp")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "https://cold-emailing-project.vercel.app"})
public class SMTPConfigController {

    @Autowired
    private SMTPConfigService smtpConfigService;

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return principal.getId();
    }

    @PostMapping("/save")
    public ResponseEntity<SMTPConfigResponse> saveSMTPConfig(@Valid @RequestBody SMTPConfigRequest request) {
        String userId = getCurrentUserId();
        log.info("Saving SMTP config for user: {}", userId);
        SMTPConfigResponse response = smtpConfigService.saveSMTPConfig(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<SMTPConfigResponse> getSMTPConfig() {
        String userId = getCurrentUserId();
        log.info("Fetching SMTP config for user: {}", userId);
        SMTPConfigResponse response = smtpConfigService.getSMTPConfig(userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteSMTPConfig() {
        String userId = getCurrentUserId();
        log.info("Deleting SMTP config for user: {}", userId);
        smtpConfigService.deleteSMTPConfig(userId);
        return ResponseEntity.ok().build();
    }
}
