from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from decimal import Decimal
from app.core.database import get_db
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    
    # 1. Ventas de Hoy
    hoy_query = text("SELECT COALESCE(SUM(total), 0) FROM sales WHERE DATE(created_at) = CURRENT_DATE AND status = 'COMPLETED'")
    ventas_hoy = db.execute(hoy_query).scalar() or 0

    # 2. Ventas del Mes
    mes_query = text("SELECT COALESCE(SUM(total), 0) FROM sales WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND status = 'COMPLETED'")
    ventas_mes = db.execute(mes_query).scalar() or 0

    # 3. Compras del Mes
    compras_mes_query = text("SELECT COALESCE(SUM(total), 0) FROM purchases WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND status = 'COMPLETED'")
    compras_mes = db.execute(compras_mes_query).scalar() or 0

    # 4. Proformas Pendientes
    proformas_query = text("SELECT COUNT(*) FROM proformas WHERE status = 'DRAFT'")
    proformas_pendientes = db.execute(proformas_query).scalar() or 0

    # 5. Inventario General (Valor y Totales)
    inv_query = text("SELECT COUNT(*), COALESCE(SUM(stock_actual * cost), 0) FROM products WHERE is_active = true AND is_service = false")
    inv_data = db.execute(inv_query).fetchone()
    total_productos = inv_data[0] if inv_data else 0
    valor_inventario = inv_data[1] if inv_data else 0

    # 6. Alertas de Stock Crítico
    critico_query = text("SELECT id, sku, name, stock_actual, stock_minimo FROM products WHERE stock_actual <= stock_minimo AND is_active = true AND is_service = false ORDER BY stock_actual ASC LIMIT 5")
    criticos = db.execute(critico_query).fetchall()
    
    alertas = []
    for c in criticos:
        tipo = 'agotado' if c.stock_actual <= 0 else 'crítico'
        mensaje = f"Producto {c.name} ({c.sku}) agotado." if c.stock_actual <= 0 else f"Producto {c.name} en nivel crítico ({c.stock_actual} / {c.stock_minimo})."
        alertas.append({"tipo": tipo, "mensaje": mensaje, "tiempo": "Ahora"})

    # 7. Top Productos (Unidades Vendidas en el Mes)
    top_query = text("""
        SELECT p.name, SUM(si.quantity) as unidades
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE EXTRACT(MONTH FROM s.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        GROUP BY p.name
        ORDER BY unidades DESC
        LIMIT 4
    """)
    top_productos = [{"nombre": row[0], "unidades": float(row[1])} for row in db.execute(top_query).fetchall()]

    # 8. Historial de Ventas vs Compras (Últimos 6 meses)
    meses_nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    historial = []
    
    today = datetime.now()
    current_month = today.month
    current_year = today.year
    
    for i in range(5, -1, -1):
        m = current_month - i
        y = current_year
        if m <= 0:
            m += 12
            y -= 1
            
        v_query = text("SELECT COALESCE(SUM(total), 0) FROM sales WHERE EXTRACT(MONTH FROM created_at) = :month AND EXTRACT(YEAR FROM created_at) = :year AND status = 'COMPLETED'")
        v_mes = db.execute(v_query, {"month": m, "year": y}).scalar() or 0
        
        c_query = text("SELECT COALESCE(SUM(total), 0) FROM purchases WHERE EXTRACT(MONTH FROM created_at) = :month AND EXTRACT(YEAR FROM created_at) = :year AND status = 'COMPLETED'")
        c_mes = db.execute(c_query, {"month": m, "year": y}).scalar() or 0
        
        historial.append({
            "name": meses_nombres[m - 1],
            "ventas": float(v_mes),
            "compras": float(c_mes)
        })

    return {
        "kpis": {
            "ventasHoy": float(ventas_hoy),
            "ventasMes": float(ventas_mes),
            "comprasMes": float(compras_mes),
            "valorInventario": float(valor_inventario),
            "totalProductos": total_productos,
            "stockCritico": len(criticos),
            "proformasPendientes": proformas_pendientes
        },
        "alertas": alertas,
        "productosMasVendidos": top_productos,
        "historial": historial
    }