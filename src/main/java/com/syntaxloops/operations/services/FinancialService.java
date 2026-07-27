package com.syntaxloops.operations.services;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.syntaxloops.operations.models.finance.ChartOfAccount;
import com.syntaxloops.operations.models.finance.JournalEntry;
import com.syntaxloops.operations.models.finance.TransactionLine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class FinancialService {

    @Autowired
    private Firestore firestore;

    private static final String ACCOUNTS_COLLECTION = "chart_of_accounts";
    private static final String JOURNAL_COLLECTION = "journal_entries";

    // 1. POST A BALANCED JOURNAL ENTRY (The CA Gatekeeper)
    public String postJournalEntry(JournalEntry entry) throws Exception {
        // Enforce Double-Entry Balancing Rule: Total Debits must equal Total Credits
        double totalDebits = 0;
        double totalCredits = 0;

        for (TransactionLine line : entry.getLines()) {
            if ("DEBIT".equalsIgnoreCase(line.getType())) {
                totalDebits += line.getAmount();
            } else if ("CREDIT".equalsIgnoreCase(line.getType())) {
                totalCredits += line.getAmount();
            } else {
                throw new IllegalArgumentException("Invalid transaction line type: " + line.getType());
            }
        }

        // Check for rounding discrepancies up to 2 decimal places
        if (Math.abs(totalDebits - totalCredits) > 0.01) {
            throw new IllegalStateException("Accounting Error: Journal entry does not balance! Total Debits: "
                    + totalDebits + ", Total Credits: " + totalCredits);
        }

        entry.setId(UUID.randomUUID().toString());
        entry.setTimestamp(System.currentTimeMillis());
        entry.setLocked(false);

        // Atomic Batch write: Ensure either all lines affect account balances or none do
        WriteBatch batch = firestore.batch();

        // Save the Journal Entry record
        DocumentReference entryRef = firestore.collection(JOURNAL_COLLECTION).document(entry.getId());
        batch.set(entryRef, entry);

        // Dynamically adjust current balances in the Chart of Accounts
        for (TransactionLine line : entry.getLines()) {
            DocumentReference accountRef = firestore.collection(ACCOUNTS_COLLECTION)
                    .document(entry.getTenantId() + "_" + line.getAccountCode());

            // Note: In Firestore, it's safer to use FieldValue.increment() or execute a transactional adjustment
            // For a pure double-entry system, assets/expenses increase on debit; liabilities/equity/revenue increase on credit
            // We will fetch the account to see its metadata for correct directional updates
            DocumentSnapshot accountSnap = accountRef.get().get();
            if (accountSnap.exists()) {
                ChartOfAccount account = accountSnap.toObject(ChartOfAccount.class);
                if (account != null) {
                    double balanceChange = determineBalanceImpact(account.getAccountCategory(), line.getType(), line.getAmount());
                    batch.update(accountRef, "currentBalance", account.getCurrentBalance() + balanceChange);
                }
            } else {
                throw new Exception("Account code " + line.getAccountCode() + " does not exist for this tenant.");
            }
        }

        batch.commit().get();
        return entry.getId();
    }

    // Helper logic to correctly calculate debit/credit impacts depending on Asset vs Liability structures
    private double determineBalanceImpact(String category, String txnType, double amount) {
        boolean isDebit = "DEBIT".equalsIgnoreCase(txnType);
        switch (category.toUpperCase()) {
            case "ASSET":
            case "EXPENSE":
                return isDebit ? amount : -amount;
            case "LIABILITY":
            case "EQUITY":
            case "REVENUE":
                return isDebit ? -amount : amount;
            default:
                return 0;
        }
    }

    // 2. INITIALIZE STANDARD CHART OF ACCOUNTS FOR A NEW SaaS TENANT
    public void setupDefaultChartOfAccounts(String tenantId) throws ExecutionException, InterruptedException {
        String[][] defaultAccounts = {
                {"1001", "Meezan Operational Bank Account", "ASSET"},
                {"1200", "Courier Escrow Trust (COD Pipeline)", "ASSET"},
                {"1500", "Inventory Reserve Asset", "ASSET"},
                {"1800", "Fixed Operating Assets (IT Hardware/Warehouse)", "ASSET"},
                {"1850", "Accumulated Depreciation", "ASSET"}, // Contra-asset
                {"2000", "Accounts Payable (Vendor Liabilities)", "LIABILITY"},
                {"2400", "Sales Tax / GST Payable", "LIABILITY"},
                {"3000", "Owner Capital Equity", "EQUITY"},
                {"4000", "B2C Retail Sales Revenue", "REVENUE"},
                {"4100", "B2B Wholesale Sales Revenue", "REVENUE"},
                {"5000", "Cost of Goods Sold (COGS)", "EXPENSE"},
                {"5500", "Logistics & Freight Burn Expense", "EXPENSE"},
                {"5600", "Depreciation Amortization Expense", "EXPENSE"}
        };

        WriteBatch batch = firestore.batch();
        for (String[] acc : defaultAccounts) {
            ChartOfAccount coa = new ChartOfAccount();
            coa.setId(tenantId + "_" + acc[0]);
            coa.setTenantId(tenantId);
            coa.setAccountCode(acc[0]);
            coa.setAccountName(acc[1]);
            coa.setAccountCategory(acc[2]);
            coa.setCurrentBalance(0.0);

            DocumentReference docRef = firestore.collection(ACCOUNTS_COLLECTION).document(coa.getId());
            batch.set(docRef, coa);
        }
        batch.commit().get();
    }
}