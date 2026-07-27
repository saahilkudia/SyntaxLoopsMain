package com.syntaxloops.operations.models.finance;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
public class JournalEntry {
    private String id;
    private String tenantId;
    private String referenceNumber; // e.g., Shopify Order ID, Invoice ID, or Asset ID
    private String description;     // e.g., "Automated Revenue Realization on Delivery"
    private List<TransactionLine> lines;
    private Long timestamp;
    private String fiscalPeriod;    // e.g., "2026-07" (Crucial for Module 10's Period Locking)
    private boolean isLocked;       // Prevents tampering after a month is closed
}