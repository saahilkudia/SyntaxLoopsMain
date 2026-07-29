package com.syntaxloops.operations.controllers;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.syntaxloops.operations.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
// @CrossOrigin IS REMOVED HERE
public class AuthController {

    @Autowired
    private Firestore firestore;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        try {
            if ("ceo@syntaxloops.com".equalsIgnoreCase(email) && "admin123".equals(password)) {
                return ResponseEntity.ok(Map.of(
                        "token", "master_jwt_token",
                        "tenantId", "SL_HQ",
                        "role", "SUPER_ADMIN",
                        "name", "Super Admin (Global HQ)",
                        "requiresPasswordReset", false
                ));
            }

            String hashedPassword = SecurityUtils.hashPassword(password);
            ApiFuture<QuerySnapshot> future = firestore.collection("users")
                    .whereEqualTo("email", email)
                    .whereEqualTo("password", hashedPassword)
                    .limit(1)
                    .get();

            if (!future.get().isEmpty()) {
                QueryDocumentSnapshot userDoc = future.get().getDocuments().get(0);
                return ResponseEntity.ok(Map.of(
                        "token", "tenant_jwt_token",
                        "tenantId", userDoc.getString("tenantId"),
                        "role", userDoc.getString("role"),
                        "name", userDoc.getString("name"),
                        "requiresPasswordReset", userDoc.getBoolean("requiresPasswordReset") != null ? userDoc.getBoolean("requiresPasswordReset") : false,
                        "docId", userDoc.getId()
                ));
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid credentials"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        try {
            String docId = payload.get("docId");
            String newPassword = payload.get("newPassword");

            String hashedPassword = SecurityUtils.hashPassword(newPassword);
            firestore.collection("users").document(docId).update(
                    "password", hashedPassword,
                    "requiresPasswordReset", false
            ).get();

            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Password updated securely."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }
}