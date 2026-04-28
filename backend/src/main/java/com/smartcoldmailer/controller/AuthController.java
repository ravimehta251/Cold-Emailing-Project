package com.smartcoldmailer.controller;

import com.smartcoldmailer.dto.SignupRequest;
import com.smartcoldmailer.dto.LoginRequest;
import com.smartcoldmailer.dto.AuthResponse;
import com.smartcoldmailer.service.AuthService;
import com.smartcoldmailer.util.SecurityUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "https://cold-emailing-project.vercel.app"})
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        log.info("Signup endpoint called for email: {}", request.getEmail());
        AuthResponse response = authService.signup(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login endpoint called for email: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        String userId = SecurityUtil.getCurrentUserId();
        log.info("Logout endpoint called for user ID: {}", userId);
        authService.logout(userId);
        return ResponseEntity.ok("Logged out successfully. Session ID has been invalidated.");
    }
}
