import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.config import settings
from app.database import engine, Base
from app.middleware.rate_limit import limiter
from app.utils.location_service import load_postal_codes

# Import all models so SQLAlchemy registers them before create_all()
import app.models  # noqa: F401

from app.routers import auth, orders, branches, products, admin, classify, locations
from app.routers import support, branch_inventory

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
)

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Order Allocation System",
    description=(
        "Automatically allocates customer orders to the most suitable branch "
        "using a weighted scoring algorithm (distance + workload). "
        "Includes JWT auth, RBAC, and AI-powered customer note classification."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.on_event("startup")
def startup_event() -> None:
    """Load the Sri Lankan postal code CSV into memory once on startup."""
    load_postal_codes()

# ── Rate Limiter ──────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(branches.router)
app.include_router(products.router)
app.include_router(admin.router)
app.include_router(classify.router)
app.include_router(locations.router)
app.include_router(support.router)
app.include_router(branch_inventory.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "version": "1.0.0"}
