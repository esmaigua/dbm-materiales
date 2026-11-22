import uuid
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    address = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class InventoryStock(Base):
    __tablename__ = "inventory_stock"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())


class InventoryTransfer(Base):
    __tablename__ = "inventory_transfers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    origin_location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    destination_location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class InventoryTransferItem(Base):
    __tablename__ = "inventory_transfer_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transfer_id = Column(UUID(as_uuid=True), ForeignKey("inventory_transfers.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)


class StockRequest(Base):
    """Se crea automáticamente cuando una venta se fuerza con stock
    insuficiente en una sucursal: queda pendiente hasta que alguien la
    atienda con una compra o un traslado desde otra sucursal."""
    __tablename__ = "stock_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    quantity_needed = Column(Numeric(10, 2), nullable=False)
    status = Column(String, nullable=False, default="PENDIENTE")  # PENDIENTE | ATENDIDA
    source_sale_id = Column(UUID(as_uuid=True), ForeignKey("sales.id"), nullable=True)
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)