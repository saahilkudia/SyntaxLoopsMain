package com.syntaxloops.operations.models;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class Carrier {
    private String id;
    private String tenantId;
    private String carrierName;       // e.g., "TCS Logistics"
    private String apiCode;           // e.g., "TCS", "TRX" (useful for webhook routing later)
    private boolean isActive;
}