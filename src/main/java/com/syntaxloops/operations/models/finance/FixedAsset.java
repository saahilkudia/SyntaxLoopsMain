package com.syntaxloops.operations.models.finance;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
public class FixedAsset {
    private String id;
    private String tenantId;
    private String assetName;              // e.g., "Warehouse Sorting Conveyor"
    private String assetCategory;          // e.g., "MACHINERY", "IT_EQUIPMENT", "VEHICLE"

    // Depreciation Math Variables
    private double purchasePrice;
    private double salvageValue;           // What it's worth at the end of its life
    private int usefulLifeMonths;          // e.g., 60 months (5 years)
    private double accumulatedDepreciation; // Total value lost so far

    private Long purchaseDate;
    private boolean isActive;              // Set to false when fully depreciated or sold

    public void generateId() {
        if (this.id == null || this.id.isEmpty()) {
            this.id = UUID.randomUUID().toString();
            this.purchaseDate = System.currentTimeMillis();
            this.accumulatedDepreciation = 0.0;
            this.isActive = true;
        }
    }
}