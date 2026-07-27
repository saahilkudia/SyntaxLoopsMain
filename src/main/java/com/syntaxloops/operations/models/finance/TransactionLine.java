package com.syntaxloops.operations.models.finance;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class TransactionLine {
    private String accountCode;  // e.g., "1001" for Meezan Bank, "4001" for Sales Revenue
    private String type;         // DEBIT or CREDIT
    private double amount;
}