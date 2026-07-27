package com.syntaxloops.operations.controllers;

import com.syntaxloops.operations.models.Order;
import com.syntaxloops.operations.services.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*") // Allows smooth frontend connection during development
public class OrderController {

    @Autowired
    private OrderService orderService;

    // 1. INGEST / UPDATE ORDER
    @PostMapping
    public ResponseEntity<Map<String, String>> createOrUpdateOrder(@RequestBody Order order) {
        try {
            String orderId = orderService.saveOrder(order);
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "Order processed successfully",
                    "orderId", orderId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "ERROR",
                    "message", e.getMessage()
            ));
        }
    }

    // 2. FETCH TENANT ORDERS WITH SECURITY ISOLATION
    @GetMapping
    public ResponseEntity<?> getTenantOrders(@RequestParam String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing required parameter: tenantId"));
        }
        try {
            List<Order> orders = orderService.getOrdersByTenant(tenantId);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    // 3. LOGISTICS PIPELINE STATE TRANSITION
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, String>> transitionOrderStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {

        String newStatus = payload.get("status");
        String carrierName = payload.get("carrierName"); // Optional assignment during dispatch

        if (newStatus == null || newStatus.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing target status"));
        }

        try {
            orderService.updateOrderStatus(id, newStatus, carrierName);
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "Order state transitioned to " + newStatus.toUpperCase()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "ERROR",
                    "message", e.getMessage()
            ));
        }
    }
}