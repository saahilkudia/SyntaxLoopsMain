package com.syntaxloops.operations.services;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
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
public class ReconciliationService {

    @Autowired
    private Firestore firestore;

    @Autowired
    private FinancialService financialService;

    public void reconcileCourierPayout(String tenantId, Map<String, Double> trackingNumberToPayout, String targetBankAccountId) throws Exception {

        // Use the selected bank account, or default to 1001 (Meezan Main) if missing
        String finalBankAccountId = (targetBankAccountId != null && !targetBankAccountId.isEmpty()) ? targetBankAccountId : "1001";

        for (Map.Entry<String, Double> entry : trackingNumberToPayout.entrySet()) {
            String trackingNumber = entry.getKey();
            Double actualPayout = entry.getValue();

            // 1. Fetch by tenantId ONLY (Filtered in Java to prevent FAILED_PRECONDITION Compound Index error during testing)
            ApiFuture<QuerySnapshot> future = firestore.collection("orders")
                    .whereEqualTo("tenantId", tenantId)
                    .get();

            for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
                if (trackingNumber.equals(doc.getString("trackingNumber"))) {

                    // SAFEST METHOD: Bypass the fragile Order.class mapper entirely.
                    // Read the exact values directly from the database snapshot.
                    Double grossOrderValue = doc.getDouble("totalOrderValue");
                    if (grossOrderValue == null) grossOrderValue = 0.0;

                    List<TransactionLine> lines = new ArrayList<>();
                    String jvDescription = "";
                    String endStatus = "";

                    // FIX: Full Return to Origin (RTO) Handling
                    if (actualPayout == 0.0) {
                        jvDescription = "RTO / Failed Delivery Reversal for Trk# " + trackingNumber;
                        endStatus = "RTO";

                        // 1. Credit Escrow (Clear the money owed to us since the order failed and cash won't arrive)
                        TransactionLine escrowCredit = new TransactionLine();
                        escrowCredit.setAccountCode("1200");
                        escrowCredit.setType("CREDIT");
                        escrowCredit.setAmount(grossOrderValue);
                        lines.add(escrowCredit);

                        // 2. Debit Revenue (Reverse the sales revenue that was prematurely booked)
                        TransactionLine revenueDebit = new TransactionLine();
                        revenueDebit.setAccountCode("4000"); // 4000 is Retail Revenue
                        revenueDebit.setType("DEBIT");
                        revenueDebit.setAmount(grossOrderValue);
                        lines.add(revenueDebit);

                        // Note: If the courier charged an RTO fee, we'd log a separate AP/Expense here,
                        // but to keep the core ledger balanced, we just reverse the primary sale.

                    } else {
                        // ORIGINAL LOGIC: Successful Delivery Payout
                        jvDescription = "Reconciliation: Courier Payout for Trk# " + trackingNumber;
                        endStatus = "SETTLED";

                        Double logisticsFee = grossOrderValue - actualPayout;
                        if (logisticsFee < 0) logisticsFee = 0.0; // Safety check

                        // Line 1: Debit Bank (Dynamic Target Account based on UI selection)
                        TransactionLine bankDebit = new TransactionLine();
                        bankDebit.setAccountCode(finalBankAccountId);
                        bankDebit.setType("DEBIT");
                        bankDebit.setAmount(actualPayout);
                        lines.add(bankDebit);

                        // Line 2: Debit Logistics Expense for the courier's cut
                        if (logisticsFee > 0) {
                            TransactionLine feeDebit = new TransactionLine();
                            feeDebit.setAccountCode("5500");
                            feeDebit.setType("DEBIT");
                            feeDebit.setAmount(logisticsFee);
                            lines.add(feeDebit);
                        }

                        // Line 3: Credit the Courier Escrow (reducing the money owed to you)
                        TransactionLine escrowCredit = new TransactionLine();
                        escrowCredit.setAccountCode("1200");
                        escrowCredit.setType("CREDIT");
                        escrowCredit.setAmount(actualPayout + logisticsFee); // Matches grossOrderValue
                        lines.add(escrowCredit);
                    }

                    // 2. Build the Advanced Double-Entry Ledger
                    JournalEntry journalEntry = new JournalEntry();
                    journalEntry.setTenantId(tenantId);
                    journalEntry.setDescription(jvDescription);
                    journalEntry.setFiscalPeriod(new SimpleDateFormat("yyyy-MM").format(new Date()));
                    journalEntry.setLines(lines);

                    // 3. Post to ledger (Will throw an exception and rollback if Debits != Credits)
                    financialService.postJournalEntry(journalEntry);

                    // 4. Update the Logistics Pipeline state to SETTLED or RTO
                    // We use update() instead of set() to ensure we don't accidentally erase other order fields
                    doc.getReference().update(
                            "fulfillmentStatus", endStatus,
                            "amountCollected", actualPayout
                    ).get();

                    break; // Move to the next tracking number in the payload
                }
            }
        }
    }
}