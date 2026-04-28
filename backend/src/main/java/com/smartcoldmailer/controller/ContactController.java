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
import java.util.Map;
import com.smartcoldmailer.security.UserPrincipal;

@Slf4j
@RestController
@RequestMapping("/api/contacts")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "https://cold-emailing-project.vercel.app"})
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
        log.info("Fetching all contacts (visible to all authenticated users)");
        List<ContactResponse> response = contactService.getAllContacts("");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/paginated")
    public ResponseEntity<Map<String, Object>> getContactsPaginated(@RequestParam(defaultValue = "0") int page) {
        log.info("Fetching paginated contacts (visible to all authenticated users) - page: {}", page);
        
        if (page < 0) {
            page = 0;
        }
        
        Map<String, Object> response = contactService.getContactsPaginated("", page);
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
    public ResponseEntity<?> bulkUploadContacts(@RequestParam("file") MultipartFile file) {
        String userId = getCurrentUserId();
        
        // Validate file
        if (file == null || file.isEmpty()) {
            log.error("No file provided for bulk upload");
            return ResponseEntity.badRequest().body(new ErrorResponse("No file provided"));
        }
        
        if (!file.getOriginalFilename().toLowerCase().endsWith(".csv")) {
            log.error("Invalid file type: {}", file.getOriginalFilename());
            return ResponseEntity.badRequest().body(new ErrorResponse("File must be CSV format"));
        }
        
        log.info("Bulk uploading file: {} for user: {}", file.getOriginalFilename(), userId);
        
        try {
            InputStreamReader reader = new InputStreamReader(file.getInputStream());
            List<ContactResponse> response = contactService.bulkUploadContacts(userId, reader);
            log.info("Successfully uploaded {} contacts", response.size());
            return ResponseEntity.ok(new BulkUploadResponse(response.size(), response));
        } catch (Exception e) {
            log.error("Error uploading contacts", e);
            return ResponseEntity.internalServerError().body(
                new ErrorResponse("Error uploading contacts: " + e.getMessage())
            );
        }
    }

    // Helper classes
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ErrorResponse {
        private String message;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class BulkUploadResponse {
        private int uploadedCount;
        private List<ContactResponse> contacts;
    }
}
