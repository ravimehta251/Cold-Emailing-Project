package com.smartcoldmailer.controller;

import com.smartcoldmailer.dto.SendEmailRequest;
import com.smartcoldmailer.dto.EmailLogResponse;
import com.smartcoldmailer.dto.DashboardStatsResponse;
import com.smartcoldmailer.dto.BulkEmailSessionResponse;
import com.smartcoldmailer.model.BulkEmailSession;
import com.smartcoldmailer.repository.BulkEmailSessionRepository;
import com.smartcoldmailer.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import com.smartcoldmailer.security.UserPrincipal;

@Slf4j
@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "https://cold-emailing-project.vercel.app"})
public class EmailController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private BulkEmailSessionRepository bulkEmailSessionRepository;

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return principal.getId();
    }

    @PostMapping("/send-all")
    public ResponseEntity<Map<String, String>> sendBulkEmails(@Valid @RequestBody com.smartcoldmailer.dto.SendEmailRequest request) {
        String userId = getCurrentUserId();
        log.info("Sending bulk emails for user: {}", userId);
        
        // Create session upfront to get sessionId
        BulkEmailSession session = new BulkEmailSession();
        session.setUserId(userId);
        session.setStatus(BulkEmailSession.SessionStatus.IN_PROGRESS);
        session.setStartedAt(LocalDateTime.now());
        session.setResults(new ArrayList<>());
        session.setSentEmails(0);
        session.setFailedEmails(0);
        session.setTotalEmails(request.getContactIds() != null ? request.getContactIds().size() : 0);
        
        // Save session to get ID
        session = bulkEmailSessionRepository.save(session);
        String sessionId = session.getId();
        
        // Start async email sending process
        emailService.sendBulkEmails(userId, request.getTemplateId(), request.getResumePath(), request.getContactIds(), request.getSubject(), request.getBody(), session);
        
        Map<String, String> response = new java.util.HashMap<>();
        response.put("message", "Bulk email sending started. Check logs for progress.");
        response.put("sessionId", sessionId);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs")
    public ResponseEntity<List<EmailLogResponse>> getEmailLogs() {
        String userId = getCurrentUserId();
        log.info("Fetching email logs for user: {}", userId);
        List<EmailLogResponse> response = emailService.getEmailLogs(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs/paginated")
    public ResponseEntity<Map<String, Object>> getEmailLogsPaginated(@RequestParam(defaultValue = "0") int page) {
        String userId = getCurrentUserId();
        log.info("Fetching paginated email logs for user: {} - page: {}", userId, page);
        
        if (page < 0) {
            page = 0;
        }
        
        Map<String, Object> response = emailService.getEmailLogsPaginated(userId, page);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        String userId = getCurrentUserId();
        log.info("Fetching dashboard stats for user: {}", userId);
        
        long totalSent = emailService.getTotalEmailsSent(userId);
        long failedCount = emailService.getFailedEmailsCount(userId);
        long totalAttempts = totalSent + failedCount;
        double successRate = totalAttempts > 0 ? (totalSent * 100.0) / totalAttempts : 0.0;

        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        long emailsSentToday = emailService.getEmailsSentToday(userId);

        DashboardStatsResponse response = new DashboardStatsResponse();
        response.setTotalEmailsSent(totalSent);
        response.setSuccessfulEmails(totalSent);
        response.setFailedEmails(failedCount);
        response.setSuccessRate(successRate);
        response.setEmailsSentToday(emailsSentToday);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<BulkEmailSessionResponse> getSessionProgress(@PathVariable String sessionId) {
        log.info("Fetching session progress for session: {}", sessionId);
        BulkEmailSessionResponse response = emailService.getSessionProgress(sessionId);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }
}
