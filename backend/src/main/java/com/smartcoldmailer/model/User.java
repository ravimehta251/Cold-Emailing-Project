package com.smartcoldmailer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String phone;
    private String password;
    private String githubLink;
    private String linkedinLink;
    private String leetcodeLink;
    private String resumeLink;
    private String techSkill;
    private String keySkill;
    private String specificArea;
    private String relevantProject;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long emailsSentToday;
    private LocalDateTime lastEmailSentAt;

    @Override
    public String toString() {
        return "User{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
