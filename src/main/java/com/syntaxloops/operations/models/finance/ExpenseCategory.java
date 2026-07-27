package com.syntaxloops.operations.models.finance;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseCategory {

    // Firestore Document ID
    private String id;

    private String tenantId;
    private String headCode;
    private String categoryName;

    @Builder.Default
    private boolean isCustomEntry = true;
}