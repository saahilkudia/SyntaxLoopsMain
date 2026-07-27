package com.syntaxloops.operations.services;

import com.syntaxloops.operations.models.Order;
import com.syntaxloops.operations.models.finance.JournalEntry;
import com.syntaxloops.operations.models.finance.TransactionLine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class AccountingBridgeService {

    @Autowired
    private FinancialService financialService;

    // Standard Sales Tax Rate (e.g., 18% GST standard in Pakistan e-commerce context)
    private static final double GST_RATE = 0.18;

    // TRIGGER 1: AUTOMATED REVENUE REALIZATION & TAX SPLIT ON DELIVERY
    public void triggerDeliveryAccounting(Order order) throws Exception {
        JournalEntry entry = new JournalEntry();
        entry.setTenantId(order.getTenantId());
        entry.setReferenceNumber(order.getId());
        entry.setDescription("Automated Revenue Realization & GST Split for Order: " + order.getTrackingNumber());

        // Establish current fiscal period (YYYY-MM)
        String currentPeriod = new SimpleDateFormat("yyyy-MM").format(new Date());
        entry.setFiscalPeriod(currentPeriod);

        List<TransactionLine> lines = new ArrayList<>();

        // Math for Tax Engine: Split gross value into Base Revenue and Tax Payable
        double grossAmount = order.getTotalOrderValue();
        double baseRevenue = grossAmount / (1 + GST_RATE);
        double gstAmount = grossAmount - baseRevenue;

        // Rounding to 2 decimal places for financial integrity
        baseRevenue = Math.round(baseRevenue * 100.0) / 100.0;
        gstAmount = Math.round(gstAmount * 100.0) / 100.0;
        // Adjust any fractional rounding delta to ensure exact matches
        double roundedGross = baseRevenue + gstAmount;

        // Line 1: Debit Courier Escrow Asset (Increase Asset - Total Cash trapped in courier pipeline)
        TransactionLine escrowDebit = new TransactionLine();
        escrowDebit.setAccountCode("1200"); // Courier Escrow Trust
        escrowDebit.setType("DEBIT");
        escrowDebit.setAmount(roundedGross);
        lines.add(escrowDebit);

        // Line 2: Credit Sales Revenue (Increase Revenue - Base Amount)
        TransactionLine revenueCredit = new TransactionLine();
        // Route to dynamic revenue accounts based on sales channel
        String revenueAccount = "WHOLESALE".equalsIgnoreCase(order.getSalesChannel()) ? "4100" : "4000";
        revenueCredit.setAccountCode(revenueAccount);
        revenueCredit.setType("CREDIT");
        revenueCredit.setAmount(baseRevenue);
        lines.add(revenueCredit);

        // Line 3: Credit Sales Tax / GST Payable (Increase Liability to Federal/Provincial Tax Authority)
        TransactionLine taxCredit = new TransactionLine();
        taxCredit.setAccountCode("2400"); // Sales Tax Payable
        taxCredit.setType("CREDIT");
        taxCredit.setAmount(gstAmount);
        lines.add(taxCredit);

        entry.setLines(lines);

        // Commit via financial gateway gatekeeper
        financialService.postJournalEntry(entry);
    }

    // TRIGGER 2: AUTOMATED COGS REALIZATION ON COURIER DISPATCH
    public void triggerDispatchInventoryAccounting(Order order, double estimatedCogs) throws Exception {
        if (estimatedCogs <= 0) return; // Skip if no product cost matrix is set

        JournalEntry entry = new JournalEntry();
        entry.setTenantId(order.getTenantId());
        entry.setReferenceNumber(order.getId());
        entry.setDescription("Automated Inventory De-allocation & COGS Recognition for Order: " + order.getTrackingNumber());
        entry.setFiscalPeriod(new SimpleDateFormat("yyyy-MM").format(new Date()));

        List<TransactionLine> lines = new ArrayList<>();

        // Line 1: Debit Cost of Goods Sold (Increase Expense)
        TransactionLine cogsDebit = new TransactionLine();
        cogsDebit.setAccountCode("5000"); // COGS
        cogsDebit.setType("DEBIT");
        cogsDebit.setAmount(estimatedCogs);
        lines.add(cogsDebit);

        // Line 2: Credit Inventory Reserve (Decrease Asset)
        TransactionLine inventoryCredit = new TransactionLine();
        inventoryCredit.setAccountCode("1500"); // Inventory Reserve Asset
        inventoryCredit.setType("CREDIT");
        inventoryCredit.setAmount(estimatedCogs);
        lines.add(inventoryCredit);

        entry.setLines(lines);
        financialService.postJournalEntry(entry);
    }
}