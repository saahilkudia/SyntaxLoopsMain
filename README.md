# SyntaxLoops

### E-Commerce Operations, Financial Reconciliation & Business Automation Platform

![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.x-brightgreen)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-yellow)
![Shopify](https://img.shields.io/badge/Shopify-Integration-green)
![Azure](https://img.shields.io/badge/Deployment-Azure-blue)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-black)

SyntaxLoops is a multi-tenant e-commerce operations and financial reconciliation platform designed to connect order processing, inventory, logistics, accounting, and financial settlement into a unified workflow.

The platform was built around a common operational problem in e-commerce: an order may originate from one system, move through inventory and logistics in another, generate a courier settlement later, and finally require manual reconciliation before the business knows what it actually earned.

SyntaxLoops brings those events together so operational activity can automatically flow into financial records.

---

## The Problem

E-commerce businesses often operate across disconnected systems.

A typical order can involve:

```text
Storefront
    ↓
Order Received
    ↓
Inventory
    ↓
Courier / Logistics
    ↓
Customer Delivery
    ↓
COD Collection
    ↓
Courier Settlement
    ↓
Bank Deposit
    ↓
Accounting
```

When these stages are handled independently, businesses can end up manually comparing:

- store orders
- inventory records
- courier reports
- COD collections
- bank deposits
- logistics charges
- accounting records

This makes reconciliation slow and creates opportunities for missing orders, incorrect payouts, inventory discrepancies, and inaccurate financial reporting.

SyntaxLoops was designed to connect these workflows.

---

# Core Architecture

```text
                     ┌─────────────────────┐
                     │       Shopify       │
                     └──────────┬──────────┘
                                │
                         Webhook Events
                                │
                                ▼
                 ┌──────────────────────────┐
                 │ Shopify Webhook Endpoint │
                 │   HMAC Verification      │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │ Async Order Processing   │
                 └────────────┬─────────────┘
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
          Order Data      SKU Mapping     Customer Data
               │              │
               │              ▼
               │       Inventory Service
               │              │
               │        Stock Deduction
               │              │
               │       COGS Calculation
               │              │
               └───────┬──────┘
                       ▼
                 Order Pipeline
                       │
                       ▼
                Accounting Bridge
                       │
                       ▼
                 Financial Ledger


Courier Settlement / Payout
            │
            ▼
    Reconciliation Engine
            │
       ┌────┴────┐
       ▼         ▼
    Settled     RTO
       │         │
       └────┬────┘
            ▼
     Journal Entries
            │
            ▼
      Financial Ledger
```

---

# Features

## Shopify Integration

SyntaxLoops includes a Shopify integration layer for automatically ingesting e-commerce orders.

Incoming Shopify webhooks are processed by the backend and transformed into the internal SyntaxLoops order model.

The integration handles:

- Shopify order webhooks
- HMAC webhook verification
- order number extraction
- customer information
- delivery information
- financial status
- line-item extraction
- SKU mapping
- order value processing
- prepaid and COD workflows

Webhook authenticity is verified before processing.

---

## Secure Webhook Verification

Shopify webhook requests are validated using HMAC-SHA256.

The platform retrieves the Shopify secret associated with the relevant tenant and compares the incoming signature against the calculated HMAC before allowing the event into the processing pipeline.

```text
Shopify Webhook
       │
       ▼
Tenant Secret Lookup
       │
       ▼
HMAC-SHA256
       │
       ▼
Signature Validation
       │
   ┌───┴───┐
 Valid   Invalid
   │         │
Process    Reject
```

This prevents unverified requests from being treated as legitimate store orders.

---

## Asynchronous Order Processing

Webhook processing is executed asynchronously so larger workloads do not need to remain on the original HTTP request thread.

Once an authenticated webhook arrives, SyntaxLoops can process the order in the background.

The processing pipeline includes:

```text
Webhook
   ↓
Parse Payload
   ↓
Extract Order
   ↓
Map Customer
   ↓
Map SKUs
   ↓
Update Inventory
   ↓
Calculate COGS
   ↓
Create Order
   ↓
Trigger Accounting Logic
```

This separates webhook acknowledgement from deeper operational processing.

---

# Order Management

Orders are converted into a common internal model instead of allowing external platforms to define the entire internal business structure.

Order records can contain information such as:

- tenant
- sales channel
- tracking number
- customer
- phone number
- delivery address
- order value
- fulfillment state
- COGS
- collection status

This provides a foundation for handling orders from multiple channels through a common operational workflow.

---

# Inventory Management

SyntaxLoops connects order ingestion directly with inventory.

When Shopify line items are processed, SKUs and quantities are extracted from the webhook payload.

The inventory layer can then:

- identify SKUs
- determine purchased quantities
- deduct e-commerce stock
- calculate product cost
- calculate total order COGS
- connect inventory movement with order processing

The resulting COGS is stored against the order for downstream financial processing.

```text
Shopify Line Items
        │
        ▼
   SKU Extraction
        │
        ▼
 Inventory Lookup
        │
        ▼
Quantity Deduction
        │
        ▼
  COGS Calculation
        │
        ▼
     Order
```

---

# Financial Accounting

SyntaxLoops includes an accounting layer designed to translate operational events into financial transactions.

Instead of treating accounting as a completely separate manual process, business events can trigger ledger activity.

The financial model includes concepts such as:

- Chart of Accounts
- Journal Entries
- Transaction Lines
- expense categories
- assets
- operational accounting events

This creates a bridge between:

```text
Operational Event
       ↓
Accounting Logic
       ↓
Journal Entry
       ↓
Transaction Lines
       ↓
Financial Records
```

---

## Accounting Bridge

The Accounting Bridge connects operational events with the financial layer.

For example, an order reaching the appropriate state can trigger accounting logic rather than requiring someone to manually reproduce the transaction later.

This architecture is intended to keep operational and accounting records synchronized.

---

# Courier Reconciliation

One of the core areas of SyntaxLoops is courier payout reconciliation.

For COD-based e-commerce, receiving an order does not mean the business has received the cash.

The lifecycle can instead look like:

```text
Order
   ↓
Dispatch
   ↓
Delivery
   ↓
Courier Collects Cash
   ↓
Courier Deducts Charges
   ↓
Business Receives Payout
```

SyntaxLoops reconciles the courier payout against the original order.

For each tracking number, the reconciliation process can compare:

```text
Gross Order Value
        -
Actual Courier Payout
        =
Logistics Cost
```

The resulting values are translated into accounting entries.

---

## Successful Settlement

For a successfully settled order, the system can account for:

```text
Debit   → Bank
Debit   → Logistics Expense
Credit  → Courier / Settlement Account
```

The order can then move into a settled state.

This connects the logistics event directly to financial reconciliation.

---

## Return to Origin (RTO)

SyntaxLoops also handles failed deliveries where the courier payout is zero.

Instead of treating the transaction as a successful sale, the reconciliation flow can reverse the corresponding financial effect.

Conceptually:

```text
Failed Delivery / RTO
        │
        ▼
Reverse Settlement Expectation
        │
        ▼
Reverse Revenue Effect
        │
        ▼
Mark Order as RTO
```

This prevents failed deliveries from remaining represented as successfully settled orders.

---

# Multi-Tenant Architecture

SyntaxLoops was designed around tenant isolation.

Business-specific data is associated with a `tenantId`, allowing multiple organizations to operate through the same application architecture while maintaining separate operational contexts.

Tenant-aware functionality includes areas such as:

- users
- orders
- inventory
- financial records
- Shopify configuration
- currency configuration
- integrations

Conceptually:

```text
                SyntaxLoops
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     Tenant A    Tenant B    Tenant C
        │           │           │
     Orders      Orders      Orders
     Stock       Stock       Stock
     Finance     Finance     Finance
```

Tenant-specific Shopify secrets can also be retrieved dynamically rather than relying on one global integration configuration.

---

# Authentication & User Management

The application contains authentication and tenant-aware user handling.

User information is stored in Firestore and can be associated with:

- tenant
- role
- name
- currency configuration
- password-reset state

Passwords stored for tenant users are hashed before comparison.

> **Security note:** This repository represents an active development codebase. Authentication and authorization architecture should be reviewed and hardened before production deployment.

---

# Expense Management

SyntaxLoops includes financial expense handling and expense categorization.

This allows operating expenses to be represented within the same financial environment used for order and settlement accounting.

The goal is to move toward a financial view that combines revenue-producing operations with the expenses required to run them.

---

# Fixed Assets & Depreciation

The financial module also contains fixed-asset and depreciation functionality.

This expands the platform beyond basic sales tracking into broader business financial management.

The architecture includes:

- fixed assets
- asset financial records
- depreciation processing
- accounting integration

---

# Financial Reconciliation Flow

A simplified end-to-end COD transaction can look like this:

```text
Customer Places Order
        │
        ▼
Shopify Webhook
        │
        ▼
Webhook Verification
        │
        ▼
Async Processing
        │
        ▼
Order Created
        │
        ├──────────────► Inventory Deduction
        │
        └──────────────► COGS Calculation
        │
        ▼
Order Dispatched
        │
        ▼
Courier Delivery
        │
        ▼
Courier Payout
        │
        ▼
Reconciliation Engine
        │
        ├──── Successful ───► Bank + Logistics Entries
        │
        └──── RTO ──────────► Financial Reversal
        │
        ▼
Financial Ledger
```

---

# Technology Stack

| Layer | Technology |
|---|---|
| Backend | Java 21 |
| Framework | Spring Boot |
| Web/API | Spring Web |
| Frontend | HTML / JavaScript |
| Database | Firebase Firestore |
| Cloud Integration | Firebase Admin SDK |
| E-Commerce | Shopify Webhooks |
| JSON Processing | Jackson |
| Async Processing | Spring Async |
| Build System | Maven |
| CI/CD | GitHub Actions |
| Deployment | Microsoft Azure |
| Authentication | Custom tenant-aware authentication |

---

# Project Structure

```text
src/main/java/com/syntaxloops/operations
│
├── config
│   ├── AsyncConfig.java
│   ├── DomainRoutingInterceptor.java
│   ├── FirebaseConfig.java
│   └── WebMvcConfig.java
│
├── controllers
│   ├── AssetController.java
│   ├── AuthController.java
│   ├── ExpenseCategoryController.java
│   ├── FinancialController.java
│   ├── InventoryController.java
│   ├── OrderController.java
│   ├── ShopifyWebhookController.java
│   └── TenantController.java
│
├── models
│   ├── Carrier.java
│   ├── Order.java
│   ├── ProductSku.java
│   │
│   └── finance
│       ├── ChartOfAccount.java
│       ├── ExpenseCategory.java
│       ├── FixedAsset.java
│       ├── JournalEntry.java
│       └── TransactionLine.java
│
├── services
│   ├── AccountingBridgeService.java
│   ├── DepreciationService.java
│   ├── FinancialService.java
│   ├── InventoryService.java
│   ├── OrderService.java
│   ├── ReconciliationService.java
│   └── ShopifyIntegrationService.java
│
└── utils
    └── SecurityUtils.java
```

---

# API Areas

The backend exposes APIs covering several areas of the platform.

```text
/api/auth
/api/orders
/api/inventory
/api/financial
/api/tenants
/api/assets
/api/expense-categories
```

The repository also contains a dedicated Shopify webhook controller for receiving e-commerce events.

---

# Firebase Configuration

SyntaxLoops uses Firebase Firestore as the data layer in this implementation.

Firebase credentials can be supplied through one of the supported configuration approaches.

For local development:

```text
src/main/resources/serviceAccountKey.json
```

The service-account file is intentionally excluded from Git and must never be committed.

For deployment, credentials can be supplied through:

```text
GCP_SA_KEY_BASE64
```

The application can also use Google Application Default Credentials where supported.

---

# Running Locally

## Requirements

- Java 21+
- Maven
- Firebase project
- Firebase service-account credentials

Clone the repository:

```bash
git clone https://github.com/saahilkudia/SyntaxLoopsMain.git
cd SyntaxLoopsMain
```

Run using the Maven wrapper:

### Linux / macOS

```bash
./mvnw spring-boot:run
```

### Windows

```bash
mvnw.cmd spring-boot:run
```

By default, the application runs on:

```text
http://localhost:8080
```

unless the `PORT` environment variable is provided.

---

# Deployment

The repository includes a GitHub Actions workflow for automated deployment to Microsoft Azure.

The pipeline performs:

```text
Push to master
      │
      ▼
GitHub Actions
      │
      ▼
Setup Java 21
      │
      ▼
Maven Build
      │
      ▼
Package JAR
      │
      ▼
Upload Build Artifact
      │
      ▼
Authenticate with Azure
      │
      ▼
Deploy to Azure Web App
```

Azure credentials and deployment identifiers are provided through GitHub repository secrets rather than being stored directly in the application source.

---

# Screenshots

Screenshots of the platform can be added here as the interface continues to evolve.

Recommended views:

- Operations Dashboard
- Order Management
- Inventory Management
- Reconciliation
- Financial Dashboard
- Chart of Accounts
- Journal Entries
- Tenant Administration

---

# Development Status

SyntaxLoops is under active development.

The architecture and feature set continue to evolve as the platform moves toward a broader e-commerce operations and financial reconciliation system.

Current development direction includes strengthening:

- e-commerce integrations
- reconciliation workflows
- authentication and authorization
- platform security
- operational automation
- financial visibility
- scalability
- deployment architecture

---

# Vision

SyntaxLoops is being developed around a simple idea:

> **Business operations should create financial truth automatically.**

Instead of requiring businesses to manually reconcile information across storefronts, couriers, spreadsheets, inventory systems, and accounting records, the long-term goal is to connect those events into a unified operational and financial workflow.

---

## Developer

**Muhammad Saahil Kudia**

Founder & Software Engineer, SyntaxLoops

[GitHub](https://github.com/saahilkudia)  
[LinkedIn](https://www.linkedin.com/in/saahilkudia/)  
[SyntaxLoops](https://syntaxloops.com/)

---

*Built as part of the ongoing development of SyntaxLoops.*