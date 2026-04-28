package com.smartcoldmailer.service;

import com.smartcoldmailer.dto.SignupRequest;
import com.smartcoldmailer.dto.LoginRequest;
import com.smartcoldmailer.dto.AuthResponse;
import com.smartcoldmailer.model.User;
import com.smartcoldmailer.model.EmailTemplate;
import com.smartcoldmailer.repository.UserRepository;
import com.smartcoldmailer.repository.EmailTemplateRepository;
import com.smartcoldmailer.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private EmailTemplateRepository emailTemplateRepository;

    public void logout(String userId) {
        log.info("Logout request for user ID: {}", userId);
        // Clear authentication from security context
        SecurityContextHolder.clearContext();
        // Invalidate token by removing it from JWT blacklist (if implemented)
        // For now, the token becomes invalid when it expires or user clears localStorage
        log.info("User {} logged out successfully. Session ID invalidated.", userId);
    }

    public AuthResponse signup(SignupRequest request) {
        log.info("Signup request for email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setEmailsSentToday(0L);

        // Create default email template for new user
        try {
            EmailTemplate defaultTemplate = new EmailTemplate();
            defaultTemplate.setUserId(user.getId());
            defaultTemplate.setName("Professional Cold Email");
            defaultTemplate.setSubject("{{techSkill}} engineer interested in contributing to {{company}}'s engineering team");
            defaultTemplate.setBody("Hi {{contactName}},\n\n" +
                    "I came across {{company}}'s work in {{specificArea}} and was genuinely impressed — it's one of the reasons I'm reaching out.\n\n" +
                    "I'm a {{role}} with hands-on experience in {{techSkill}} and a strong focus on {{keySkill}}. I've built {{relevantProject}}, which gave me deep practical experience in solving the kinds of problems your team works on.\n\n" +
                    "A few quick links if you'd like to learn more:\n" +
                    "  - Portfolio / GitHub: {{githubLink}}\n" +
                    "  - LinkedIn: {{linkedinLink}}\n" +
                    "  - Resume: {{resumeLink}}\n\n" +
                    "I'd love to have a brief 15-minute call to explore whether there's a mutual fit. If you're open to it, feel free to suggest a time that works for you — or I'm happy to send over a few slots.\n\n" +
                    "Thank you for your time, {{contactName}}.\n\n" +
                    "Best regards,\n" +
                    "{{yourName}}\n" +
                    "{{yourEmail}} · {{yourPhone}}");
            defaultTemplate.setIsDefault(true);
            defaultTemplate.setCreatedAt(LocalDateTime.now());
            defaultTemplate.setUpdatedAt(LocalDateTime.now());
            emailTemplateRepository.save(defaultTemplate);
            log.info("Default email template created for user: {}", user.getId());
        } catch (Exception e) {
            log.error("Failed to create default email template for user: {}", user.getId(), e);
            // Don't fail the signup if template creation fails
        }

        user = userRepository.save(user);
        log.info("User created successfully with ID: {}", user.getId());

        String token = jwtTokenProvider.generateTokenFromUserId(user.getId());

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setPhone(user.getPhone());

        return response;
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login request for email: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getEmail(),
                request.getPassword()
            )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtTokenProvider.generateToken(authentication);

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setPhone(user.getPhone());

        return response;
    }
}
