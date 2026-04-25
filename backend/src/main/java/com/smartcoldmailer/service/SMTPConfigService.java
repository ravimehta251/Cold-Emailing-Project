package com.smartcoldmailer.service;

import com.smartcoldmailer.dto.SMTPConfigRequest;
import com.smartcoldmailer.dto.SMTPConfigResponse;
import com.smartcoldmailer.model.SMTPConfig;
import com.smartcoldmailer.repository.SMTPConfigRepository;
import com.smartcoldmailer.util.EncryptionUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
public class SMTPConfigService {

    @Autowired
    private SMTPConfigRepository smtpConfigRepository;

    @Autowired
    private EncryptionUtil encryptionUtil;

    public SMTPConfigResponse saveSMTPConfig(String userId, SMTPConfigRequest request) {
        log.info("Saving SMTP config for user: {}", userId);

        SMTPConfig config = smtpConfigRepository.findByUserId(userId).orElse(new SMTPConfig());
        config.setUserId(userId);
        config.setEmail(request.getEmail());
        config.setEncryptedPassword(encryptionUtil.encrypt(request.getAppPassword()));
        config.setIsActive(true);
        config.setUpdatedAt(LocalDateTime.now());

        if (config.getId() == null) {
            config.setCreatedAt(LocalDateTime.now());
        }

        config = smtpConfigRepository.save(config);

        return mapToResponse(config);
    }

    public SMTPConfigResponse getSMTPConfig(String userId) {
        log.info("Fetching SMTP config for user: {}", userId);

        SMTPConfig config = smtpConfigRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("SMTP config not found"));

        return mapToResponse(config);
    }

    public void deleteSMTPConfig(String userId) {
        SMTPConfig config = smtpConfigRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("SMTP config not found"));
        smtpConfigRepository.delete(config);
    }

    public SMTPConfig getSMTPConfigEntity(String userId) {
        return smtpConfigRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("SMTP config not found"));
    }

    public String getDecryptedPassword(String userId) {
        SMTPConfig config = getSMTPConfigEntity(userId);
        return encryptionUtil.decrypt(config.getEncryptedPassword());
    }

    private SMTPConfigResponse mapToResponse(SMTPConfig config) {
        SMTPConfigResponse response = new SMTPConfigResponse();
        response.setId(config.getId());
        response.setEmail(config.getEmail());
        response.setIsActive(config.getIsActive());
        return response;
    }
}
