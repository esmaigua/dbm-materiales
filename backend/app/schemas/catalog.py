from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

# --- ESQUEMAS PARA CATEGORÍAS ---
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True) # Permite leer objetos de SQLAlchemy

# --- ESQUEMAS PARA PRODUCTOS ---
class ProductBase(BaseModel):
    category_id: Optional[UUID] = None
    sku: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: Decimal
    cost: Decimal
    stock_minimo: Decimal = Decimal('0.0')
    is_service: bool = False

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: UUID
    stock_actual: Decimal
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProductUpdate(BaseModel):
    sku: str
    name: str
    price: float
    cost: float
    stock_minimo: int
    category_id: Optional[str] = None

class ProductStatusUpdate(BaseModel):
    is_active: bool