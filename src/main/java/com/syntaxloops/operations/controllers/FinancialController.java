package com.syntaxloops.operations.controllers;

import com.google.cloud.firestore.Firestore;
import com.syntaxloops.operations.models.finance.JournalEntry;
import com.syntaxloops.operations.services.FinancialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
@CrossOrigin(origins = "*")
public class FinancialController {

    @Autowired
    private FinancialService financialService;

    @Autowired
    private Firestore firestore;

    // 1. MANUALLY POST JOURNAL VOUCHER (For Accountants/CAs)
    @PostMapping("/journal-entries")
    public ResponseEntity<Map<String, String>> postManualVoucher(@RequestBody JournalEntry entry) {
        try {
            String entryId = financialService.postJournalEntry(entry);
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "Journal Entry committed to the general ledger system.",
                    "entryId", entryId
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "BALANCING_ERROR", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("status", "ERROR", "message", e.getMessage()));
        }
    }

    // 2. BOOTSTRAP NEW TENANT ACCOUNTING LEDGERS
    @PostMapping("/bootstrap")
    public ResponseEntity<Map<String, String>> bootstrapTenant(@RequestParam String tenantId) {
        try {
            financialService.setupDefaultChartOfAccounts(tenantId);
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Standard CA-grade Chart of Accounts initialized."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    // 3. FETCH LEDGER ENTRIES FOR UI
    @GetMapping("/journal-entries")
    public ResponseEntity<?> getJournalEntries(@RequestParam String tenantId) {
        try {
            // FIX: Native Database Sorting and Pagination
            com.google.api.core.ApiFuture<com.google.cloud.firestore.QuerySnapshot> future = firestore.collection("journal_entries")
                    .whereEqualTo("tenantId", tenantId)
                    .orderBy("timestamp", com.google.cloud.firestore.Query.Direction.DESCENDING)
                    .limit(200)
                    .get();

            java.util.List<Map<String, Object>> entries = new java.util.ArrayList<>();
            for (com.google.cloud.firestore.QueryDocumentSnapshot doc : future.get().getDocuments()) {
                entries.add(doc.getData());
            }

            // Removed heavy JVM memory sort
            return ResponseEntity.ok(entries);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    // NEW ENDPOINT: Fetch Live Bank Accounts for Treasury UI
    @GetMapping("/accounts")
    public ResponseEntity<?> getChartOfAccounts(@RequestParam String tenantId) {
        try {
            com.google.api.core.ApiFuture<com.google.cloud.firestore.QuerySnapshot> future = firestore.collection("chart_of_accounts")
                    .whereEqualTo("tenantId", tenantId)
                    .get();
            java.util.List<Map<String, Object>> accounts = new java.util.ArrayList<>();
            for (com.google.cloud.firestore.QueryDocumentSnapshot doc : future.get().getDocuments()) {
                accounts.add(doc.getData());
            }
            // Sort by account code numerically
            accounts.sort((a, b) -> {
                String codeA = (String) a.get("accountCode");
                String codeB = (String) b.get("accountCode");
                if (codeA == null) return -1;
                if (codeB == null) return 1;
                return codeA.compareTo(codeB);
            });
            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    @Autowired
    private com.syntaxloops.operations.services.ReconciliationService reconciliationService;

    // 4. COURIER PAYOUT RECONCILIATION BATCH (Multi-Bank Update)
    @PostMapping("/reconcile-payout")
    public ResponseEntity<?> reconcilePayouts(
            @RequestParam String tenantId,
            @RequestParam(required = false, defaultValue = "1001") String targetBankAccount,
            @RequestBody Map<String, Double> payouts) {
        try {
            reconciliationService.reconcileCourierPayout(tenantId, payouts, targetBankAccount);
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Payout reconciled to " + targetBankAccount));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }
}