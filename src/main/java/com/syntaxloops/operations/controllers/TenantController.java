package com.syntaxloops.operations.controllers;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.syntaxloops.operations.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tenants")
@CrossOrigin(origins = "*")
public class TenantController {

    @Autowired
    private Firestore firestore;

    @PostMapping("/provision")
    public ResponseEntity<?> provisionTenant(@RequestBody Map<String, String> payload) throws Exception {
        String businessName = payload.get("name");

        // 1. EXTRACT CUSTOM OVERRIDES OR USE SMART DEFAULTS
        String tenantId = businessName.toUpperCase().replaceAll("\\s+", "_") + "_HQ";

        String adminEmail = payload.get("adminEmail");
        if (adminEmail == null || adminEmail.trim().isEmpty()) {
            adminEmail = "admin@" + businessName.toLowerCase().replaceAll("\\s+", "") + ".com";
        }

        String adminName = payload.getOrDefault("adminName", businessName + " Director");

        // Extract and parse waiveSetup
        String waiveSetupStr = payload.getOrDefault("waiveSetup", "false");
        boolean waiveSetup = Boolean.parseBoolean(waiveSetupStr);

        String subRateStr = payload.getOrDefault("subRate", "3500");
        double subRate = Double.parseDouble(subRateStr);

        String tempPassword = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 2. Save Tenant Config to Firestore (Now with Billing Levers)
        Map<String, Object> tenantData = new HashMap<>();
        tenantData.put("id", tenantId);
        tenantData.put("name", businessName);
        tenantData.put("flagged", false);
        tenantData.put("waiveSetupFee", waiveSetup);
        tenantData.put("monthlyRate", subRate);
        tenantData.put("createdAt", System.currentTimeMillis());

        firestore.collection("tenants").document(tenantId).set(tenantData).get();

        // 3. Save First User to Firestore (Using secure hash)
        Map<String, Object> userData = new HashMap<>();
        userData.put("email", adminEmail);
        userData.put("password", SecurityUtils.hashPassword(tempPassword));
        userData.put("tenantId", tenantId);
        userData.put("role", "TENANT_CEO");
        userData.put("name", adminName);
        userData.put("requiresPasswordReset", true);

        firestore.collection("users").add(userData).get();

        // Return credentials to Master Admin UI
        Map<String, Object> response = new HashMap<>();
        response.put("id", tenantId);
        response.put("name", businessName);
        response.put("tempPassword", tempPassword);
        response.put("adminEmail", adminEmail);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<?> getAllTenants() throws Exception {
        ApiFuture<QuerySnapshot> future = firestore.collection("tenants").get();
        List<Map<String, Object>> tenants = new ArrayList<>();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            tenants.add(doc.getData());
        }
        return ResponseEntity.ok(tenants);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTenant(@PathVariable String id) throws Exception {
        Map<String, Object> tenant = firestore.collection("tenants").document(id).get().get().getData();
        return ResponseEntity.ok(tenant != null ? tenant : Map.of());
    }

    @PutMapping("/{id}/flag")
    public ResponseEntity<?> toggleFlag(@PathVariable String id, @RequestBody Map<String, Boolean> payload) throws Exception {
        firestore.collection("tenants").document(id).update("flagged", payload.get("flagged")).get();
        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }
}