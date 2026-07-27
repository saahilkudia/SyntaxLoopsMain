package com.syntaxloops.operations.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
public class ProductSku {
    private String id;
    private String tenantId;
    private String skuCode;           // e.g., "BNDL-001"
    private String productName;
    private String channel;           // e.g., RETAIL, WHOLESALE

    private double unitPrice;         // Selling Price
    private double weightKg;          // Crucial for automated freight quoting later
    private int currentStock;         // Physical units in warehouse
    private double averageCost;       // Moving average cost for COGS calculation

    public void generateId() {
        if (this.id == null || this.id.isEmpty()) {
            this.id = UUID.randomUUID().toString();
            this.currentStock = 0;
            this.averageCost = 0.0;
        }
    }
}