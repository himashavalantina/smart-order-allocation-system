# Smart Order Allocation System

A comprehensive, full-stack application built for the Software Engineer Intern Technical Assessment. This system intelligently allocates incoming customer e-commerce orders to the optimal branch based on stock availability, geographic location, and branch workload. 

## 🚀 Live Application URL & Repository
- **GitHub Repository URL**: https://github.com/himashavalantina/smart-order-allocation-system.git
- **Live Application URL**: https://smart-order-allocation-system-two.vercel.app/

---

## ✅ Core Features Implemented
- [x] Customer order creation with product and quantity selection
- [x] Customer and location information capture (Address, Mobile, Postal Code)
- [x] Multiple branches with dynamic stock and workload information
- [x] Automatic branch allocation using a multi-criteria scoring algorithm
- [x] Order status management (Pending, Allocated, Processing, Delivered, Cancelled)
- [x] Role-based Dashboards (Customer, Branch Manager, System Admin)
- [x] Search and filtering capabilities across orders and inventory
- [x] Persistent database storage using SQLite (SQLAlchemy)
- [x] Fully functional Backend APIs built with FastAPI
- [x] Responsive, modern frontend using Next.js and Tailwind CSS
- [x] Proper validation, error handling, and robust edge-case management

---

## 💻 Technologies Used
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Zustand, Lucide Icons.
- **Backend:** Python 3.10+, FastAPI, SQLAlchemy (ORM), SQLite.
- **AI/ML:** Scikit-Learn (TF-IDF Vectorizer + Naive Bayes/Logistic Regression), Pandas.
- **Security:** PyJWT, passlib/bcrypt (Secure Password Hashing), python-dotenv.

---

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Backend Setup
Navigate to the backend directory and set up the Python environment:
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Train the ML model and seed the database with mock data:
```bash
python train.py
python seed.py
```

Run the backend server:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*(The backend API will be available at http://localhost:8000. Interactive docs at http://localhost:8000/docs)*

### 2. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```
*(The frontend will be available at http://localhost:3000)*

### 3. Demo Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@orderalloc.lk` | `Admin@123` |
| **Branch Manager** | `manager@colombo03.com` | `Manager@123` |
| **Customer (Colombo)** | `kavya@example.com` | `Customer@123` |
| **Customer (Kandy)** | `rahul@example.com` | `Customer@123` |

---

## 🏛️ System Architecture
The application follows a decoupled client-server architecture:
1. **Frontend (Client):** A responsive Single Page Application (SPA) built with Next.js and Tailwind CSS. It communicates securely with the backend via REST APIs using Axios. State is managed globally via Zustand.
2. **Backend (API):** A fast, asynchronous REST API powered by FastAPI. It handles routing, Pydantic data validation, JWT authentication, and dependency injection.
3. **Database (Data Layer):** SQLite is used for persistent storage, managed via SQLAlchemy ORM for clean, Pythonic queries and relationships.
4. **AI/ML Service:** An integrated Python pipeline that loads a pre-trained scikit-learn model into memory to classify incoming order notes on-the-fly.

---

## 🧠 Branch Allocation Logic
When a customer places an order, the system determines the best branch using a **Multi-Criteria Scoring Algorithm**. 

### The Approach:
1. **Phase 1 (Strict Stock Filter):** The system queries the database for branches that have **100% stock availability** for all requested items. If the closest branch is missing even one item, it is immediately eliminated, and the system looks for the second closest branch that has the complete stock.
2. **Phase 2 (Scoring):** The remaining eligible branches are scored based on:
   - **Proximity (Distance):** A customer's delivery location is resolved by mapping their **Sri Lankan Postal Code** to its geographic latitude and longitude centroid. The Haversine formula calculates the exact distance to each branch. Closer branches get better scores.
   - **Workload Penalty:** The system checks how many *Active (Pending/Accepted)* orders a branch currently has. High workload reduces the branch's score to prevent bottlenecks.
3. **Phase 3 (Tie-Breakers & Allocation):** If a customer is located exactly in the middle of two equidistant branches, the system's scoring automatically acts as a tie-breaker, awarding the order to the branch with the lower active workload (or higher relative stock score). Inventory is then atomically reserved in the database.

### Why this approach?
I chose this approach because a purely distance-based allocation would quickly overwhelm a central branch (e.g., Colombo) while leaving regional branches idle. By incorporating a "Workload Penalty" and "Postal Code Centroids," the system dynamically balances the load across the business without needing physical GPS tracking. If no branch in the entire network has stock, the order is gracefully flagged as "Unallocated" rather than failing, allowing managers to restock and allocate later.

---

## 🔒 Authentication & Security Approach
Security was prioritized across the stack:
1. **Passwords:** Stored securely using `bcrypt` hashing. Plaintext passwords never touch the database.
2. **Authentication:** Implemented using JSON Web Tokens (JWT) with expiration times. The frontend stores tokens securely and attaches them as Bearer tokens to protected requests.
3. **Role-Based Access Control (RBAC):** Users are assigned roles (`ADMIN`, `BRANCH_MANAGER`, `CUSTOMER`). API routes use dependency injection (`require_admin`, `require_branch_manager`) to explicitly block unauthorized horizontal/vertical access. A customer modifying local storage data cannot trick the backend into granting admin access.
4. **Input Validation:** FastAPI and Pydantic enforce strict payload schemas, rejecting invalid or malicious payloads before they hit business logic.
5. **Rate Limiting:** Sensitive endpoints are protected against brute-force attacks using `slowapi` (e.g., Logins are strictly limited to 5 attempts per minute per IP).
6. **Secrets:** Private keys for JWT generation are handled securely via `.env` files.
7. **HTTPS Readiness:** The application relies on secure cookies and authorization headers, designed to be deployed behind a reverse proxy (like Nginx or Cloudflare) that enforces HTTPS for encrypted transit in production.

---

## ⚠️ Assumptions & Limitations
1. **Location Data:** Instead of utilizing real-time GPS hardware, the system assumes customer locations based on the centroid latitude/longitude of their selected Sri Lankan Postal Code. 
2. **Database:** SQLite is used to simplify the assessment setup and evaluation. In a true production environment, this would be swapped to PostgreSQL.
3. **Concurrency:** While inventory checks are transactional, under extreme hyper-concurrency (thousands of orders per second), a more robust distributed lock (e.g., Redis) would be ideal to prevent race conditions on stock.

---

## 🤖 AI / ML Approach (Bonus Challenge)
An AI classifier was built to automatically categorize customer order notes (e.g., "Payment Issue", "Delivery Issue") to assist admins in triaging issues.
1. **Dataset & Preprocessing:** The provided dataset was cleaned, and text features were extracted using a `TfidfVectorizer`.
2. **Model Training:** A Scikit-Learn `MultinomialNB` (Naive Bayes) classifier was trained. (The script is provided in `train.py`).
3. **Inference & Fallback:** When a customer submits a note, the backend predicts the category and calculates a confidence score (probability). If the confidence is below a defined threshold (e.g., 50%), the system gracefully falls back to "General Inquiry / Uncategorized" rather than making an inaccurate guess.

---

## ✨ Recent Polish & Enhancements
- **Premium Glassmorphism UI:** Redesigned the authentication and ordering interfaces with deep translucent glass cards, dynamic background gradients, micro-interactions, and integrated social login flows.
- **Dynamic Customer Order Sequencing:** Customer dashboards intelligently display sequential, customer-relative order numbers (Order #1, Order #2) calculated dynamically via the backend, rather than exposing global database IDs.
- **Robust Inventory Deletion:** Added smart permanent product deletion. If a branch manager deletes a product, the backend securely checks if any other branch holds inventory. If not, the product is completely wiped from the global database.
- **Accurate Geolocation Resolution:** Upgraded the frontend-to-backend location mapping. The frontend now defers exact postal code centroid lookups to the backend's robust, in-memory CSV engine, guaranteeing highly accurate order routing..
- **Refined Dashboards:** Enhanced both the Customer and Branch Manager dashboards to prominently display actionable delivery details (phone numbers, full addresses) while abstracting away internal ML metrics from the customer view.
