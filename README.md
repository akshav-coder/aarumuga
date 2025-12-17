# Aarumuga - Manufacturing Management System

A full-stack MERN application for managing tamarind paste manufacturing operations. Track raw material purchases, finished product sales, and inventory management for Aarumuga manufacturing unit.

## Features

- **Raw Materials Module**: Manage raw material purchases (tamarind, spices, packaging materials)
- **Product Sales Module**: Manage finished product sales (tamarind paste variants) with stock validation
- **Inventory Module**: Track both raw materials and finished products with low stock alerts
- **Customer Management**: Manage product distributors and buyers
- **Supplier Management**: Manage raw material suppliers

## Tech Stack

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- RESTful API

### Frontend

- React 19
- Material UI
- Redux Toolkit with RTK Query
- React Router

## Project Structure

```
Armuga/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── theme/
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)

### Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```bash
PORT=5001
MONGODB_URI=mongodb://localhost:27017/manufacturing_management
NODE_ENV=development
```

4. Start the server:

```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Purchases

- `GET /api/purchases` - Get all purchases (with pagination and search)
- `GET /api/purchases/:id` - Get single purchase
- `POST /api/purchases` - Create purchase
- `PUT /api/purchases/:id` - Update purchase
- `DELETE /api/purchases/:id` - Delete purchase

### Sales

- `GET /api/sales` - Get all sales (with pagination, search, and date filters)
- `GET /api/sales/:id` - Get single sale
- `POST /api/sales` - Create sale (with stock validation)
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Stock

- `GET /api/stock` - Get all stock items
- `GET /api/stock/:itemName` - Get single stock item
- `PUT /api/stock/:itemName` - Update stock manually
- `PATCH /api/stock/adjust` - Adjust stock (add/subtract)
- `DELETE /api/stock/:itemName` - Delete stock item

## Features Details

### Raw Materials Module

- Track raw material purchases (tamarind, spices, packaging)
- Auto-calculates total amount (quantity × rate)
- Automatically updates raw material inventory
- Search by item name or supplier
- Pagination support

### Product Sales Module

- Manage sales of finished products (tamarind paste variants)
- Validates stock availability before creating/updating sales
- Auto-calculates total amount
- Filters by date range
- Search by product name or customer
- Automatically decreases finished product stock on sale

### Inventory Module

- Track both raw materials and finished products separately
- Auto-updated based on purchases and sales
- Low stock highlighting (items below threshold)
- Manual stock adjustment (set quantity or add/subtract)
- Search and filter functionality

## License

ISC
