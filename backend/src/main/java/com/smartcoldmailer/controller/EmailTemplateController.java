package com.smartcoldmailer.controller;

import com.smartcoldmailer.dto.EmailTemplateRequest;
import com.smartcoldmailer.dto.EmailTemplateResponse;
import com.smartcoldmailer.service.EmailTemplateService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import com.smartcoldmailer.security.UserPrincipal;

@Slf4j
@RestController
@RequestMapping("/api/templates")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class EmailTemplateController {

    @Autowired
    private EmailTemplateService emailTemplateService;

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return principal.getId();
    }

    @PostMapping
    public ResponseEntity<EmailTemplateResponse> createTemplate(@Valid @RequestBody EmailTemplateRequest request) {
        String userId = getCurrentUserId();
        log.info("Creating template for user: {}", userId);
        EmailTemplateResponse response = emailTemplateService.createTemplate(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{templateId}")
    public ResponseEntity<EmailTemplateResponse> getTemplate(@PathVariable String templateId) {
        log.info("Fetching template: {}", templateId);
        EmailTemplateResponse response = emailTemplateService.getTemplate(templateId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<EmailTemplateResponse>> getAllTemplates() {
        String userId = getCurrentUserId();
        log.info("Fetching all templates for user: {}", userId);
        List<EmailTemplateResponse> response = emailTemplateService.getAllTemplates(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{templateId}")
    public ResponseEntity<EmailTemplateResponse> updateTemplate(@PathVariable String templateId,
                                                                 @Valid @RequestBody EmailTemplateRequest request) {
        log.info("Updating template: {}", templateId);
        EmailTemplateResponse response = emailTemplateService.updateTemplate(templateId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{templateId}")
    public ResponseEntity<String> deleteTemplate(@PathVariable String templateId) {
        log.info("Deleting template: {}", templateId);
        emailTemplateService.deleteTemplate(templateId);
        return ResponseEntity.ok("Template deleted successfully");
    }
}
