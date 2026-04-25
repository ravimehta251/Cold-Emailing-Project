package com.smartcoldmailer.repository;

import com.smartcoldmailer.model.SMTPConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SMTPConfigRepository extends MongoRepository<SMTPConfig, String> {
    Optional<SMTPConfig> findByUserId(String userId);
}
