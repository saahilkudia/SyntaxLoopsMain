package com.syntaxloops.operations.services;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.syntaxloops.operations.models.finance.FixedAsset;
import com.syntaxloops.operations.models.finance.JournalEntry;
import com.syntaxloops.operations.models.finance.TransactionLine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class DepreciationService {

    @Autowired
    private Firestore firestore;

    @Autowired
    private FinancialService financialService;

    private static final String ASSET_COLLECTION = "fixed_assets";

    // 1. REGISTER A NEW ASSET
    public String registerAsset(FixedAsset asset) throws Exception {
        asset.generateId();
        firestore.collection(ASSET_COLLECTION).document(asset.getId()).set(asset).get();
        return asset.getId();
    }

    // 2. RUN MONTHLY DEPRECIATION BATCH (Can be triggered via API or a Cron Job)
    public int runMonthlyDepreciation(String tenantId) throws Exception {
        String currentPeriod = new SimpleDateFormat("yyyy-MM").format(new Date());

        // Fetch all active assets for this tenant
        ApiFuture<QuerySnapshot> future = firestore.collection(ASSET_COLLECTION)
                .whereEqualTo("tenantId", tenantId)
                .whereEqualTo("isActive", true)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        int assetsProcessed = 0;

        for (DocumentSnapshot doc : documents) {
            FixedAsset asset = doc.toObject(FixedAsset.class);
            if (asset == null || asset.getUsefulLifeMonths() <= 0) continue;

            // Straight-Line Depreciation Formula
            double depreciableBase = asset.getPurchasePrice() - asset.getSalvageValue();
            double monthlyDepreciation = depreciableBase / asset.getUsefulLifeMonths();

            // Round to 2 decimal places for financial accuracy
            monthlyDepreciation = Math.round(monthlyDepreciation * 100.0) / 100.0;

            // Stop if the asset is fully depreciated
            if (asset.getAccumulatedDepreciation() + monthlyDepreciation > depreciableBase) {
                asset.setActive(false);
                firestore.collection(ASSET_COLLECTION).document(asset.getId()).set(asset);
                continue;
            }

            // Post the Financial Journal Entry
            postDepreciationJournal(asset, monthlyDepreciation, currentPeriod);

            // Update the Asset's accumulated depreciation
            asset.setAccumulatedDepreciation(asset.getAccumulatedDepreciation() + monthlyDepreciation);
            firestore.collection(ASSET_COLLECTION).document(asset.getId()).set(asset);

            assetsProcessed++;
        }
        return assetsProcessed;
    }

    private void postDepreciationJournal(FixedAsset asset, double amount, String period) throws Exception {
        JournalEntry entry = new JournalEntry();
        entry.setTenantId(asset.getTenantId());
        entry.setReferenceNumber(asset.getId());
        entry.setDescription("Automated Monthly Depreciation for Asset: " + asset.getAssetName());
        entry.setFiscalPeriod(period);

        List<TransactionLine> lines = new ArrayList<>();

        // Debit: Depreciation Expense (Increase Expense)
        TransactionLine expDebit = new TransactionLine();
        expDebit.setAccountCode("5600");
        expDebit.setType("DEBIT");
        expDebit.setAmount(amount);
        lines.add(expDebit);

        // Credit: Accumulated Depreciation (Contra-Asset: Decreases the net value of your Assets)
        TransactionLine accCredit = new TransactionLine();
        accCredit.setAccountCode("1850");
        accCredit.setType("CREDIT");
        accCredit.setAmount(amount);
        lines.add(accCredit);

        entry.setLines(lines);
        financialService.postJournalEntry(entry);
    }
}