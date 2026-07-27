package com.syntaxloops.operations.controllers;

import com.syntaxloops.operations.models.finance.FixedAsset;
import com.syntaxloops.operations.services.DepreciationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class AssetController {

    @Autowired
    private DepreciationService depreciationService;

    @PostMapping
    public ResponseEntity<Map<String, String>> registerAsset(@RequestBody FixedAsset asset) {
        try {
            String assetId = depreciationService.registerAsset(asset);
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "assetId", assetId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/run-depreciation")
    public ResponseEntity<Map<String, Object>> runMonthlyDepreciation(@RequestParam String tenantId) {
        try {
            int processed = depreciationService.runMonthlyDepreciation(tenantId);
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "Depreciation cycle complete.",
                    "assetsUpdated", processed
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }
}