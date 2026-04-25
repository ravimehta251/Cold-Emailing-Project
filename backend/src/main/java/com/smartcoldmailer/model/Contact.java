package com.smartcoldmailer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "contacts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Contact {
    @Id
    private String id;
    private String userId;
    private String name;
    private String company;
    private String role;
    private String email;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
