package com.syntaxloops.operations.services;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.syntaxloops.operations.models.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class OrderService {

    @Autowired
    private Firestore firestore;
    private static final String COLLECTION_NAME = "orders";

    // 1. CREATE OR UPDATE AN ORDER
    public String saveOrder(Order order) throws ExecutionException, InterruptedException {
        // Generate a unique ID if it's a brand new order
        if (order.getId() == null || order.getId().isEmpty()) {
            order.setId(UUID.randomUUID().toString());
            order.setTimestamp(System.currentTimeMillis());
            // Default to PENDING if no status is provided
            if (order.getFulfillmentStatus() == null) {
                order.setFulfillmentStatus("PENDING");
            }
        }

        // Push to Firestore
        ApiFuture<WriteResult> collectionsApiFuture = firestore.collection(COLLECTION_NAME)
                .document(order.getId())
                .set(order);

        // Wait for the write to complete and return the time it was updated
        collectionsApiFuture.get();
        return order.getId();
    }

    // 2. FETCH ALL ORDERS FOR A SPECIFIC TENANT (SaaS Security Isolation)
    public List<Order> getOrdersByTenant(String tenantId) throws ExecutionException, InterruptedException {
        List<Order> orderList = new ArrayList<>();

        // FIX: Native Firestore Sorting to prevent OutOfMemory (OOM) crashes on large datasets
        // Note: The first time this runs, GCP will print a link in the terminal to create the Compound Index. Click it.
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("tenantId", tenantId)
                .orderBy("timestamp", com.google.cloud.firestore.Query.Direction.DESCENDING)
                .limit(200) // UI Pagination Cap
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (DocumentSnapshot document : documents) {
            orderList.add(document.toObject(Order.class));
        }

        // Removed the heavy JVM memory sort block entirely
        return orderList;
    }

    @Autowired
    private AccountingBridgeService accountingBridgeService;

    // UPDATED STATE MACHINE WITH AUTOMATED FINANCIAL TRIGGERS
    public void updateOrderStatus(String orderId, String newStatus, String carrierName) throws Exception {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(orderId);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            Order order = document.toObject(Order.class);
            if (order != null) {
                String oldStatus = order.getFulfillmentStatus();
                String normalizedTarget = newStatus.toUpperCase();

                // Prevent duplicate processing if status is identical
                if (normalizedTarget.equals(oldStatus)) return;

                order.setFulfillmentStatus(normalizedTarget);
                if (carrierName != null && !carrierName.isEmpty()) {
                    order.setCarrierName(carrierName.toUpperCase());
                }

                // Save logistics state change first
                docRef.set(order);

                // --- FINANCIAL AUTOMATION INTEGRATION ---
                if ("DISPATCHED".equals(normalizedTarget)) {
                    // Phase 2: Pull the exact COGS calculated during the Shopify webhook ingestion
                    // Fallback to estimated 40% ONLY if it's a legacy or manual order without exact COGS
                    double calculatedCogs = order.getTotalCogs() > 0 ? order.getTotalCogs() : (order.getTotalOrderValue() * 0.40);
                    accountingBridgeService.triggerDispatchInventoryAccounting(order, calculatedCogs);
                }
                else if ("DELIVERED".equals(normalizedTarget)) {
                    accountingBridgeService.triggerDeliveryAccounting(order);
                }
            }
        } else {
            throw new Exception("Order not found with ID: " + orderId);
        }
    }

    // ADD THIS: Helper to fetch order by ID
    public Order getOrderById(String orderId) throws Exception {
        DocumentSnapshot doc = firestore.collection(COLLECTION_NAME).document(orderId).get().get();
        if (doc.exists()) {
            return doc.toObject(Order.class);
        }
        throw new Exception("Order not found with ID: " + orderId);
    }
}