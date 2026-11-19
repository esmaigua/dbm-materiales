from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.catalog import Category, Product
from app.schemas.catalog import (
    CategoryCreate, CategoryResponse, 
    ProductCreate, ProductResponse, 
    ProductUpdate, ProductStatusUpdate
)
import pandas as pd
import io
from fastapi import File, UploadFile

router = APIRouter()

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).filter(Category.is_active == True).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    new_category = Category(**category.model_dump())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

@router.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    # Modificado: Ahora trae TODOS los productos (activos e inactivos)
    # para que el frontend pueda mostrarlos y permitir reactivarlos.
    return db.query(Product).all()

@router.post("/products", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    if product.category_id:
        category_exists = db.query(Category).filter(Category.id == product.category_id).first()
        if not category_exists:
            raise HTTPException(status_code=404, detail="La categoría especificada no existe")
    
    new_product = Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

# --- NUEVOS ENDPOINTS PARA EDICIÓN Y ESTADO ---

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, product_data: ProductUpdate, db: Session = Depends(get_db)):
    # 1. Buscar el producto
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # 2. Actualizar los campos
    for key, value in product_data.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
        
    db.commit()
    db.refresh(product)
    return product

@router.put("/products/{product_id}/status", response_model=ProductResponse)
def toggle_product_status(product_id: str, status_data: ProductStatusUpdate, db: Session = Depends(get_db)):
    # 1. Buscar el producto
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # 2. Cambiar el estado
    product.is_active = status_data.is_active
    
    db.commit()
    db.refresh(product)
    return product

@router.post("/products/import")
def import_products_from_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(('.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")

    try:
        contents = file.file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        df = df.fillna({
            'Descripción': 'Sin descripción',
            'Costo': 0.0,
            'Precio': 0.0,
            'Stock Mínimo': 5,
            'Es Servicio': 'NO'
        })

        required_columns = ['SKU', 'Nombre', 'Precio']
        for col in required_columns:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"Falta la columna obligatoria: {col}")

        productos_creados = 0
        productos_omitidos = 0
        
        # NUEVO: Memoria temporal para evitar duplicados dentro del mismo Excel
        skus_procesados_en_excel = set()

        for index, row in df.iterrows():
            sku_actual = str(row['SKU']).strip()
            
            # 1. Validar duplicados dentro del mismo archivo Excel
            if sku_actual in skus_procesados_en_excel:
                productos_omitidos += 1
                continue
                
            skus_procesados_en_excel.add(sku_actual)

            # 2. Validar duplicados en la base de datos
            existing_product = db.query(Product).filter(Product.sku == sku_actual).first()
            if existing_product:
                productos_omitidos += 1
                continue

            # Si pasa ambas validaciones, lo preparamos para guardar
            is_service = str(row.get('Es Servicio', 'NO')).strip().upper() == 'SI'

            new_product = Product(
                sku=sku_actual,
                name=str(row['Nombre']).strip(),
                description=str(row.get('Descripción', 'Sin descripción')).strip(),
                cost=float(row.get('Costo', 0)),
                price=float(row['Precio']),
                stock_minimo=int(row.get('Stock Mínimo', 5)),
                is_service=is_service
            )
            db.add(new_product)
            productos_creados += 1

        db.commit()
        
        # Mensaje amigable y detallado
        return {
            "message": f"✅ Importación completada: {productos_creados} creados | {productos_omitidos} omitidos (duplicados)."
        }

    except Exception as e:
        db.rollback()
        # Capturamos cualquier otro error inesperado y lo mostramos bonito
        raise HTTPException(status_code=400, detail=f"Error en el formato del Excel: {str(e)}")