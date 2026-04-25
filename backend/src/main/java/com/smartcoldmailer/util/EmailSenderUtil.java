package com.smartcoldmailer.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;
import java.util.Properties;

@Slf4j
@Component
public class EmailSenderUtil {

    public void sendEmail(String from, String password, String to, String subject, String body) throws Exception {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername(from);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "false");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
        log.info("Email sent successfully to {}", to);
    }

    public void sendEmailWithHtml(String from, String password, String to, String subject, String htmlBody) throws Exception {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername(from);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "false");

        org.springframework.mail.javamail.MimeMessageHelper message = 
            new org.springframework.mail.javamail.MimeMessageHelper(
                mailSender.createMimeMessage(), true
            );
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(htmlBody, true);

        mailSender.send(message.getMimeMessage());
        log.info("HTML email sent successfully to {}", to);
    }

    public void sendEmailWithAttachment(String from, String password, String to, String subject, String body, String attachmentPath) throws Exception {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername(from);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "false");

        org.springframework.mail.javamail.MimeMessageHelper message = 
            new org.springframework.mail.javamail.MimeMessageHelper(
                mailSender.createMimeMessage(), true
            );
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body, false);
        
        java.io.File file = new java.io.File(attachmentPath);
        message.addAttachment(file.getName(), file);

        mailSender.send(message.getMimeMessage());
        log.info("Email with attachment sent successfully to {}", to);
    }
}
