package com.syntaxloops.operations.models.finance;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChartOfAccount {
    private String id;
    private String tenantId;
    private String accountCode;       // e.g., "1001"
    private String accountName;       // e.g., "Meezan Bank"
    private String accountCategory;   // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    private double currentBalance;
}