package com.smartcoldmailer.repository;

import com.smartcoldmailer.model.EmailLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailLogRepository extends MongoRepository<EmailLog, String> {
    List<EmailLog> findByUserId(String userId);
    Page<EmailLog> findByUserId(String userId, Pageable pageable);
    long countByUserIdAndStatus(String userId, EmailLog.EmailStatus status);
    List<EmailLog> findByStatus(EmailLog.EmailStatus status);
    long countByUserIdAndSentAtAfter(String userId, java.time.LocalDateTime dateTime);
    long countByUserIdAndStatusAndSentAtAfter(String userId, EmailLog.EmailStatus status, java.time.LocalDateTime dateTime);
}
