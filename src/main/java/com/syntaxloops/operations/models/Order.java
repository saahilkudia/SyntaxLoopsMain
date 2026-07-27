package com.syntaxloops.operations.models;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class Order {
    private String id;
    private String tenantId;          // Multi-tenant SaaS isolation
    private String trackingNumber;    // Auto-generated or Carrier API provided

    // Consignee Details
    private String customerName;
    private String customerPhone;
    private String deliveryAddress;

    // E-Commerce Metadata
    private String salesChannel;      // e.g., RETAIL, WHOLESALE, SHOPIFY
    private String carrierName;       // e.g., TCS, TRAX, LEOPARDS

    // Financials
    private double totalOrderValue;
    private double amountCollected;   // For COD tracking
    private double totalCogs;         // Exact Cost of Goods Sold calculated at checkout

    // State Machine
    private String fulfillmentStatus; // PENDING, MANIFESTED, DISPATCHED, DELIVERED, RTO, SETTLED
    private Long timestamp;
}