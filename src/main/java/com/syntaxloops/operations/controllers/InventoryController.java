package com.syntaxloops.operations.controllers;

import com.syntaxloops.operations.models.ProductSku;
import com.syntaxloops.operations.services.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @PostMapping("/skus")
    public ResponseEntity<?> createSku(@RequestBody ProductSku sku) {
        try {
            String id = inventoryService.createSku(sku);
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "id", id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/skus")
    public ResponseEntity<?> getSkus(@RequestParam String tenantId) {
        try {
            List<ProductSku> skus = inventoryService.getSkusByTenant(tenantId);
            return ResponseEntity.ok(skus);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/receive-po")
    public ResponseEntity<?> receivePurchaseOrder(
            @RequestParam String tenantId,
            @RequestBody Map<String, Object> payload) {
        try {
            // Extract the 4 parameters from the raw JSON payload map sent by the frontend UI
            String skuId = (String) payload.get("skuId");
            int quantity = Integer.parseInt(payload.get("quantity").toString());
            double totalCost = Double.parseDouble(payload.get("totalCost").toString());
            String supplierName = (String) payload.get("supplierName");

            // Pass the exactly 5 expected arguments to the updated InventoryService
            inventoryService.receivePurchaseOrder(tenantId, skuId, quantity, totalCost, supplierName);

            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Stock received and financials posted."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }
}