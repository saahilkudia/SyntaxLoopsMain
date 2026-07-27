package com.syntaxloops.operations.services;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.syntaxloops.operations.models.ProductSku;
import com.syntaxloops.operations.models.finance.JournalEntry;
import com.syntaxloops.operations.models.finance.TransactionLine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class InventoryService {

    @Autowired
    private Firestore firestore;

    @Autowired
    private FinancialService financialService;

    private static final String SKU_COLLECTION = "product_skus";

    public String createSku(ProductSku sku) throws Exception {
        sku.generateId();
        firestore.collection(SKU_COLLECTION).document(sku.getId()).set(sku).get();
        return sku.getId();
    }

    public List<ProductSku> getSkusByTenant(String tenantId) throws Exception {
        ApiFuture<QuerySnapshot> future = firestore.collection(SKU_COLLECTION)
                .whereEqualTo("tenantId", tenantId)
                .get();

        List<ProductSku> skus = new ArrayList<>();
        for (DocumentSnapshot document : future.get().getDocuments()) {
            skus.add(document.toObject(ProductSku.class));
        }
        return skus;
    }

    public void receivePurchaseOrder(String tenantId, String skuId, int quantityReceived, double totalCost, String supplierName) throws Exception {
        DocumentReference skuRef = firestore.collection(SKU_COLLECTION).document(skuId);
        DocumentSnapshot snap = skuRef.get().get();

        if (!snap.exists()) throw new Exception("SKU not found.");

        ProductSku sku = snap.toObject(ProductSku.class);
        if (sku == null) throw new Exception("Invalid SKU data.");

        // 1. Calculate new moving average cost
        double totalExistingValue = sku.getCurrentStock() * sku.getAverageCost();
        double newTotalValue = totalExistingValue + totalCost;
        int newTotalStock = sku.getCurrentStock() + quantityReceived;

        double newAverageCost = newTotalStock > 0 ? (newTotalValue / newTotalStock) : 0;

        // 2. Update Physical Stock in Firestore
        sku.setCurrentStock(newTotalStock);
        sku.setAverageCost(Math.round(newAverageCost * 100.0) / 100.0);
        skuRef.set(sku).get();

        // 3. Post Financial Vouchers (Asset up, Liability up)
        JournalEntry entry = new JournalEntry();
        entry.setTenantId(tenantId);
        entry.setReferenceNumber("PO-" + System.currentTimeMillis());
        entry.setDescription("Received " + quantityReceived + " units of " + sku.getSkuCode() + " from " + supplierName);
        entry.setFiscalPeriod(new SimpleDateFormat("yyyy-MM").format(new Date()));

        List<TransactionLine> lines = new ArrayList<>();

        // Debit: Inventory Asset (1500)
        TransactionLine invDebit = new TransactionLine();
        invDebit.setAccountCode("1500");
        invDebit.setType("DEBIT");
        invDebit.setAmount(totalCost);
        lines.add(invDebit);

        // Credit: Accounts Payable (2000) -> We owe the supplier money
        TransactionLine apCredit = new TransactionLine();
        apCredit.setAccountCode("2000");
        apCredit.setType("CREDIT");
        apCredit.setAmount(totalCost);
        lines.add(apCredit);

        entry.setLines(lines);
        financialService.postJournalEntry(entry);
    }

    // PHASE 2: TRUE E-COMMERCE SYNCHRONIZATION
    // Deducts local stock based on a Shopify order and returns the exact COGS
    public double deductECommerceStock(String tenantId, Map<String, Integer> purchasedSkus) throws Exception {
        double totalCogs = 0.0;

        // Batch write to update all SKUs safely
        WriteBatch batch = firestore.batch();

        for (Map.Entry<String, Integer> item : purchasedSkus.entrySet()) {
            String skuCode = item.getKey();
            int quantityPurchased = item.getValue();

            // Locate the SKU in the catalog
            ApiFuture<QuerySnapshot> future = firestore.collection(SKU_COLLECTION)
                    .whereEqualTo("tenantId", tenantId)
                    .whereEqualTo("skuCode", skuCode)
                    .get();

            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            if (!documents.isEmpty()) {
                DocumentSnapshot skuSnap = documents.get(0);
                ProductSku sku = skuSnap.toObject(ProductSku.class);

                if (sku != null) {
                    // 1. Calculate Exact COGS for this line item
                    totalCogs += (sku.getAverageCost() * quantityPurchased);

                    // 2. Deduct physical stock
                    int newStock = sku.getCurrentStock() - quantityPurchased;
                    sku.setCurrentStock(newStock < 0 ? 0 : newStock); // Prevent negative stock mathematically

                    batch.set(skuSnap.getReference(), sku);
                }
            } else {
                System.out.println("[WARNING] Shopify Order contained Unmapped SKU: " + skuCode + ". COGS ignored for this item.");
            }
        }

        // Commit all inventory deductions atomically
        batch.commit().get();

        // Round COGS to 2 decimals for accounting integrity
        return Math.round(totalCogs * 100.0) / 100.0;
    }
}