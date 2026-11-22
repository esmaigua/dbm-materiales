from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

# --- SUCURSALES ---
class LocationCreate(BaseModel):
    name: str
    address: Optional[str] = None

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None

class LocationStatusUpdate(BaseModel):
    is_active: bool

class LocationResponse(BaseModel):
    id: UUID
    name: str
    address: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

# --- STOCK POR SUCURSAL ---
class StockItemResponse(BaseModel):
    product_id: UUID
    sku: Optional[str] = None
    name: str
    location_id: UUID
    location_name: str
    quantity: Decimal
    stock_minimo: Decimal
    estado: str  # normal | bajo | critico | agotado

# --- AJUSTE MANUAL ---
class AdjustmentCreate(BaseModel):
    product_id: UUID
    location_id: UUID
    quantity: Decimal  # cantidad del ajuste, siempre positiva
    direction: str  # 'IN' (entrada) o 'OUT' (salida)
    reason: str

# --- TRASLADOS ENTRE SUCURSALES ---
class TransferItemCreate(BaseModel):
    product_id: UUID
    quantity: Decimal

class TransferCreate(BaseModel):
    origin_location_id: UUID
    destination_location_id: UUID
    notes: Optional[str] = None
    items: List[TransferItemCreate]

class TransferResponse(BaseModel):
    id: UUID
    origin_location_id: UUID
    destination_location_id: UUID
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- SOLICITUDES DE REPOSICIÓN (se crean solas al forzar una venta sin stock) ---
class StockRequestResolve(BaseModel):
    notes: Optional[str] = None