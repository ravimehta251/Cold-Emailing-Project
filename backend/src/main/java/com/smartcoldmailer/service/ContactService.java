package com.smartcoldmailer.service;

import com.smartcoldmailer.dto.ContactRequest;
import com.smartcoldmailer.dto.ContactResponse;
import com.smartcoldmailer.model.Contact;
import com.smartcoldmailer.repository.ContactRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

import java.io.IOException;
import java.io.Reader;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ContactService {

    @Autowired
    private ContactRepository contactRepository;

    public ContactResponse createContact(String userId, ContactRequest request) {
        log.info("Creating contact for user: {}", userId);

        Contact contact = new Contact();
        contact.setUserId(userId);
        contact.setName(request.getName());
        contact.setCompany(request.getCompany());
        contact.setRole(request.getRole());
        contact.setEmail(request.getEmail());
        contact.setCreatedAt(LocalDateTime.now());
        contact.setUpdatedAt(LocalDateTime.now());

        contact = contactRepository.save(contact);

        return mapToResponse(contact);
    }

    public ContactResponse getContact(String contactId) {
        Contact contact = contactRepository.findById(contactId)
            .orElseThrow(() -> new RuntimeException("Contact not found"));

        return mapToResponse(contact);
    }

    public List<ContactResponse> getAllContacts(String userId) {
        log.info("Fetching all contacts for user: {}", userId);

        return contactRepository.findByUserId(userId)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get paginated contacts (50 items per page)
     * Returns contacts sorted by creation date (newest first)
     */
    public Map<String, Object> getContactsPaginated(String userId, int page) {
        log.info("Fetching paginated contacts for user: {} - page: {}", userId, page);
        
        int pageSize = 50;
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
        
        Page<Contact> contacts = contactRepository.findByUserId(userId, pageable);
        
        List<ContactResponse> content = contacts.getContent().stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
        
        // Create response map
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("content", content);
        response.put("currentPage", page);
        response.put("totalPages", contacts.getTotalPages());
        response.put("totalElements", contacts.getTotalElements());
        response.put("hasNext", contacts.hasNext());
        response.put("hasPrevious", contacts.hasPrevious());
        response.put("pageSize", pageSize);
        
        return response;
    }

    public ContactResponse updateContact(String contactId, ContactRequest request) {
        log.info("Updating contact: {}", contactId);

        Contact contact = contactRepository.findById(contactId)
            .orElseThrow(() -> new RuntimeException("Contact not found"));

        contact.setName(request.getName());
        contact.setCompany(request.getCompany());
        contact.setRole(request.getRole());
        contact.setEmail(request.getEmail());
        contact.setUpdatedAt(LocalDateTime.now());

        contact = contactRepository.save(contact);

        return mapToResponse(contact);
    }

    public void deleteContact(String contactId) {
        log.info("Deleting contact: {}", contactId);
        contactRepository.deleteById(contactId);
    }

    public List<ContactResponse> bulkUploadContacts(String userId, Reader reader) throws IOException {
        log.info("Bulk uploading contacts for user: {}", userId);

        List<Contact> contacts = new ArrayList<>();
        
        try (CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT
                .withFirstRecordAsHeader()
                .withIgnoreEmptyLines()
                .withTrim())) {

            int rowNumber = 2; // Start from 2 (header is 1)
            
            for (CSVRecord record : csvParser) {
                try {
                    // Get values and handle case-insensitive headers
                    String name = getCSVValue(record, "name");
                    String email = getCSVValue(record, "email");
                    String company = getCSVValue(record, "company");
                    String role = getCSVValue(record, "role");

                    // Validate required fields
                    if (name == null || name.trim().isEmpty()) {
                        log.warn("Skipping row {} - missing name", rowNumber);
                        rowNumber++;
                        continue;
                    }
                    if (email == null || email.trim().isEmpty()) {
                        log.warn("Skipping row {} - missing email", rowNumber);
                        rowNumber++;
                        continue;
                    }

                    // Create contact
                    Contact contact = new Contact();
                    contact.setUserId(userId);
                    contact.setName(name.trim());
                    contact.setEmail(email.trim());
                    contact.setCompany(company != null ? company.trim() : "");
                    contact.setRole(role != null ? role.trim() : "");
                    contact.setCreatedAt(LocalDateTime.now());
                    contact.setUpdatedAt(LocalDateTime.now());

                    contacts.add(contact);
                    log.debug("Added contact from row {}: {}", rowNumber, email);
                    
                } catch (Exception e) {
                    log.warn("Error parsing row {}: {}", rowNumber, e.getMessage());
                }
                rowNumber++;
            }

            if (contacts.isEmpty()) {
                throw new RuntimeException("No valid contacts found in CSV. Ensure CSV has columns: name, email, company (optional), role (optional)");
            }

            List<Contact> saved = contactRepository.saveAll(contacts);
            log.info("Bulk uploaded {} contacts for user {}", saved.size(), userId);

            return saved.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
                
        } catch (IOException e) {
            log.error("Error reading CSV file", e);
            throw new RuntimeException("Error reading CSV file: " + e.getMessage(), e);
        }
    }

    /**
     * Get CSV value by header name, case-insensitive
     */
    private String getCSVValue(CSVRecord record, String headerName) {
        try {
            // Try exact match first
            if (record.isMapped(headerName)) {
                return record.get(headerName);
            }
            
            // Try case-insensitive search
            for (String header : record.getParser().getHeaderMap().keySet()) {
                if (header.equalsIgnoreCase(headerName)) {
                    return record.get(header);
                }
            }
        } catch (Exception e) {
            log.debug("Could not get value for header {}", headerName);
        }
        return null;
    }

    public List<Contact> getContactsForUser(String userId) {
        return contactRepository.findByUserId(userId);
    }

    private ContactResponse mapToResponse(Contact contact) {
        ContactResponse response = new ContactResponse();
        response.setId(contact.getId());
        response.setName(contact.getName());
        response.setCompany(contact.getCompany());
        response.setRole(contact.getRole());
        response.setEmail(contact.getEmail());
        return response;
    }
}
