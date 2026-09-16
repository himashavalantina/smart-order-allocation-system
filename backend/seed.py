"""
Seed Script - Demo Data
=======================
Populates the database with branches, products, inventory, and test users.

Usage (from the backend directory):
    python seed.py
"""

import os
import sys

# Ensure UTF-8 output on Windows terminals
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
import app.models  # noqa: F401 -- registers all ORM models
from app.models.user import User
from app.models.branch import Branch
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.order import Order
from app.models.order_item import OrderItem
from app.services.auth_service import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    print("[INFO] Clearing existing data...")
    db.query(OrderItem).delete()
    db.query(Order).delete()
    db.query(Inventory).delete()
    db.query(Product).delete()
    db.query(Branch).delete()
    db.query(User).delete()
    db.commit()

    # -- Users ----------------------------------------------------------------
    print("[INFO] Creating users...")
    admin = User(
        email="admin@orderalloc.lk",
        hashed_password=hash_password("Admin@123"),
        full_name="System Administrator",
        role="ADMIN",
        location_lat=6.9271,
        location_lng=79.8612,
        location_city="Colombo",
    )
    db.add(admin)

    customers = [
        User(
            email="kavya@example.com",
            hashed_password=hash_password("Customer@123"),
            full_name="Kavya Perera",
            role="CUSTOMER",
            location_lat=6.9271,
            location_lng=79.8612,
            location_city="Colombo",
        ),
        User(
            email="rahul@example.com",
            hashed_password=hash_password("Customer@123"),
            full_name="Rahul Fernando",
            role="CUSTOMER",
            location_lat=7.2906,
            location_lng=80.6337,
            location_city="Kandy",
        ),
        User(
            email="nisha@example.com",
            hashed_password=hash_password("Customer@123"),
            full_name="Nisha Rajapaksa",
            role="CUSTOMER",
            location_lat=6.0535,
            location_lng=80.2210,
            location_city="Galle",
        ),
        User(
            email="ashan@example.com",
            hashed_password=hash_password("Customer@123"),
            full_name="Ashan Wijesinghe",
            role="CUSTOMER",
            location_lat=7.2090,
            location_lng=79.8380,
            location_city="Negombo",
        ),
    ]
    for c in customers:
        db.add(c)
    db.commit()

    # -- Branches -------------------------------------------------------------
    print("[INFO] Creating branches...")
    branches = [
        Branch(
            name="Colombo Central Branch",
            address="123 Galle Road, Colombo 03",
            location_lat=6.9271,
            location_lng=79.8612,
            city="Colombo",
        ),
        Branch(
            name="Kandy Highland Branch",
            address="45 Peradeniya Road, Kandy",
            location_lat=7.2906,
            location_lng=80.6337,
            city="Kandy",
        ),
        Branch(
            name="Galle Southern Branch",
            address="78 Matara Road, Galle",
            location_lat=6.0535,
            location_lng=80.2210,
            city="Galle",
        ),
        Branch(
            name="Negombo Beach Branch",
            address="12 Beach Road, Negombo",
            location_lat=7.2090,
            location_lng=79.8380,
            city="Negombo",
        ),
        Branch(
            name="Jaffna Northern Branch",
            address="34 Hospital Road, Jaffna",
            location_lat=9.6615,
            location_lng=80.0255,
            city="Jaffna",
        ),
    ]
    for b in branches:
        db.add(b)
    db.commit()
    for b in branches:
        db.refresh(b)

    # -- Products -------------------------------------------------------------
    print("[INFO] Creating products...")
    products = [
        Product(name="Samsung Galaxy S24", description="Latest Samsung flagship smartphone with AI features", price=189990.0, category="Electronics", sku="ELEC-001"),
        Product(name="Apple iPhone 15", description="Apple's latest iPhone with A16 chip", price=219990.0, category="Electronics", sku="ELEC-002"),
        Product(name="Sony WH-1000XM5 Headphones", description="Industry-leading noise-cancelling headphones", price=49990.0, category="Electronics", sku="ELEC-003"),
        Product(name="Dell XPS 15 Laptop", description="High-performance 15-inch ultrabook for professionals", price=349990.0, category="Electronics", sku="ELEC-004"),
        Product(name="Nike Air Max 270", description="Iconic Nike running and lifestyle shoes", price=18990.0, category="Footwear", sku="FOOT-001"),
        Product(name="Adidas Ultraboost 22", description="High-performance running shoes with Boost cushioning", price=22990.0, category="Footwear", sku="FOOT-002"),
        Product(name="Organic Ceylon Green Tea 100g", description="Premium hand-picked organic Ceylon green tea", price=990.0, category="Food & Beverages", sku="FOOD-001"),
        Product(name="Nescafe Gold Blend 200g", description="Rich premium instant coffee blend", price=1490.0, category="Food & Beverages", sku="FOOD-002"),
        Product(name="Casio G-Shock GA-2100", description="Carbon Core Guard military-grade sports watch", price=29990.0, category="Accessories", sku="ACC-001"),
        Product(name="Ray-Ban Aviator Classic", description="Timeless gold-frame aviator sunglasses", price=24990.0, category="Accessories", sku="ACC-002"),
    ]
    for p in products:
        db.add(p)
    db.commit()
    for p in products:
        db.refresh(p)

    # -- Inventory (varied to demonstrate allocation logic) --------------------
    print("[INFO] Setting up inventory...")
    inv_data = [
        # Colombo -- well stocked across all categories
        (0, 0, 50), (0, 1, 30), (0, 2, 100), (0, 3, 20),
        (0, 4, 75), (0, 5, 60), (0, 6, 200), (0, 7, 150),
        (0, 8, 40), (0, 9, 35),
        # Kandy -- moderate stock, no laptop
        (1, 0, 20), (1, 1, 15), (1, 2, 45),
        (1, 4, 30), (1, 5, 25), (1, 6, 100), (1, 7, 80), (1, 8, 18),
        # Galle -- lower stock, no laptop or iPhone
        (2, 0, 10), (2, 2, 20),
        (2, 4, 40), (2, 5, 35), (2, 6, 150), (2, 7, 100), (2, 9, 12),
        # Negombo -- good food stock, limited electronics
        (3, 1, 25), (3, 3, 8),
        (3, 4, 50), (3, 6, 80), (3, 7, 60), (3, 8, 22), (3, 9, 20),
        # Jaffna -- minimal stock
        (4, 0, 5), (4, 6, 60), (4, 7, 40), (4, 4, 15),
    ]
    for b_idx, p_idx, qty in inv_data:
        db.add(
            Inventory(
                branch_id=branches[b_idx].id,
                product_id=products[p_idx].id,
                quantity=qty,
            )
        )
    db.commit()

    print("\n[OK] Seed completed successfully!\n")
    print("=" * 48)
    print("  Demo Credentials")
    print("=" * 48)
    print("  Admin:    admin@orderalloc.lk   / Admin@123")
    print("  Customer: kavya@example.com     / Customer@123 (Colombo)")
    print("  Customer: rahul@example.com     / Customer@123 (Kandy)")
    print("  Customer: nisha@example.com     / Customer@123 (Galle)")
    print("  Customer: ashan@example.com     / Customer@123 (Negombo)")
    print("=" * 48)

except Exception as exc:
    db.rollback()
    print(f"\n[ERROR] Seed failed: {exc}")
    raise
finally:
    db.close()
