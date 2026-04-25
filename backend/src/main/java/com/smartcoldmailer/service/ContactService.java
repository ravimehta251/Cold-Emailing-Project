package com.smartcoldmailer.service;

import com.smartcoldmailer.dto.ContactRequest;
import com.smartcoldmailer.dto.ContactResponse;
import com.smartcoldmailer.model.Contact;
import com.smartcoldmailer.repository.ContactRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

import java.io.IOException;
import java.io.Reader;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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
        CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader());

        for (CSVRecord record : csvParser) {
            Contact contact = new Contact();
            contact.setUserId(userId);
            contact.setName(record.get("name"));
            contact.setCompany(record.get("company"));
            contact.setRole(record.get("role"));
            contact.setEmail(record.get("email"));
            contact.setCreatedAt(LocalDateTime.now());
            contact.setUpdatedAt(LocalDateTime.now());

            contacts.add(contact);
        }

        csvParser.close();

        List<Contact> saved = contactRepository.saveAll(contacts);
        log.info("Bulk uploaded {} contacts", saved.size());

        return saved.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
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
