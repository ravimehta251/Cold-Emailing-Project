package com.smartcoldmailer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse {
    private String id;
    private String name;
    private String company;
    private String role;
    private String email;
}
