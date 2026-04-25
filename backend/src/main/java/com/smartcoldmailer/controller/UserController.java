package com.smartcoldmailer.controller;

import com.smartcoldmailer.model.User;
import com.smartcoldmailer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class UserController {

    @Autowired
    private UserRepository userRepository;

    private String getCurrentUserId() {
        org.springframework.security.core.Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        com.smartcoldmailer.security.UserPrincipal principal = (com.smartcoldmailer.security.UserPrincipal) authentication.getPrincipal();
        return principal.getId();
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        String userId = getCurrentUserId();
        return userRepository.findById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    public ResponseEntity<User> updateUser(@RequestBody Map<String, String> updates) {
        String userId = getCurrentUserId();
        return userRepository.findById(userId)
                .map(user -> {
                    if (updates.containsKey("name")) user.setName(updates.get("name"));
                    if (updates.containsKey("phone")) user.setPhone(updates.get("phone"));
                    if (updates.containsKey("githubLink")) user.setGithubLink(updates.get("githubLink"));
                    if (updates.containsKey("linkedinLink")) user.setLinkedinLink(updates.get("linkedinLink"));
                    if (updates.containsKey("leetcodeLink")) user.setLeetcodeLink(updates.get("leetcodeLink"));
                    if (updates.containsKey("techSkill")) user.setTechSkill(updates.get("techSkill"));
                    if (updates.containsKey("keySkill")) user.setKeySkill(updates.get("keySkill"));
                    if (updates.containsKey("specificArea")) user.setSpecificArea(updates.get("specificArea"));
                    if (updates.containsKey("relevantProject")) user.setRelevantProject(updates.get("relevantProject"));
                    return ResponseEntity.ok(userRepository.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteUser() {
        String userId = getCurrentUserId();
        userRepository.deleteById(userId);
        return ResponseEntity.ok().build();
    }
}
