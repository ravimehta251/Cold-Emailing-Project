package com.smartcoldmailer.repository;

import com.smartcoldmailer.model.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactRepository extends MongoRepository<Contact, String> {
    List<Contact> findByUserId(String userId);
    Page<Contact> findByUserId(String userId, Pageable pageable);
    long countByUserId(String userId);
}
