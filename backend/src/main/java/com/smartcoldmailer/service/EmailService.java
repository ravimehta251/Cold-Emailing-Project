package com.smartcoldmailer.service;

import com.smartcoldmailer.dto.EmailLogResponse;
import com.smartcoldmailer.model.Contact;
import com.smartcoldmailer.model.EmailLog;
import com.smartcoldmailer.model.EmailTemplate;
import com.smartcoldmailer.model.BulkEmailSession;
import com.smartcoldmailer.model.SMTPConfig;
import com.smartcoldmailer.repository.EmailLogRepository;
import com.smartcoldmailer.repository.BulkEmailSessionRepository;
import com.smartcoldmailer.util.EmailTemplateEngine;
import com.smartcoldmailer.util.EmailSenderUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Slf4j
@Service
public class EmailService {

    @Autowired
    private EmailLogRepository emailLogRepository;

    @Autowired
    private BulkEmailSessionRepository bulkEmailSessionRepository;

    @Autowired
    private EmailTemplateEngine emailTemplateEngine;

    @Autowired
    private EmailSenderUtil emailSenderUtil;

    @Autowired
    private SMTPConfigService smtpConfigService;

    @Autowired
    private ContactService contactService;

    @Autowired
    private EmailTemplateService emailTemplateService;

    @Autowired
    private com.smartcoldmailer.repository.UserRepository userRepository;

    private static final long EMAIL_DELAY_MS = 5000; // 5 seconds
    private static final int MAX_RETRIES = 3;
    private static final long MAX_EMAILS_PER_DAY = 50;

    @Async
    public void sendBulkEmails(String userId, String templateId, String resumePath, List<String> contactIds, String subjectOverride, String bodyOverride, BulkEmailSession session) {
        log.info("Starting bulk email sending for user: {}", userId);
        
        // Validate resume path if provided
        String validatedResumePath = null;
        if (resumePath != null && !resumePath.trim().isEmpty()) {
            String normalizedPath = normalizeFilePath(resumePath);
            java.io.File resumeFile = new java.io.File(normalizedPath);
            if (resumeFile.exists() && resumeFile.isFile()) {
                validatedResumePath = normalizedPath;
                log.info("Resume file found and will be attached: {}", validatedResumePath);
            } else {
                log.warn("Resume file not found at path: {} (normalized: {}). Emails will be sent without attachment.", resumePath, normalizedPath);
            }
        }
        
        try {
            // Validate SMTP config exists
            SMTPConfig smtpConfig;
            try {
                smtpConfig = smtpConfigService.getSMTPConfigEntity(userId);
            } catch (Exception e) {
                String errorMsg = "SMTP configuration not found. Please configure your SMTP settings before sending emails.";
                log.error(errorMsg);
                session.setStatus(BulkEmailSession.SessionStatus.FAILED);
                session.setErrorMessage(errorMsg);
                session.setCompletedAt(LocalDateTime.now());
                bulkEmailSessionRepository.save(session);
                return;
            }

            String smtpEmail = smtpConfig.getEmail();
            String smtpPassword = smtpConfigService.getDecryptedPassword(userId);

            // Get template (optional if overrides provided)
            EmailTemplate template = null;
            if (templateId != null && !templateId.isEmpty()) {
                try {
                    template = emailTemplateService.getTemplateEntity(templateId);
                } catch (Exception e) {
                    log.warn("Template not found, proceeding with overrides if available.");
                }
            }

            List<Contact> contacts = contactService.getAllContactsShared();
            if (contactIds != null && !contactIds.isEmpty()) {
                contacts = contacts.stream()
                                   .filter(c -> contactIds.contains(c.getId()))
                                   .collect(Collectors.toList());
            }

            // Validate contacts exist
            if (contacts.isEmpty()) {
                String errorMsg = "No contacts found to send emails to. Please add contacts first.";
                log.error(errorMsg);
                session.setTotalEmails(0);
                session.setStatus(BulkEmailSession.SessionStatus.COMPLETED);
                session.setErrorMessage(errorMsg);
                session.setCompletedAt(LocalDateTime.now());
                bulkEmailSessionRepository.save(session);
                return;
            }

            session.setTotalEmails(contacts.size());
            session = bulkEmailSessionRepository.save(session);

            log.info("Sending emails to {} contacts", contacts.size());

            for (Contact contact : contacts) {
                sendSingleEmail(userId, contact, template, smtpEmail, smtpPassword, validatedResumePath, subjectOverride, bodyOverride, session);
                
                // Update session progress
                session = bulkEmailSessionRepository.findById(session.getId()).orElse(session);
                
                // Add delay between emails to avoid spam blocking
                try {
                    Thread.sleep(EMAIL_DELAY_MS);
                } catch (InterruptedException e) {
                    log.error("Email delay interrupted", e);
                    Thread.currentThread().interrupt();
                }
            }

            session.setStatus(BulkEmailSession.SessionStatus.COMPLETED);
            session.setCompletedAt(LocalDateTime.now());
            bulkEmailSessionRepository.save(session);

            log.info("Bulk email sending completed for user: {}", userId);
        } catch (Exception e) {
            log.error("Error sending bulk emails", e);
            session.setStatus(BulkEmailSession.SessionStatus.FAILED);
            session.setErrorMessage(e.getMessage());
            session.setCompletedAt(LocalDateTime.now());
            bulkEmailSessionRepository.save(session);
        }
    }

    private void sendSingleEmail(String userId, Contact contact, EmailTemplate template, 
                                 String smtpEmail, String smtpPassword, String resumePath, String subjectOverride, String bodyOverride, BulkEmailSession session) {
        try {
            // Fetch User for sender details
            com.smartcoldmailer.model.User sender = userRepository.findById(userId).orElse(null);

            // Create variables for template replacement
            Map<String, String> variables = emailTemplateEngine.createVariableMap(
                contact.getName(), contact.getCompany(), contact.getRole(), sender
            );

            // Replace placeholders in subject and body
            String finalSubject = subjectOverride != null && !subjectOverride.trim().isEmpty() ? subjectOverride : (template != null ? template.getSubject() : "");
            String finalBody = bodyOverride != null && !bodyOverride.trim().isEmpty() ? bodyOverride : (template != null ? template.getBody() : "");

            String subject = emailTemplateEngine.replacePlaceholders(finalSubject, variables);
            String body = emailTemplateEngine.replacePlaceholders(finalBody, variables);

            // Rate Limiting Check
            LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
            long emailsSentToday = emailLogRepository.countByUserIdAndSentAtAfter(userId, today);
            if (emailsSentToday >= MAX_EMAILS_PER_DAY) {
                throw new RuntimeException("Rate limit exceeded: Maximum " + MAX_EMAILS_PER_DAY + " emails allowed per day.");
            }

            // Send email with retry logic
            boolean success = false;
            int attempt = 0;
            String errorMessage = null;
            while (attempt < MAX_RETRIES && !success) {
                try {
                    if (resumePath != null && !resumePath.trim().isEmpty()) {
                        log.info("Sending email with attachment: {}", resumePath);
                        emailSenderUtil.sendEmailWithAttachment(smtpEmail, smtpPassword, contact.getEmail(), subject, body, resumePath);
                    } else {
                        emailSenderUtil.sendEmail(smtpEmail, smtpPassword, contact.getEmail(), subject, body);
                    }
                    success = true;
                } catch (Exception e) {
                    errorMessage = e.getMessage();
                    attempt++;
                    if (attempt < MAX_RETRIES) {
                        try {
                            Thread.sleep(5000); // 5 seconds delay before retry
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                        }
                    }
                }
            }

            // Log result
            EmailLog emailLog = new EmailLog();
            emailLog.setUserId(userId);
            emailLog.setRecipientEmail(contact.getEmail());
            emailLog.setRecipientName(contact.getName());
            emailLog.setSubject(subject);
            emailLog.setBody(body);
            emailLog.setStatus(success ? EmailLog.EmailStatus.SUCCESS : EmailLog.EmailStatus.FAILED);
            emailLog.setSentAt(LocalDateTime.now());
            emailLog.setRetryCount(attempt - 1);
            if (!success && errorMessage != null) {
                emailLog.setErrorMessage(errorMessage);
            }

            emailLogRepository.save(emailLog);

            // Update session
            if (session != null) {
                if (success) {
                    session.setSentEmails(session.getSentEmails() + 1);
                    log.info("Email sent successfully to: {} (Progress: {}/{})", contact.getEmail(), session.getSentEmails(), session.getTotalEmails());
                } else {
                    session.setFailedEmails(session.getFailedEmails() + 1);
                    log.warn("Failed to send email to: {} (Failed: {}/{})", contact.getEmail(), session.getFailedEmails(), session.getTotalEmails());
                }
                
                // Add result to session
                BulkEmailSession.EmailResult result = new BulkEmailSession.EmailResult();
                result.setRecipientEmail(contact.getEmail());
                result.setRecipientName(contact.getName());
                result.setStatus(success ? "SUCCESS" : "FAILED");
                result.setErrorMessage(errorMessage);
                result.setSentAt(LocalDateTime.now());
                session.getResults().add(result);
                
                bulkEmailSessionRepository.save(session);
            }
        } catch (Exception e) {
            log.error("Error sending email to {}: {}", contact.getEmail(), e.getMessage());

            EmailLog emailLog = new EmailLog();
            emailLog.setUserId(userId);
            emailLog.setRecipientEmail(contact.getEmail());
            emailLog.setRecipientName(contact.getName());
            emailLog.setStatus(EmailLog.EmailStatus.FAILED);
            emailLog.setErrorMessage(e.getMessage());
            emailLog.setSentAt(LocalDateTime.now());
            emailLog.setRetryCount(0);

            emailLogRepository.save(emailLog);

            // Update session
            if (session != null) {
                session.setFailedEmails(session.getFailedEmails() + 1);
                
                BulkEmailSession.EmailResult result = new BulkEmailSession.EmailResult();
                result.setRecipientEmail(contact.getEmail());
                result.setRecipientName(contact.getName());
                result.setStatus("FAILED");
                result.setErrorMessage(e.getMessage());
                result.setSentAt(LocalDateTime.now());
                session.getResults().add(result);
                
                bulkEmailSessionRepository.save(session);
            }
        }
    }

    public List<EmailLogResponse> getEmailLogs(String userId) {
        log.info("Fetching email logs for user: {}", userId);

        return emailLogRepository.findByUserId(userId)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get paginated email logs (50 items per page)
     * Returns most recent emails first
     */
    public Map<String, Object> getEmailLogsPaginated(String userId, int page) {
        log.info("Fetching paginated email logs for user: {} - page: {}", userId, page);
        
        int pageSize = 50;
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("sentAt").descending());
        
        Page<EmailLog> emailLogs = emailLogRepository.findByUserId(userId, pageable);
        
        List<EmailLogResponse> content = emailLogs.getContent().stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
        
        // Create response map
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("content", content);
        response.put("currentPage", page);
        response.put("totalPages", emailLogs.getTotalPages());
        response.put("totalElements", emailLogs.getTotalElements());
        response.put("hasNext", emailLogs.hasNext());
        response.put("hasPrevious", emailLogs.hasPrevious());
        response.put("pageSize", pageSize);
        
        return response;
    }

    public long getTotalEmailsSent(String userId) {
        return emailLogRepository.countByUserIdAndStatus(userId, EmailLog.EmailStatus.SUCCESS);
    }

    public long getFailedEmailsCount(String userId) {
        return emailLogRepository.countByUserIdAndStatus(userId, EmailLog.EmailStatus.FAILED);
    }

    public long getEmailsSentToday(String userId) {
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        return emailLogRepository.countByUserIdAndStatusAndSentAtAfter(userId, EmailLog.EmailStatus.SUCCESS, today);
    }

    private EmailLogResponse mapToResponse(EmailLog log) {
        EmailLogResponse response = new EmailLogResponse();
        response.setId(log.getId());
        response.setRecipientEmail(log.getRecipientEmail());
        response.setRecipientName(log.getRecipientName());
        response.setSubject(log.getSubject());
        response.setBody(log.getBody());
        response.setStatus(log.getStatus());
        response.setErrorMessage(log.getErrorMessage());
        response.setSentAt(log.getSentAt());
        response.setRetryCount(log.getRetryCount());
        return response;
    }

    public com.smartcoldmailer.dto.BulkEmailSessionResponse getSessionProgress(String sessionId) {
        BulkEmailSession session = bulkEmailSessionRepository.findById(sessionId).orElse(null);
        if (session == null) {
            return null;
        }
        return mapSessionToResponse(session);
    }

    private com.smartcoldmailer.dto.BulkEmailSessionResponse mapSessionToResponse(BulkEmailSession session) {
        com.smartcoldmailer.dto.BulkEmailSessionResponse response = new com.smartcoldmailer.dto.BulkEmailSessionResponse();
        response.setId(session.getId());
        response.setUserId(session.getUserId());
        response.setTotalEmails(session.getTotalEmails());
        response.setSentEmails(session.getSentEmails());
        response.setFailedEmails(session.getFailedEmails());
        response.setPendingEmails(session.getTotalEmails() - session.getSentEmails() - session.getFailedEmails());
        response.setStatus(session.getStatus().toString());
        
        // Calculate progress percentage
        double progress = session.getTotalEmails() > 0 
            ? ((session.getSentEmails() + session.getFailedEmails()) * 100.0 / session.getTotalEmails()) 
            : 0.0;
        response.setProgress(progress);
        
        response.setStartedAt(session.getStartedAt());
        response.setCompletedAt(session.getCompletedAt());
        response.setErrorMessage(session.getErrorMessage());
        
        // Map results
        if (session.getResults() != null) {
            response.setResults(session.getResults().stream()
                .map(r -> new com.smartcoldmailer.dto.BulkEmailSessionResponse.EmailResultResponse(
                    r.getRecipientEmail(),
                    r.getRecipientName(),
                    r.getStatus(),
                    r.getErrorMessage(),
                    r.getSentAt()
                ))
                .collect(Collectors.toList()));
        }
        
        return response;
    }

    /**
     * Normalize file path to handle both Windows and Unix paths
     * Handles escaped characters and converts backslashes properly
     */
    private String normalizeFilePath(String path) {
        if (path == null || path.trim().isEmpty()) {
            return path;
        }
        
        // Remove surrounding quotes if present
        String normalized = path.trim();
        if ((normalized.startsWith("\"") && normalized.endsWith("\"")) ||
            (normalized.startsWith("'") && normalized.endsWith("'"))) {
            normalized = normalized.substring(1, normalized.length() - 1);
        }
        
        // Convert forward slashes to system-appropriate separator
        // Java File class handles both / and \ on Windows, so this is mainly for consistency
        normalized = normalized.replace("/", java.io.File.separator);
        
        // Try to handle escaped backslashes that might come from JSON
        // But only if the current version doesn't exist
        java.io.File testFile = new java.io.File(normalized);
        if (!testFile.exists() && normalized.contains("\\\\")) {
            // Try with single backslashes (in case they were double-escaped)
            String singleBackslash = normalized.replace("\\\\", "\\");
            java.io.File testFile2 = new java.io.File(singleBackslash);
            if (testFile2.exists()) {
                normalized = singleBackslash;
            }
        }
        
        log.debug("Normalized path from '{}' to '{}'", path, normalized);
        return normalized;
    }
}
