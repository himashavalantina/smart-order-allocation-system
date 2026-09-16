# 🚚 Smart Order Allocation System

A full-stack, enterprise-ready **Smart Order Allocation System** built for multi-branch retail businesses. The system intelligently allocates incoming customer orders to the best eligible branch using a multi-criteria scoring algorithm considering **location proximity**, **stock availability**, and **branch workload capacity**. It also includes an integrated **ML NLP customer note classifier** trained on customer service request data.

---

## 🌟 Key Features

1. **Automatic 3-Phase Branch Allocation**:
   - **Phase 1 (Stock Availability Filter)**: Identifies branches with 100% stock for all ordered items.
   - **Phase 2 (Workload Filter)**: Excludes branches exceeding maximum active order capacity.
   - **Phase 3 (Multi-Criteria Scoring Engine)**: Scores remaining candidates using weighted factors:
     $$\text{Score} = (0.50 \times \text{Distance Score}) + (0.30 \times \text{Workload Score}) + (0.20 \times \text{Stock Score})$$
2. **Order Management & Cancellation Handling**:
   - Real-time stock reservation upon allocation.
   - Atomic inventory restoration & workload reduction when orders are cancelled.
3. **Machine Learning Customer Support AI**:
   - Trained on `dataset.csv` using TF-IDF + Logistic Regression.
   - Classifies customer order notes automatically into categories (Delivery Issue, Refund Request, Urgent Note, etc.) with confidence thresholding and manual review flags.
4. **Interactive Dashboards**:
   - **Customer Portal**: Browse active product catalog, place multi-item orders, track order allocation & delivery timeline, cancel active orders.
   - **Admin Command Center**: Real-time KPI overview, revenue metrics, status distribution, branch workload monitoring, inventory management, and manual order re-allocation.
5. **Security & Production Best Practices**:
   - Role-Based Access Control (RBAC with JWT + bcrypt).
   - Rate limiting middleware (60 req/min for public routes, 120 req/min for auth routes).
   - Standardized HTTP error handling & Pydantic request validation.

---

## 🏗️ Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, SQLite, Pydantic v2, Scikit-Learn, PyJWT, bcrypt.
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Axios, Zustand state management.
- **ML / AI**: Scikit-Learn (TF-IDF Vectorizer + Logistic Classifier).

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Start the Backend Server

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train the ML Support Classifier
python train.py

# Seed the database with sample branches, products, inventory, and users
python seed.py

# Run backend server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Start the Frontend Application

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

- **Application URL**: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@orderalloc.lk` | `Admin@123` |
| **Customer 1 (Colombo)** | `customer1@example.com` | `Customer@123` |
| **Customer 2 (Kandy)** | `customer2@example.com` | `Customer@123` |
| **Customer 3 (Galle)** | `customer3@example.com` | `Customer@123` |

---

## 📐 Project Structure

```
orderallocation/
├── backend/
│   ├── app/
│   │   ├── config.py              # App & database configurations
│   │   ├── database.py            # SQLAlchemy setup
│   │   ├── dependencies.py        # Auth & RBAC dependencies
│   │   ├── main.py                # FastAPI application setup & CORS
│   │   ├── middleware.py          # Rate limiting middleware
│   │   ├── models/                # SQLAlchemy database models
│   │   ├── schemas/               # Pydantic validation models
│   │   ├── services/              # Allocation engine, ML inference, Auth
│   │   ├── routers/               # API route handlers
│   │   └── ml/                    # Training dataset & model.pkl artifact
│   ├── seed.py                    # Database seeder script
│   ├── train.py                   # ML model trainer script
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js 16 App Router pages
│   │   ├── components/            # Reusable UI components & modals
│   │   ├── lib/                   # API client, types, and utility functions
│   │   └── store/                 # Zustand state stores
│   └── package.json
└── README.md
```
