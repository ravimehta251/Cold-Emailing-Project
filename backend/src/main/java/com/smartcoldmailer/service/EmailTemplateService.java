package com.smartcoldmailer.service;

import com.smartcoldmailer.dto.EmailTemplateRequest;
import com.smartcoldmailer.dto.EmailTemplateResponse;
import com.smartcoldmailer.model.EmailTemplate;
import com.smartcoldmailer.repository.EmailTemplateRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class EmailTemplateService {

    @Autowired
    private EmailTemplateRepository emailTemplateRepository;

    public EmailTemplateResponse createTemplate(String userId, EmailTemplateRequest request) {
        log.info("Creating email template for user: {}", userId);

        // If this is default, unset other defaults
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            emailTemplateRepository.findByUserIdAndIsDefaultTrue(userId)
                .ifPresent(template -> {
                    template.setIsDefault(false);
                    emailTemplateRepository.save(template);
                });
        }

        EmailTemplate template = new EmailTemplate();
        template.setUserId(userId);
        template.setName(request.getName());
        template.setSubject(request.getSubject());
        template.setBody(request.getBody());
        template.setIsDefault(request.getIsDefault() != null && request.getIsDefault());
        template.setCreatedAt(LocalDateTime.now());
        template.setUpdatedAt(LocalDateTime.now());

        template = emailTemplateRepository.save(template);

        return mapToResponse(template);
    }

    public EmailTemplateResponse getTemplate(String templateId) {
        EmailTemplate template = emailTemplateRepository.findById(templateId)
            .orElseThrow(() -> new RuntimeException("Template not found"));

        return mapToResponse(template);
    }

    public List<EmailTemplateResponse> getAllTemplates(String userId) {
        log.info("Fetching all templates for user: {}", userId);

        return emailTemplateRepository.findByUserId(userId)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    public EmailTemplateResponse updateTemplate(String templateId, EmailTemplateRequest request) {
        log.info("Updating template: {}", templateId);

        EmailTemplate template = emailTemplateRepository.findById(templateId)
            .orElseThrow(() -> new RuntimeException("Template not found"));

        // If setting as default, unset other defaults
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            emailTemplateRepository.findByUserIdAndIsDefaultTrue(template.getUserId())
                .ifPresent(t -> {
                    if (!t.getId().equals(templateId)) {
                        t.setIsDefault(false);
                        emailTemplateRepository.save(t);
                    }
                });
        }

        template.setName(request.getName());
        template.setSubject(request.getSubject());
        template.setBody(request.getBody());
        template.setIsDefault(request.getIsDefault() != null && request.getIsDefault());
        template.setUpdatedAt(LocalDateTime.now());

        template = emailTemplateRepository.save(template);

        return mapToResponse(template);
    }

    public void deleteTemplate(String templateId) {
        log.info("Deleting template: {}", templateId);
        emailTemplateRepository.deleteById(templateId);
    }

    public EmailTemplate getTemplateEntity(String templateId) {
        return emailTemplateRepository.findById(templateId)
            .orElseThrow(() -> new RuntimeException("Template not found"));
    }

    private EmailTemplateResponse mapToResponse(EmailTemplate template) {
        EmailTemplateResponse response = new EmailTemplateResponse();
        response.setId(template.getId());
        response.setName(template.getName());
        response.setSubject(template.getSubject());
        response.setBody(template.getBody());
        response.setIsDefault(template.getIsDefault());
        return response;
    }
}
