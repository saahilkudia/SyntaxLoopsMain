package com.syntaxloops.operations.controllers;

import com.syntaxloops.operations.services.ShopifyIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks/shopify")
@CrossOrigin(origins = "*")
public class ShopifyWebhookController {

    @Autowired
    private ShopifyIntegrationService shopifyIntegrationService;

    // This endpoint will be configured in your Shopify Admin Panel:
    // https://api.syntaxloops.com/api/v1/webhooks/shopify/{tenantId}/order-created
    @PostMapping("/{tenantId}/order-created")
    public ResponseEntity<String> handleNewOrder(
            @PathVariable String tenantId,
            @RequestHeader(value = "X-Shopify-Hmac-Sha256", required = false) String hmacHeader,
            @RequestBody String rawPayload) {

        // 1. If there is no HMAC header, reject immediately (Security First)
        if (hmacHeader == null || hmacHeader.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing HMAC Signature");
        }

        // 2. Cryptographic Validation
        boolean isValid = shopifyIntegrationService.verifyShopifyWebhook(tenantId, rawPayload, hmacHeader);
        if (!isValid) {
            System.err.println("[SECURITY ALERT] Invalid Webhook Signature attempted for tenant: " + tenantId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("HMAC Validation Failed");
        }

        // 3. Hand off to the Background Queue
        shopifyIntegrationService.processOrderAsync(tenantId, rawPayload);

        // 4. Immediately return 200 OK so Shopify doesn't timeout
        return ResponseEntity.ok("Webhook Queued Successfully");
    }
}