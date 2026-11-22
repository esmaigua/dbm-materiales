from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.database import engine
from app.api.third_parties import router as third_parties_router
from app.api.catalog import router as catalog_router
from app.api.transactions import router as transactions_router
from app.api.ai_agent import router as ai_router
from app.api.dashboard import router as dashboard_router
from app.api.inventory import router as inventory_router

app = FastAPI(title="DBM Materiales y Acabados API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NUEVO: Incluimos las rutas bajo el prefijo /api/v1
app.include_router(catalog_router, prefix="/api/v1", tags=["Catálogo"])
app.include_router(third_parties_router, prefix="/api/v1", tags=["Terceros"])
app.include_router(transactions_router, prefix="/api/v1", tags=["Transacciones"])
app.include_router(inventory_router, prefix="/api/v1", tags=["Inventario"])

@app.on_event("startup")
def startup_db_client():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            print("✅ Conexión a Supabase PostgreSQL exitosa.")
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")

@app.get("/")
def read_root():
    return {"status": "online", "message": "API de DBM Materiales conectada"}

app.include_router(ai_router, prefix="/api/v1", tags=["IA Asistente"])

app.include_router(dashboard_router, prefix="/api/v1", tags=["Dashboard"])