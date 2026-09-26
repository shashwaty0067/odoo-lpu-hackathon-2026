# StockSense — Inventory Management System

## 📌 Project Overview

**StockSense** is a modular Inventory Management System (IMS) designed to digitize and streamline stock-related operations within a business.

The system replaces manual registers, Excel sheets, and scattered stock-tracking methods with a centralized application that provides an easy-to-use view of inventory operations.

## 🎯 Target Users

- **Inventory Managers** — manage incoming and outgoing stock.
- **Warehouse Staff** — perform transfers, picking, shelving, and counting.

## 🔐 Authentication

The application provides:

- User signup and login
- OTP-based password reset
- Automatic redirection to the Inventory Dashboard after login

## 📊 Dashboard

The landing page provides a snapshot of inventory operations.

### Dashboard KPIs

- Total Products in Stock
- Low Stock / Out of Stock Items
- Pending Receipts
- Pending Deliveries
- Internal Transfers Scheduled

### Dynamic Filters

Inventory information can be filtered by:

- Document type:
  - Receipts
  - Delivery
  - Internal
  - Adjustments
- Status:
  - Draft
  - Waiting
  - Ready
  - Done
  - Canceled
- Warehouse or location
- Product category

## 🧭 Navigation

The application contains the following major sections:

1. **Products**
   - Create/update products
   - View stock availability per location
   - Product categories
   - Reordering rules

2. **Operations**
   - Receipts
   - Delivery Orders
   - Inventory Adjustment
   - Move History
   - Dashboard
   - Settings

3. **Settings**
   - Warehouse management

4. **Profile Menu**
   - My Profile
   - Logout

## 📦 Core Features

### 1. Product Management

Users can create products with:

- Name
- SKU / Code
- Category
- Unit of Measure
- Initial Stock (optional)

### 2. Receipts — Incoming Stock

Receipts are used when goods arrive from vendors.

#### Process

1. Create a new receipt.
2. Add supplier and products.
3. Enter quantities received.
4. Validate the receipt.
5. Stock increases automatically.

**Example:**

Receiving 50 units of **Steel Rods** increases stock by 50.

### 3. Delivery Orders — Outgoing Stock

Delivery Orders are used when stock leaves the warehouse for customer shipment.

#### Process

1. Pick items.
2. Pack items.
3. Validate the delivery.
4. Stock decreases automatically.

**Example:**

A sales order for 10 chairs results in the delivery order reducing chair stock by 10.

### 4. Internal Transfers

Internal transfers move stock between locations inside the company.

Examples:

- Main Warehouse → Production Floor
- Rack A → Rack B
- Warehouse 1 → Warehouse 2

Each movement is logged in the stock ledger.

**Important:** An internal transfer changes the item's location, but does not change the company's total stock quantity.

### 5. Stock Adjustments

Stock adjustments are used to correct differences between:

1. Recorded stock
2. Physical stock count

#### Process

1. Select product and location.
2. Enter the counted quantity.
3. The system automatically updates the stock.
4. The adjustment is logged.

## 🚨 Additional Features

- Low-stock alerts
- Multi-warehouse support
- SKU search
- Smart filters
- Stock movement history
- Centralized stock ledger

## 🔄 Inventory Flow

The basic inventory flow is:

```text
Vendor
   │
   ▼
Receipt
   │
   ▼
Stock Increases
   │
   ▼
Internal Transfer
   │
   ▼
Location Changes
   │
   ▼
Delivery
   │
   ▼
Stock Decreases
   │
   ▼
Stock Adjustment (if required)
   │
   ▼
Stock Ledger
```

### Example

#### Step 1 — Receive Goods

Receive **100 kg Steel**.

```text
Stock: +100 kg
```

#### Step 2 — Move Stock

Move steel from:

```text
Main Store → Production Rack
```

The total stock remains unchanged, but the location is updated.

#### Step 3 — Deliver Goods

Deliver 20 units of steel.

```text
Stock: -20
```

#### Step 4 — Adjust Damaged Items

If 3 kg of steel is damaged:

```text
Stock: -3 kg
```

All these operations are recorded in the **Stock Ledger**.

## 🗃️ Suggested Data Model

The following entities can be used to implement the requirements described in the problem statement:

```text
User
 ├── id
 ├── name
 ├── email
 └── password

Product
 ├── id
 ├── name
 ├── sku
 ├── category
 ├── unitOfMeasure
 └── initialStock

Warehouse
 ├── id
 ├── name
 └── location

Stock
 ├── id
 ├── productId
 ├── warehouseId
 └── quantity

Receipt
 ├── id
 ├── supplier
 ├── status
 └── createdAt

ReceiptItem
 ├── id
 ├── receiptId
 ├── productId
 └── quantity

Delivery
 ├── id
 ├── status
 └── createdAt

DeliveryItem
 ├── id
 ├── deliveryId
 ├── productId
 └── quantity

InternalTransfer
 ├── id
 ├── sourceLocation
 ├── destinationLocation
 ├── status
 └── createdAt

StockAdjustment
 ├── id
 ├── productId
 ├── location
 ├── recordedQuantity
 ├── countedQuantity
 └── difference

StockLedger
 ├── id
 ├── productId
 ├── operationType
 ├── quantity
 ├── sourceLocation
 ├── destinationLocation
 └── createdAt
```

> The data model above is an implementation proposal derived from the requirements. The original problem statement does not prescribe a specific database schema.

## 🔌 Suggested API Structure

A possible REST API structure is:

```text
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id

GET    /api/warehouses
POST   /api/warehouses

GET    /api/receipts
POST   /api/receipts
GET    /api/receipts/:id
PUT    /api/receipts/:id/validate

GET    /api/deliveries
POST   /api/deliveries
GET    /api/deliveries/:id
PUT    /api/deliveries/:id/validate

GET    /api/transfers
POST   /api/transfers
PUT    /api/transfers/:id

GET    /api/adjustments
POST   /api/adjustments

GET    /api/ledger
GET    /api/dashboard
```

> These API routes are suggested implementation details and are not explicitly specified in the source document.

## 🏗️ Suggested Project Structure

```text
stocksense/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   └── styles/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── utils/
│
├── database/
│   ├── migrations/
│   └── seed/
│
├── README.md
└── .env.example
```

## 🧠 Stock Update Logic

The most important business rule is that validated operations update inventory automatically.

### Receipt

```text
New Stock = Current Stock + Received Quantity
```

### Delivery

```text
New Stock = Current Stock - Delivered Quantity
```

### Internal Transfer

```text
Source Location Stock -= Transfer Quantity
Destination Location Stock += Transfer Quantity
Total Company Stock = Unchanged
```

### Adjustment

```text
Difference = Counted Quantity - Recorded Quantity

New Stock = Counted Quantity
```

Every stock-changing operation should also create a corresponding ledger entry.

## 📒 Stock Ledger

The Stock Ledger acts as the historical record of inventory movements.

A ledger entry should identify:

- Product
- Operation type
- Quantity
- Source location, where applicable
- Destination location, where applicable
- Date/time

Example:

```text
Product: Steel
Operation: Receipt
Quantity: +100 kg

Product: Steel
Operation: Internal Transfer
From: Main Store
To: Production Rack
Quantity: 100 kg

Product: Steel
Operation: Delivery
Quantity: -20 kg

Product: Steel
Operation: Adjustment
Quantity: -3 kg
Reason: Damaged
```

## 🧪 Example End-to-End Scenario

```text
1. Vendor sends 100 kg Steel
        ↓
2. Create Receipt
        ↓
3. Validate Receipt
        ↓
4. Stock becomes 100 kg
        ↓
5. Transfer Steel to Production Rack
        ↓
6. Location changes
        ↓
7. Deliver 20 kg
        ↓
8. Stock becomes 80 kg
        ↓
9. Discover 3 kg damaged
        ↓
10. Create Stock Adjustment
        ↓
11. Final stock becomes 77 kg
        ↓
12. All operations appear in Stock Ledger
```

## 🔎 Search and Filtering

The application should support:

- SKU search
- Product search
- Category filtering
- Warehouse/location filtering
- Document type filtering
- Status filtering

This allows warehouse staff and inventory managers to quickly find relevant inventory records.

## ⚠️ Low Stock

The system should provide alerts for low-stock items.

The problem statement also includes **reordering rules**, which can be used to determine when an item should be considered low stock.

The exact threshold calculation is not specified in the source document, so the implementation should define the rule separately.

## 🏢 Multi-Warehouse Support

Stock can exist across multiple warehouses or locations.

For example:

```text
Warehouse 1
 ├── Rack A
 └── Rack B

Warehouse 2
 ├── Production Floor
 └── Storage Area
```

The system should maintain stock availability by location while also allowing users to view overall inventory.

## 🛠️ Implementation Notes

The original problem statement defines the required inventory functionality but does **not** specify:

- Programming language
- Frontend framework
- Backend framework
- Database
- Hosting provider
- Authentication provider
- API architecture

Therefore, these should be selected according to the development team's requirements.

## 🚀 Development Roadmap

### Phase 1 — Authentication

- Signup
- Login
- OTP password reset
- Profile
- Logout

### Phase 2 — Products

- Product CRUD
- Categories
- SKU
- Units of Measure
- Initial stock

### Phase 3 — Warehouse & Stock

- Warehouses
- Locations
- Stock by location
- Multi-warehouse support

### Phase 4 — Operations

- Receipts
- Delivery Orders
- Internal Transfers
- Stock Adjustments

### Phase 5 — Ledger

- Record every stock movement
- Movement history
- Source/destination tracking

### Phase 6 — Dashboard

- Inventory KPIs
- Dynamic filters
- Low-stock alerts
- Pending operations

### Phase 7 — Testing & Deployment

- Unit testing
- API testing
- Authentication testing
- Inventory calculation testing
- Deployment

## 📋 Acceptance Checklist

### Authentication

- [ ] Signup works
- [ ] Login works
- [ ] OTP password reset works
- [ ] Successful login redirects to dashboard

### Products

- [ ] Create product
- [ ] Update product
- [ ] Search by SKU
- [ ] View stock by location
- [ ] Manage categories
- [ ] Configure reordering rules

### Receipts

- [ ] Create receipt
- [ ] Add supplier
- [ ] Add products
- [ ] Enter received quantity
- [ ] Validate receipt
- [ ] Increase stock automatically

### Deliveries

- [ ] Create delivery
- [ ] Pick items
- [ ] Pack items
- [ ] Validate delivery
- [ ] Decrease stock automatically

### Internal Transfers

- [ ] Select source
- [ ] Select destination
- [ ] Transfer stock
- [ ] Update locations
- [ ] Create ledger entry

### Adjustments

- [ ] Select product/location
- [ ] Enter physical count
- [ ] Calculate difference
- [ ] Update stock
- [ ] Create ledger entry

### Dashboard

- [ ] Total stock KPI
- [ ] Low/out-of-stock KPI
- [ ] Pending receipts
- [ ] Pending deliveries
- [ ] Scheduled transfers
- [ ] Dynamic filters

## 🎨 Mockup

The supplied problem statement references the following Excalidraw mockup:

https://link.excalidraw.com/l/65VNwvy7c4X/3ENvQFu9o8R

## 📚 Source

This README is based on the **StockSense — Problem Statement** supplied for this project. The source defines the inventory system, target users, dashboard, navigation, product management, receipts, deliveries, transfers, adjustments, alerts, multi-warehouse support, and stock-ledger flow.

---

## 📄 License

Add the project's license here if one is selected.
