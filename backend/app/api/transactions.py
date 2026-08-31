from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal

from app.core.database import get_db
from app.models.transactions import Purchase, PurchaseItem, InventoryMovement
from app.models.catalog import Product
from app.schemas.transactions import PurchaseCreate, PurchaseResponse
from app.models.transactions import Sale, SaleItem, Proforma, ProformaItem
from app.schemas.transactions import SaleCreate, SaleResponse, ProformaCreate, ProformaResponse

router = APIRouter()

@router.post("/purchases", response_model=PurchaseResponse)
def create_purchase(purchase_data: PurchaseCreate, db: Session = Depends(get_db)):
    if not purchase_data.items:
        raise HTTPException(status_code=400, detail="La compra debe tener al menos un producto")

    subtotal = Decimal('0.0')
    
    # 1. Creamos la cabecera de la compra
    new_purchase = Purchase(supplier_id=purchase_data.supplier_id)
    db.add(new_purchase)
    db.flush() # Guarda temporalmente para obtener el ID de new_purchase, sin hacer commit aún

    # 2. Procesamos cada producto
    for item in purchase_data.items:
        # Validamos que el producto exista
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Producto con ID {item.product_id} no encontrado")

        item_total = item.quantity * item.unit_cost
        subtotal += item_total

        # Creamos el detalle de la compra
        purchase_item = PurchaseItem(
            purchase_id=new_purchase.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_cost=item.unit_cost,
            total_price=item_total
        )
        db.add(purchase_item)

        # 3. Creamos el movimiento de inventario (ESTO DISPARA EL TRIGGER SQL)
        # Solo si NO es un servicio (mano de obra)
        if not product.is_service:
            movement = InventoryMovement(
                product_id=item.product_id,
                movement_type='PURCHASE',
                quantity=item.quantity,
                reference_id=new_purchase.id,
                notes=f"Compra a proveedor"
            )
            db.add(movement)
        
        # Actualizamos el costo promedio/último costo en el catálogo
        product.cost = item.unit_cost

    # Calculamos totales (Asumiendo 15% IVA para Ecuador, ajustable luego)
    new_purchase.subtotal = subtotal
    new_purchase.tax = subtotal * Decimal('0.15')
    new_purchase.total = new_purchase.subtotal + new_purchase.tax

    # 4. Guardamos todo definitivamente
    db.commit()
    db.refresh(new_purchase)

    return new_purchase

# --- ENDPOINT DE VENTAS ---
@router.post("/sales", response_model=SaleResponse)
def create_sale(sale_data: SaleCreate, db: Session = Depends(get_db)):
    if not sale_data.items:
        raise HTTPException(status_code=400, detail="La venta debe tener al menos un producto")

    subtotal = Decimal('0.0')
    new_sale = Sale(customer_id=sale_data.customer_id, discount=sale_data.discount)
    db.add(new_sale)
    db.flush()

    for item in sale_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Producto {item.product_id} no encontrado")

        # REGLA DE NEGOCIO: Validar stock solo si NO es un servicio
        # REGLA DE NEGOCIO: Validar stock (A menos que sea servicio o se fuerce la venta)
        if not product.is_service and product.stock_actual < item.quantity:
            if not sale_data.force_stock_override:
                db.rollback()
                raise HTTPException(
                    status_code=400, 
                    detail=f"Stock insuficiente para {product.name}. Disponible: {product.stock_actual}"
                )

        item_total = item.quantity * item.unit_price
        subtotal += item_total

        db.add(SaleItem(
            sale_id=new_sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item_total
        ))

        # REGLA DE NEGOCIO: Descontar inventario (Trigger) solo si NO es un servicio
        if not product.is_service:
            db.add(InventoryMovement(
                product_id=item.product_id,
                movement_type='SALE',
                quantity=item.quantity,
                reference_id=new_sale.id,
                notes="Venta a cliente"
            ))

    new_sale.subtotal = subtotal
    subtotal_con_descuento = subtotal - sale_data.discount
    new_sale.tax = subtotal_con_descuento * Decimal('0.15') # IVA Ecuador 15%
    new_sale.total = subtotal_con_descuento + new_sale.tax

    db.commit()
    db.refresh(new_sale)
    return new_sale

# --- ENDPOINT DE PROFORMAS ---
@router.post("/proformas", response_model=ProformaResponse)
def create_proforma(proforma_data: ProformaCreate, db: Session = Depends(get_db)):
    if not proforma_data.items:
        raise HTTPException(status_code=400, detail="La proforma debe tener productos")

    subtotal = Decimal('0.0')
    new_proforma = Proforma(customer_id=proforma_data.customer_id, discount=proforma_data.discount)
    db.add(new_proforma)
    db.flush()

    for item in proforma_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Producto {item.product_id} no encontrado")

        # AQUÍ NO SE VALIDA STOCK NI SE CREA MOVIMIENTO DE INVENTARIO

        item_total = item.quantity * item.unit_price
        subtotal += item_total

        db.add(ProformaItem(
            proforma_id=new_proforma.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item_total
        ))

    new_proforma.subtotal = subtotal
    subtotal_con_descuento = subtotal - proforma_data.discount
    new_proforma.tax = subtotal_con_descuento * Decimal('0.15')
    new_proforma.total = subtotal_con_descuento + new_proforma.tax

    db.commit()
    db.refresh(new_proforma)
    return new_proforma