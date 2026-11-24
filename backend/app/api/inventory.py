from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime
from app.core.database import get_db
from app.models.inventory import Location, InventoryStock, InventoryTransfer, InventoryTransferItem, StockRequest
from app.models.transactions import InventoryMovement
from app.models.catalog import Product
from app.schemas.inventory import (
    LocationCreate, LocationUpdate, LocationStatusUpdate, LocationResponse,
    StockItemResponse, AdjustmentCreate, TransferCreate, TransferResponse, StockRequestResolve
)

router = APIRouter()


# --- HELPER INTERNO: sube o baja el stock de un producto en una sucursal ---
# No usa un trigger SQL: lo mantiene el backend, en la misma transacción
# que crea el movimiento de inventario correspondiente.
def _apply_stock_delta(db: Session, product_id, location_id, delta: Decimal) -> InventoryStock:
    stock = (
        db.query(InventoryStock)
        .filter(InventoryStock.product_id == product_id, InventoryStock.location_id == location_id)
        .with_for_update()
        .first()
    )
    if not stock:
        stock = InventoryStock(product_id=product_id, location_id=location_id, quantity=Decimal('0'))
        db.add(stock)
        db.flush()
    stock.quantity = stock.quantity + delta
    return stock


def _estado_stock(quantity: Decimal, stock_minimo: Decimal) -> str:
    if quantity <= 0:
        return "agotado"
    if stock_minimo and quantity <= stock_minimo * Decimal('0.5'):
        return "critico"
    if stock_minimo and quantity <= stock_minimo:
        return "bajo"
    return "normal"


# ============================================================
# SUCURSALES
# ============================================================
@router.get("/locations", response_model=list[LocationResponse])
def list_locations(db: Session = Depends(get_db)):
    return db.query(Location).order_by(Location.name).all()


@router.post("/locations", response_model=LocationResponse)
def create_location(data: LocationCreate, db: Session = Depends(get_db)):
    location = Location(name=data.name, address=data.address)
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


@router.put("/locations/{location_id}", response_model=LocationResponse)
def update_location(location_id: str, data: LocationUpdate, db: Session = Depends(get_db)):
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    if data.name is not None:
        location.name = data.name
    if data.address is not None:
        location.address = data.address
    db.commit()
    db.refresh(location)
    return location


@router.put("/locations/{location_id}/status", response_model=LocationResponse)
def toggle_location_status(location_id: str, data: LocationStatusUpdate, db: Session = Depends(get_db)):
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    location.is_active = data.is_active
    db.commit()
    db.refresh(location)
    return location


# ============================================================
# STOCK POR SUCURSAL (para la pantalla de Inventario)
# ============================================================
@router.get("/inventory/stock", response_model=list[StockItemResponse])
def list_stock(location_id: str | None = None, db: Session = Depends(get_db)):
    query = (
        db.query(InventoryStock, Product, Location)
        .join(Product, InventoryStock.product_id == Product.id)
        .join(Location, InventoryStock.location_id == Location.id)
    )
    if location_id:
        query = query.filter(InventoryStock.location_id == location_id)

    result = []
    for stock, product, location in query.order_by(Product.name).all():
        result.append(StockItemResponse(
            product_id=product.id,
            sku=product.sku,
            name=product.name,
            location_id=location.id,
            location_name=location.name,
            quantity=stock.quantity,
            stock_minimo=product.stock_minimo,
            estado=_estado_stock(stock.quantity, product.stock_minimo),
        ))
    return result


# ============================================================
# AJUSTE MANUAL (merma, conteo físico, corrección)
# ============================================================
@router.post("/inventory/adjustments")
def create_adjustment(data: AdjustmentCreate, db: Session = Depends(get_db)):
    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="La cantidad del ajuste debe ser mayor a cero")
    if data.direction not in ("IN", "OUT"):
        raise HTTPException(status_code=400, detail="direction debe ser 'IN' o 'OUT'")

    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    location = db.query(Location).filter(Location.id == data.location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")

    delta = data.quantity if data.direction == "IN" else -data.quantity
    movement_type = "ADJUSTMENT_IN" if data.direction == "IN" else "ADJUSTMENT_OUT"

    if data.direction == "OUT":
        current = (
            db.query(InventoryStock)
            .filter(InventoryStock.product_id == data.product_id, InventoryStock.location_id == data.location_id)
            .first()
        )
        current_qty = current.quantity if current else Decimal('0')
        if current_qty < data.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"No hay suficiente stock en {location.name} para este ajuste. Disponible: {current_qty}"
            )

    _apply_stock_delta(db, data.product_id, data.location_id, delta)

    db.add(InventoryMovement(
        product_id=data.product_id,
        location_id=data.location_id,
        movement_type=movement_type,
        quantity=data.quantity,
        notes=data.reason,
    ))

    db.commit()
    return {"message": "Ajuste registrado correctamente"}


# ============================================================
# TRASLADOS ENTRE SUCURSALES
# ============================================================
@router.post("/inventory/transfers", response_model=TransferResponse)
def create_transfer(data: TransferCreate, db: Session = Depends(get_db)):
    if data.origin_location_id == data.destination_location_id:
        raise HTTPException(status_code=400, detail="El origen y el destino deben ser sucursales distintas")
    if not data.items:
        raise HTTPException(status_code=400, detail="El traslado debe tener al menos un producto")

    # Validamos stock suficiente en el origen antes de mover nada
    for item in data.items:
        stock = (
            db.query(InventoryStock)
            .filter(InventoryStock.product_id == item.product_id, InventoryStock.location_id == data.origin_location_id)
            .first()
        )
        current_qty = stock.quantity if stock else Decimal('0')
        if current_qty < item.quantity:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            name = product.name if product else item.product_id
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente de {name} en la sucursal de origen. Disponible: {current_qty}"
            )

    transfer = InventoryTransfer(
        origin_location_id=data.origin_location_id,
        destination_location_id=data.destination_location_id,
        notes=data.notes,
    )
    db.add(transfer)
    db.flush()

    for item in data.items:
        db.add(InventoryTransferItem(
            transfer_id=transfer.id,
            product_id=item.product_id,
            quantity=item.quantity,
        ))

        _apply_stock_delta(db, item.product_id, data.origin_location_id, -item.quantity)
        _apply_stock_delta(db, item.product_id, data.destination_location_id, item.quantity)

        db.add(InventoryMovement(
            product_id=item.product_id,
            location_id=data.origin_location_id,
            movement_type="TRANSFER_OUT",
            quantity=item.quantity,
            reference_id=transfer.id,
            notes=f"Traslado a otra sucursal",
        ))
        db.add(InventoryMovement(
            product_id=item.product_id,
            location_id=data.destination_location_id,
            movement_type="TRANSFER_IN",
            quantity=item.quantity,
            reference_id=transfer.id,
            notes=f"Traslado desde otra sucursal",
        ))

    db.commit()
    db.refresh(transfer)
    return transfer


# ============================================================
# SOLICITUDES DE REPOSICIÓN
# Se crean solas (ver api/transactions.py) cuando se fuerza una venta sin
# stock suficiente en una sucursal. Quedan "PENDIENTE" hasta que alguien
# las marca como atendidas manualmente, después de hacer la compra o el
# traslado correspondiente.
# ============================================================
@router.get("/stock-requests")
def list_stock_requests(status: str = "PENDIENTE", db: Session = Depends(get_db)):
    query = (
        db.query(StockRequest, Product, Location)
        .join(Product, StockRequest.product_id == Product.id)
        .join(Location, StockRequest.location_id == Location.id)
    )
    if status and status != "TODAS":
        query = query.filter(StockRequest.status == status)

    result = []
    for req, product, location in query.order_by(StockRequest.created_at.desc()).all():
        # Buscamos si hay stock disponible de este producto en OTRAS sucursales,
        # para poder sugerir un traslado en vez de obligar a comprar al proveedor.
        other_stock_rows = (
            db.query(InventoryStock, Location)
            .join(Location, InventoryStock.location_id == Location.id)
            .filter(
                InventoryStock.product_id == product.id,
                InventoryStock.location_id != location.id,
                InventoryStock.quantity > 0,
                Location.is_active == True,  # noqa: E712
            )
            .all()
        )
        other_locations_stock = [
            {
                "location_id": loc.id,
                "location_name": loc.name,
                "quantity": float(stock.quantity),
            }
            for stock, loc in other_stock_rows
        ]

        result.append({
            "id": req.id,
            "product_id": product.id,
            "product_name": product.name,
            "product_sku": product.sku,
            "location_id": location.id,
            "location_name": location.name,
            "quantity_needed": float(req.quantity_needed),
            "status": req.status,
            "notes": req.notes,
            "created_at": req.created_at,
            "other_locations_stock": other_locations_stock,
        })
    return result


@router.put("/stock-requests/{request_id}/resolve")
def resolve_stock_request(request_id: str, data: StockRequestResolve, db: Session = Depends(get_db)):
    req = db.query(StockRequest).filter(StockRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    req.status = "ATENDIDA"
    req.resolved_at = datetime.utcnow()
    if data.notes:
        req.notes = data.notes

    db.commit()
    return {"message": "Solicitud marcada como atendida"}