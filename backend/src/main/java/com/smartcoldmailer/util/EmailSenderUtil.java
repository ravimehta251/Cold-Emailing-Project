package com.smartcoldmailer.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;
import java.util.Properties;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class EmailSenderUtil {
    
    // Cache mail senders by email address to avoid recreating for each email
    private static final Map<String, JavaMailSenderImpl> mailSenderCache = new ConcurrentHashMap<>();
    
    // Constants for SMTP configuration
    private static final int SMTP_TIMEOUT_MS = 30000; // 30 seconds
    private static final int SMTP_CONNECTION_TIMEOUT_MS = 10000; // 10 seconds
    
    /**
     * Get or create a cached mail sender with timeout configuration
     */
    private JavaMailSenderImpl getMailSender(String from, String password) {
        return mailSenderCache.computeIfAbsent(from, email -> {
            JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
            mailSender.setHost("smtp.gmail.com");
            mailSender.setPort(587);
            mailSender.setUsername(email);
            mailSender.setPassword(password);

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.debug", "false");
            
            // ADD TIMEOUT CONFIGURATION - CRITICAL FIX
            props.put("mail.smtp.connectiontimeout", SMTP_CONNECTION_TIMEOUT_MS);
            props.put("mail.smtp.timeout", SMTP_TIMEOUT_MS);
            props.put("mail.smtp.writetimeout", SMTP_TIMEOUT_MS);
            
            // Additional SMTP tuning
            props.put("mail.smtp.connectionpool.enable", "true");
            props.put("mail.smtp.connectionpool.maxconnections", "5");
            props.put("mail.smtp.connectionpool.timeout", "300000"); // 5 minutes
            
            log.info("Created cached mail sender for: {}", email);
            return mailSender;
        });
    }

    public void sendEmail(String from, String password, String to, String subject, String body) throws Exception {
        try {
            JavaMailSenderImpl mailSender = getMailSender(from, password);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            log.info("Attempting to send email to {} with timeout {}ms", to, SMTP_TIMEOUT_MS);
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (org.springframework.mail.MailAuthenticationException e) {
            log.error("SMTP Authentication failed for {}. Check credentials and Gmail settings (Less secure app access / App password required)", from, e);
            throw new RuntimeException("SMTP authentication failed: " + e.getMessage(), e);
        } catch (org.springframework.mail.MailSendException e) {
            log.error("Failed to send email to {} - SMTP error: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }  catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", to, e.getMessage(), e);
            throw e;
        }
    }

    public void sendEmailWithHtml(String from, String password, String to, String subject, String htmlBody) throws Exception {
        try {
            JavaMailSenderImpl mailSender = getMailSender(from, password);

            org.springframework.mail.javamail.MimeMessageHelper message = 
                new org.springframework.mail.javamail.MimeMessageHelper(
                    mailSender.createMimeMessage(), true
                );
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(htmlBody, true);

            log.info("Attempting to send HTML email to {} with timeout {}ms", to, SMTP_TIMEOUT_MS);
            mailSender.send(message.getMimeMessage());
            log.info("HTML email sent successfully to {}", to);
        } catch (org.springframework.mail.MailAuthenticationException e) {
            log.error("SMTP Authentication failed for {}. Check credentials and Gmail settings", from, e);
            throw new RuntimeException("SMTP authentication failed: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Failed to send HTML email to {}: {}", to, e.getMessage(), e);
            throw e;
        }
    }

    public void sendEmailWithAttachment(String from, String password, String to, String subject, String body, String attachmentPath) throws Exception {
        try {
            JavaMailSenderImpl mailSender = getMailSender(from, password);

            java.io.File file = new java.io.File(attachmentPath);
            if (!file.exists() || !file.isFile()) {
                log.warn("Attachment file not found: {}. Proceeding without attachment.", attachmentPath);
                sendEmail(from, password, to, subject, body);
                return;
            }

            org.springframework.mail.javamail.MimeMessageHelper message = 
                new org.springframework.mail.javamail.MimeMessageHelper(
                    mailSender.createMimeMessage(), true
                );
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body, false);
            message.addAttachment(file.getName(), file);

            log.info("Attempting to send email with attachment to {} (file: {}) with timeout {}ms", to, attachmentPath, SMTP_TIMEOUT_MS);
            mailSender.send(message.getMimeMessage());
            log.info("Email with attachment sent successfully to {}", to);
        } catch (org.springframework.mail.MailAuthenticationException e) {
            log.error("SMTP Authentication failed for {}. Check credentials and Gmail settings", from, e);
            throw new RuntimeException("SMTP authentication failed: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Failed to send email with attachment to {}: {}", to, e.getMessage(), e);
            throw e;
        }
    }
}
