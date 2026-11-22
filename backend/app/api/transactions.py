from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal
from sqlalchemy import desc, func
from app.core.database import get_db
from app.models.transactions import Purchase, PurchaseItem, InventoryMovement
from app.models.catalog import Product
from app.schemas.transactions import PurchaseCreate, PurchaseResponse
from app.models.transactions import Sale, SaleItem, Proforma, ProformaItem, SalePayment
from app.schemas.transactions import SaleCreate, SaleResponse, ProformaCreate, ProformaResponse, SalePaymentCreate, SalePaymentResponse
from app.models.third_parties import Customer
from app.models.inventory import Location, InventoryStock, StockRequest
from app.api.inventory import _apply_stock_delta
router = APIRouter()


# --- HELPER: calcula el estado de pago de una venta ---
def _payment_status(total: Decimal, paid: Decimal) -> str:
    if paid <= 0:
        return "PENDIENTE"
    if paid >= total:
        return "PAGADO"
    return "ABONADO"


def _paid_total(db: Session, sale_id) -> Decimal:
    result = db.query(func.coalesce(func.sum(SalePayment.amount), 0)).filter(SalePayment.sale_id == sale_id).scalar()
    return Decimal(result)

@router.post("/purchases", response_model=PurchaseResponse)
def create_purchase(purchase_data: PurchaseCreate, db: Session = Depends(get_db)):
    if not purchase_data.items:
        raise HTTPException(status_code=400, detail="La compra debe tener al menos un producto")

    location = db.query(Location).filter(Location.id == purchase_data.location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")

    subtotal = Decimal('0.0')

    # 1. Creamos la cabecera de la compra
    new_purchase = Purchase(supplier_id=purchase_data.supplier_id, location_id=purchase_data.location_id)
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

        # 3. Creamos el movimiento de inventario (ESTO DISPARA EL TRIGGER SQL que
        # actualiza el stock agregado de products.stock_actual)
        # Solo si NO es un servicio (mano de obra)
        if not product.is_service:
            movement = InventoryMovement(
                product_id=item.product_id,
                location_id=purchase_data.location_id,
                movement_type='PURCHASE',
                quantity=item.quantity,
                reference_id=new_purchase.id,
                notes=f"Compra a proveedor"
            )
            db.add(movement)

            # Además del trigger (que suma al total), sumamos el stock
            # específico de esta sucursal.
            _apply_stock_delta(db, item.product_id, purchase_data.location_id, item.quantity)

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

# --- ENDPOINT PARA OBTENER EL HISTORIAL DE VENTAS ---
@router.get("/sales")
def get_sales(db: Session = Depends(get_db)):
    # Traemos las ventas ordenadas por fecha (las más nuevas primero)
    sales = db.query(Sale).order_by(desc(Sale.created_at)).all()

    # Formateamos la respuesta para que el frontend la lea fácil
    result = []
    for sale in sales:
        # Buscamos el nombre del cliente (antes esto consultaba Product por error
        # y el nombre nunca llegaba al frontend)
        customer_name = "Consumidor Final"
        if sale.customer_id:
            customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
            if customer:
                customer_name = customer.name

        location = db.query(Location).filter(Location.id == sale.location_id).first()

        paid_total = _paid_total(db, sale.id)
        balance = sale.total - paid_total

        result.append({
            "id": sale.id,
            "created_at": sale.created_at,
            "total": float(sale.total),
            "customer_id": sale.customer_id,
            "customer_name": customer_name,
            "location_id": sale.location_id,
            "location_name": location.name if location else None,
            "paid_total": float(paid_total),
            "balance": float(balance),
            "payment_status": _payment_status(sale.total, paid_total),
        })
    return result

# --- ENDPOINT DE VENTAS ---
@router.post("/sales", response_model=SaleResponse)
def create_sale(sale_data: SaleCreate, db: Session = Depends(get_db)):
    if not sale_data.items:
        raise HTTPException(status_code=400, detail="La venta debe tener al menos un producto")

    location = db.query(Location).filter(Location.id == sale_data.location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")

    subtotal = Decimal('0.0')
    new_sale = Sale(customer_id=sale_data.customer_id, location_id=sale_data.location_id, discount=sale_data.discount)
    db.add(new_sale)
    db.flush()

    # Acumula los faltantes de stock cuando se fuerza una venta sin stock
    # suficiente, para generar una solicitud de reposición automática
    stock_deficits: list[tuple] = []

    for item in sale_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Producto {item.product_id} no encontrado")

        # REGLA DE NEGOCIO: Validar stock DE ESA SUCURSAL, solo si NO es un
        # servicio (a menos que se fuerce la venta). stock_actual es el total
        # sumando todas las sucursales, así que ya no sirve para esta validación.
        if not product.is_service:
            stock_sucursal = (
                db.query(InventoryStock)
                .filter(InventoryStock.product_id == item.product_id, InventoryStock.location_id == sale_data.location_id)
                .first()
            )
            disponible = stock_sucursal.quantity if stock_sucursal else Decimal('0')
            if disponible < item.quantity:
                if not sale_data.force_stock_override:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Stock insuficiente de {product.name} en {location.name}. Disponible: {disponible}"
                    )
                # Se forzó la venta: registramos cuánto faltó para generar
                # la solicitud de reposición al final.
                stock_deficits.append((item.product_id, item.quantity - disponible))

        item_total = item.quantity * item.unit_price
        subtotal += item_total

        db.add(SaleItem(
            sale_id=new_sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item_total
        ))

        # REGLA DE NEGOCIO: Descontar inventario (Trigger actualiza el total,
        # y aquí además descontamos el stock específico de la sucursal) solo
        # si NO es un servicio
        if not product.is_service:
            db.add(InventoryMovement(
                product_id=item.product_id,
                location_id=sale_data.location_id,
                movement_type='SALE',
                quantity=item.quantity,
                reference_id=new_sale.id,
                notes="Venta a cliente"
            ))
            _apply_stock_delta(db, item.product_id, sale_data.location_id, -item.quantity)

    new_sale.subtotal = subtotal
    subtotal_con_descuento = subtotal - sale_data.discount
    new_sale.tax = (subtotal_con_descuento * Decimal('0.15')) if sale_data.apply_tax else Decimal('0')
    new_sale.total = subtotal_con_descuento + new_sale.tax

    # Pago inicial (opcional): si el cliente pagó algo (todo, una parte, o nada)
    if sale_data.initial_payment_amount and sale_data.initial_payment_amount > 0:
        if sale_data.initial_payment_amount > new_sale.total:
            db.rollback()
            raise HTTPException(status_code=400, detail="El pago inicial no puede ser mayor al total de la venta.")
        db.add(SalePayment(
            sale_id=new_sale.id,
            amount=sale_data.initial_payment_amount,
            payment_method=sale_data.initial_payment_method or "Efectivo",
            notes="Pago registrado al momento de la venta",
        ))

    # Si se forzó la venta con stock negativo, dejamos una solicitud de
    # reposición pendiente para que alguien la resuelva con una compra o
    # un traslado desde otra sucursal.
    for product_id, deficit in stock_deficits:
        db.add(StockRequest(
            product_id=product_id,
            location_id=sale_data.location_id,
            quantity_needed=deficit,
            source_sale_id=new_sale.id,
            notes=f"Generada automáticamente al forzar la venta #{str(new_sale.id)[:8].upper()}",
        ))

    db.commit()
    db.refresh(new_sale)
    return new_sale

# --- ENDPOINT: REGISTRAR UN ABONO SOBRE UNA VENTA EXISTENTE ---
@router.post("/sales/{sale_id}/payments", response_model=SalePaymentResponse)
def create_sale_payment(sale_id: str, data: SalePaymentCreate, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto del abono debe ser mayor a cero")

    paid_total = _paid_total(db, sale_id)
    balance = sale.total - paid_total

    if data.amount > balance:
        raise HTTPException(
            status_code=400,
            detail=f"El abono excede el saldo pendiente. Saldo actual: ${balance:.2f}"
        )

    payment = SalePayment(
        sale_id=sale_id,
        amount=data.amount,
        payment_method=data.payment_method,
        notes=data.notes,
    )
    if data.payment_date:
        payment.payment_date = data.payment_date

    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

# --- ENDPOINT: HISTORIAL DE ABONOS DE UNA VENTA ---
@router.get("/sales/{sale_id}/payments", response_model=list[SalePaymentResponse])
def list_sale_payments(sale_id: str, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    return (
        db.query(SalePayment)
        .filter(SalePayment.sale_id == sale_id)
        .order_by(SalePayment.payment_date)
        .all()
    )

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

@router.get("/sales/{sale_id}/details")
def get_sale_details(sale_id: str, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
        
    items = db.query(SaleItem).filter(SaleItem.sale_id == sale_id).all()
    customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
    
    cart_items = []
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        cart_items.append({
            "cantidad": item.quantity,
            "producto": {
                "name": product.name if product else "Producto no disponible",
                "price": item.unit_price
            }
        })
        
    return {
        "venta": {
            "id": sale.id, 
            "created_at": sale.created_at, 
            "total": float(sale.total)
        },
        "cliente": {
            "name": customer.name if customer else "Consumidor Final", 
            "document_number": customer.tax_id if customer else "9999999999"
        },
        "carrito": cart_items
    }

@router.get("/movements")
def get_inventory_movements(db: Session = Depends(get_db)):
    # Traemos los últimos 150 movimientos ordenados por el más reciente
    movements = db.query(
        InventoryMovement.id,
        InventoryMovement.created_at,
        InventoryMovement.movement_type,
        InventoryMovement.quantity,
        InventoryMovement.reference_id,
        InventoryMovement.notes,
        Product.name.label("product_name"),
        Product.sku.label("product_sku"),
        Location.name.label("location_name")
    ).join(Product, InventoryMovement.product_id == Product.id)\
     .join(Location, InventoryMovement.location_id == Location.id)\
     .order_by(desc(InventoryMovement.created_at)).limit(150).all()

    result = []
    for m in movements:
        result.append({
            "id": m.id,
            "date": m.created_at,
            "type": m.movement_type, # 'PURCHASE', 'SALE', 'ADJUSTMENT_IN/OUT', 'TRANSFER_IN/OUT'
            "quantity": float(m.quantity),
            "reference_id": m.reference_id,
            "notes": m.notes,
            "product_name": m.product_name,
            "product_sku": m.product_sku,
            "location_name": m.location_name
        })

    return result