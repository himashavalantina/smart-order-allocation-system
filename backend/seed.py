"""
Seed Script - Demo Data
=======================
Populates the database with branches, products, inventory, and test users with Sri Lankan postal code centroids and address data.

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
        mobile_number="0770000000",
        address_line_1="HQ Administrative Building",
        address_line_2="Suite 100",
        postal_code="00300",
        location_city="Kollupitiya (Colombo 03)",
        location_district="Colombo",
        location_lat=6.9056,
        location_lng=79.8523,
    )
    db.add(admin)

    customers = [
        User(
            email="kavya@example.com",
            hashed_password=hash_password("Customer@123"),
            full_name="Kavya Perera",
            role="CUSTOMER",
            mobile_number="0771234567",
            address_line_1="15 Galle Road",
            address_line_2="Apt 4B",
            postal_code="00300",
            location_city="Kollupitiya (Colombo 03)",
            location_district="Colombo",
            location_lat=6.9056,
            location_lng=79.8523,
        ),
        User(
            email="rahul@example.com",
            hashed_password=hash_password("Customer@123"),
            full_name="Rahul Fernando",
            role="CUSTOMER",
            mobile_number="0719876543",
            address_line_1="42 Peradeniya Road",
            address_line_2="",
            postal_code="20000",
            location_city="Kandy Central",
            location_district="Kandy",
            location_lat=7.2906,
            location_lng=80.6337,
        ),
        User(
            email="nisha@example.com",
            hashed_password=hash_password("Customer@123"),
            full_name="Nisha Rajapaksa",
            role="CUSTOMER",
            mobile_number="0765554321",
            address_line_1="88 Rampart Street",
            address_line_2="Fort View",
            postal_code="80000",
            location_city="Galle Fort",
            location_district="Galle",
            location_lat=6.0535,
            location_lng=80.2210,
        ),
        User(
            email="ashan@example.com",
            hashed_password=hash_password("Customer@123"),
            full_name="Ashan Wijesinghe",
            role="CUSTOMER",
            mobile_number="0751122334",
            address_line_1="12 Beach Road",
            address_line_2="",
            postal_code="11500",
            location_city="Negombo",
            location_district="Gampaha",
            location_lat=7.2090,
            location_lng=79.8380,
        ),
    ]
    for c in customers:
        db.add(c)
    db.commit()

    # -- Branches -------------------------------------------------------------
    print("[INFO] Creating branches...")
    branches = [
        Branch(
            name="Colombo 03 Branch",
            address="123 Galle Road, Colombo 03",
            location_lat=6.9056,
            location_lng=79.8523,
            city="Colombo 03",
        ),
        Branch(
            name="Colombo 07 Branch",
            address="45 Ward Place, Colombo 07",
            location_lat=6.9145,
            location_lng=79.8655,
            city="Colombo 07",
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

    print("[INFO] Creating branch managers...")
    manager = User(
        email="manager@colombo03.com",
        hashed_password=hash_password("Manager@123"),
        full_name="Colombo 03 Manager",
        role="BRANCH_MANAGER",
        mobile_number="0779998888",
        address_line_1="Colombo 03 Branch Office",
        address_line_2="",
        postal_code="00300",
        location_city="Colombo 03",
        location_district="Colombo",
        location_lat=6.9056,
        location_lng=79.8523,
        branch_id=branches[0].id,
    )
    db.add(manager)
    db.commit()

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
        (2, 4, 40), (2, 5, 35), (2, 6, 150), (2, 7, 100), (2, 8, 15), (2, 9, 12),
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
    print("=" * 52)
    print("  Demo Credentials (Sri Lankan Addresses)")
    print("=" * 52)
    print("  Admin:    admin@orderalloc.lk   / Admin@123")
    print("  Manager:  manager@colombo03.com / Manager@123 (Colombo 03 Branch)")
    print("  Customer: kavya@example.com     / Customer@123 (Postal Code: 00300 - Colombo 03)")
    print("  Customer: rahul@example.com     / Customer@123 (Postal Code: 20000 - Kandy)")
    print("  Customer: nisha@example.com     / Customer@123 (Postal Code: 80000 - Galle)")
    print("  Customer: ashan@example.com     / Customer@123 (Postal Code: 11500 - Negombo)")
    print("=" * 52)

except Exception as exc:
    db.rollback()
    print(f"\n[ERROR] Seed failed: {exc}")
    raise
finally:
    db.close()
