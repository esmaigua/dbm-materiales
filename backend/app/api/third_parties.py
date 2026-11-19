from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.third_parties import Supplier, Customer
from app.schemas.third_parties import (
    SupplierCreate, SupplierResponse, SupplierUpdate, SupplierStatusUpdate,
    CustomerCreate, CustomerResponse, CustomerUpdate, CustomerStatusUpdate
)

router = APIRouter()

# ==========================================
# --- ENDPOINTS PROVEEDORES ---
# ==========================================
@router.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).all()

@router.post("/suppliers", response_model=SupplierResponse)
def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    new_supplier = Supplier(**supplier.model_dump())
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
    return new_supplier

@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: str, supplier_data: SupplierUpdate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    for key, value in supplier_data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(supplier, key, value)
            
    db.commit()
    db.refresh(supplier)
    return supplier

@router.put("/suppliers/{supplier_id}/status", response_model=SupplierResponse)
def toggle_supplier_status(supplier_id: str, status_data: SupplierStatusUpdate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    supplier.is_active = status_data.is_active
    db.commit()
    db.refresh(supplier)
    return supplier

# ==========================================
# --- ENDPOINTS CLIENTES ---
# ==========================================
@router.get("/customers", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

@router.post("/customers", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    new_customer = Customer(**customer.model_dump())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@router.put("/customers/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: str, customer_data: CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    for key, value in customer_data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(customer, key, value)
            
    db.commit()
    db.refresh(customer)
    return customer

@router.put("/customers/{customer_id}/status", response_model=CustomerResponse)
def toggle_customer_status(customer_id: str, status_data: CustomerStatusUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    customer.is_active = status_data.is_active
    db.commit()
    db.refresh(customer)
    return customer