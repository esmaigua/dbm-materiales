import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from google import genai
from google.genai import types
from pydantic import BaseModel
from dotenv import load_dotenv

# Esta es la línea que faltaba:
from app.core.database import get_db

load_dotenv()

router = APIRouter()

class ChatRequest(BaseModel):
    prompt: str

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_KEY)

@router.post("/chat")
def chat_with_dbm(request: ChatRequest, db: Session = Depends(get_db)):
    
    # 1. Nuestras herramientas de Base de Datos
    def obtener_stock_por_nombre(nombre_producto: str) -> str:
        """Busca en la base de datos el stock actual de un producto basándose en su nombre."""
        query = text("SELECT name, stock_actual, stock_minimo FROM products WHERE name ILIKE :nombre OR sku ILIKE :nombre")
        result = db.execute(query, {"nombre": f"%{nombre_producto}%"}).fetchall()
        
        if not result:
            return f"No encontré ningún producto llamado {nombre_producto}."
        
        respuestas = []
        for row in result:
            estado = "CRÍTICO" if row.stock_actual <= row.stock_minimo else "NORMAL"
            respuestas.append(f"Producto: {row.name} | Stock Actual: {row.stock_actual} | Mínimo: {row.stock_minimo} | Estado: {estado}")
        return "\n".join(respuestas)

    def obtener_productos_criticos() -> str:
        """Devuelve una lista de los productos que tienen el stock actual menor o igual al stock mínimo."""
        query = text("SELECT name, stock_actual, stock_minimo FROM products WHERE stock_actual <= stock_minimo AND is_active = true")
        result = db.execute(query).fetchall()
        
        if not result:
            return "Todos los productos tienen buen stock."
            
        respuestas = [f"- {row.name} (Stock: {row.stock_actual}, Mínimo: {row.stock_minimo})" for row in result]
        return "Productos en estado crítico:\n" + "\n".join(respuestas)

    system_instruction = """
    Eres el 'Asistente DBM', una inteligencia artificial diseñada exclusivamente para ayudar a los dueños de 'DBM Materiales y Acabados' en Ecuador.
    Tienes acceso a herramientas (tools) para consultar la base de datos PostgreSQL de la empresa en tiempo real.
    
    Reglas:
    1. Si te preguntan por stock, SIEMPRE usa tus herramientas para buscar el dato real. No inventes números.
    2. Responde de manera profesional, directa y amigable.
    3. Si el stock de un producto es crítico, sugiérele al dueño que contacte a su proveedor.
    4. Usa Markdown para que tu respuesta se lea bien (negritas para números importantes, listas con viñetas).
    """

    try:
        # 2. Sintaxis recomendada por Google (Usando el módulo Chats en vez de Models)
        chat = client.chats.create(
            model='gemini-3.5-flash-lite', # Usamos la versión 2.0 que es más estable en tráfico
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                tools=[obtener_stock_por_nombre, obtener_productos_criticos],
                temperature=0.1, 
            )
        )
        
        # 3. Enviamos el mensaje
        response = chat.send_message(request.prompt)
        return {"reply": response.text}
    
    except Exception as e:
        print(f"Error Gemini: {e}")
        return {"reply": "Lo siento, los servidores de IA están saturados en este momento. Por favor, intenta de nuevo en unos segundos. ⏳"}