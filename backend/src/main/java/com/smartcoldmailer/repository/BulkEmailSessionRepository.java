package com.smartcoldmailer.repository;

import com.smartcoldmailer.model.BulkEmailSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BulkEmailSessionRepository extends MongoRepository<BulkEmailSession, String> {
    Optional<BulkEmailSession> findByUserIdOrderByStartedAtDesc(String userId);
    Optional<BulkEmailSession> findByIdAndUserId(String id, String userId);
}
