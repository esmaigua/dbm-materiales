from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class PurchaseItemCreate(BaseModel):
    product_id: UUID
    quantity: Decimal
    unit_cost: Decimal

class PurchaseCreate(BaseModel):
    supplier_id: UUID
    items: List[PurchaseItemCreate]

class PurchaseResponse(BaseModel):
    id: UUID
    supplier_id: UUID
    status: str
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- VENTAS ---
class SaleItemCreate(BaseModel):
    product_id: UUID
    quantity: Decimal
    unit_price: Decimal # Aquí el vendedor puede poner un precio distinto al del catálogo

class SaleCreate(BaseModel):
    customer_id: UUID
    discount: Decimal = Decimal('0.0')
    items: List[SaleItemCreate]
    force_stock_override: bool = False

class SaleResponse(BaseModel):
    id: UUID
    customer_id: UUID
    status: str
    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    total: Decimal
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- PROFORMAS ---
class ProformaCreate(BaseModel):
    customer_id: UUID
    discount: Decimal = Decimal('0.0')
    items: List[SaleItemCreate] # Reusamos el esquema del item de venta

class ProformaResponse(BaseModel):
    id: UUID
    customer_id: UUID
    status: str
    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    total: Decimal
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)    

class ChatRequest(BaseModel):
    prompt: str