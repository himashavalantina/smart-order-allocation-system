# Models package — importing all models here ensures SQLAlchemy registers
# them with Base.metadata before create_all() is called.
from app.models.user import User
from app.models.branch import Branch
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.support_ticket import SupportTicket

__all__ = ["User", "Branch", "Product", "Inventory", "Order", "OrderItem", "SupportTicket"]
