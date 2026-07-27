package com.syntaxloops.operations.controllers;

import com.syntaxloops.operations.models.finance.ExpenseCategory;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expense-heads")
@CrossOrigin(origins = "*")
public class ExpenseCategoryController {

    @Autowired
    private Firestore firestore;

    private static final String COLLECTION = "expense_categories";

    // 1. GET: Fetch all custom expense heads for the logged-in tenant
    @GetMapping
    public ResponseEntity<List<ExpenseCategory>> getCategories(@RequestParam String tenantId) throws Exception {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION)
                .whereEqualTo("tenantId", tenantId)
                .get();

        List<ExpenseCategory> categories = new ArrayList<>();
        for (QueryDocumentSnapshot doc : future.get()) {
            ExpenseCategory cat = doc.toObject(ExpenseCategory.class);
            cat.setId(doc.getId()); // Map the Firestore document ID to our model
            categories.add(cat);
        }
        return ResponseEntity.ok(categories);
    }

    // 2. POST: Add a new custom category (e.g., "Packaging Material")
    @PostMapping
    public ResponseEntity<Map<String, String>> addCategory(@RequestBody ExpenseCategory category) throws Exception {
        // Validation: Ensure mandatory fields are present
        if (category.getTenantId() == null || category.getCategoryName() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing required fields"));
        }

        firestore.collection(COLLECTION).add(category).get();
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Category head registered."));
    }

    // 3. DELETE: Remove a custom category
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCategory(@PathVariable String id) throws Exception {
        firestore.collection(COLLECTION).document(id).delete().get();
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Category head removed."));
    }
}