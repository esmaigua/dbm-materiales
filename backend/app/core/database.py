from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Creamos el motor de conexión
engine = create_engine(settings.DATABASE_URL, echo=False)

# Creamos la fábrica de sesiones para interactuar con la BD
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base de la cual heredarán todos nuestros modelos ORM
Base = declarative_base()

# Dependencia que usaremos en nuestros endpoints para obtener la sesión de DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()