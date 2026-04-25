package com.smartcoldmailer.controller;

import com.smartcoldmailer.dto.ContactRequest;
import com.smartcoldmailer.dto.ContactResponse;
import com.smartcoldmailer.service.ContactService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.io.InputStreamReader;
import java.util.List;
import com.smartcoldmailer.security.UserPrincipal;

@Slf4j
@RestController
@RequestMapping("/api/contacts")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ContactController {

    @Autowired
    private ContactService contactService;

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return principal.getId();
    }

    @PostMapping
    public ResponseEntity<ContactResponse> createContact(@Valid @RequestBody ContactRequest request) {
        String userId = getCurrentUserId();
        log.info("Creating contact for user: {}", userId);
        ContactResponse response = contactService.createContact(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{contactId}")
    public ResponseEntity<ContactResponse> getContact(@PathVariable String contactId) {
        log.info("Fetching contact: {}", contactId);
        ContactResponse response = contactService.getContact(contactId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ContactResponse>> getAllContacts() {
        String userId = getCurrentUserId();
        log.info("Fetching all contacts for user: {}", userId);
        List<ContactResponse> response = contactService.getAllContacts(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{contactId}")
    public ResponseEntity<ContactResponse> updateContact(@PathVariable String contactId,
                                                         @Valid @RequestBody ContactRequest request) {
        log.info("Updating contact: {}", contactId);
        ContactResponse response = contactService.updateContact(contactId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{contactId}")
    public ResponseEntity<String> deleteContact(@PathVariable String contactId) {
        log.info("Deleting contact: {}", contactId);
        contactService.deleteContact(contactId);
        return ResponseEntity.ok("Contact deleted successfully");
    }

    @PostMapping("/bulk-upload")
    public ResponseEntity<List<ContactResponse>> bulkUploadContacts(@RequestParam MultipartFile file) {
        String userId = getCurrentUserId();
        log.info("Bulk uploading contacts for user: {}", userId);
        try {
            InputStreamReader reader = new InputStreamReader(file.getInputStream());
            List<ContactResponse> response = contactService.bulkUploadContacts(userId, reader);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error uploading contacts", e);
            throw new RuntimeException("Error uploading contacts", e);
        }
    }
}
