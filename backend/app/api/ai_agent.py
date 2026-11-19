import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from google import genai
from google.genai import types
from pydantic import BaseModel
from dotenv import load_dotenv

from app.core.database import get_db

load_dotenv()

router = APIRouter()

class ChatRequest(BaseModel):
    prompt: str

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_KEY)

@router.post("/chat")
def chat_with_dbm(request: ChatRequest, db: Session = Depends(get_db)):
    
    # ==========================================
    # 1. HERRAMIENTAS DE INVENTARIO
    # ==========================================
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

    # ==========================================
    # 2. NUEVAS HERRAMIENTAS DE VENTAS Y CLIENTES
    # ==========================================
    def obtener_ventas_hoy() -> str:
        """Obtiene el dinero total facturado o vendido en el día de hoy."""
        query = text("SELECT COALESCE(SUM(total), 0) FROM sales WHERE DATE(created_at) = CURRENT_DATE AND status = 'COMPLETED'")
        total = db.execute(query).scalar()
        return f"Las ventas totales de hoy son ${total}"

    def obtener_producto_mas_vendido() -> str:
        """Obtiene el nombre y cantidad del producto más vendido durante el mes actual."""
        query = text("""
            SELECT p.name, SUM(si.quantity) as cantidad 
            FROM sale_items si 
            JOIN sales s ON si.sale_id = s.id 
            JOIN products p ON si.product_id = p.id 
            WHERE EXTRACT(MONTH FROM s.created_at) = EXTRACT(MONTH FROM CURRENT_DATE) 
            AND EXTRACT(YEAR FROM s.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND s.status = 'COMPLETED'
            GROUP BY p.name ORDER BY cantidad DESC LIMIT 1
        """)
        result = db.execute(query).fetchone()
        if result:
            return f"El producto más vendido del mes es '{result[0]}' con {result[1]} unidades."
        return "Aún no hay ventas registradas este mes."

    def obtener_mejor_cliente() -> str:
        """Identifica al cliente que más dinero ha gastado históricamente en la tienda."""
        # Nota: Ajusta 'customers' si tu tabla se llama 'third_parties'
        query = text("""
            SELECT c.name, SUM(s.total) as total_comprado 
            FROM sales s 
            JOIN customers c ON s.customer_id = c.id 
            WHERE s.status = 'COMPLETED'
            GROUP BY c.name ORDER BY total_comprado DESC LIMIT 1
        """)
        result = db.execute(query).fetchone()
        if result:
            return f"El mejor cliente histórico es '{result[0]}' con un total de ${result[1]} en compras."
        return "Aún no hay suficientes datos de clientes."

    system_instruction = """
    Eres el 'Asistente DBM', una inteligencia artificial diseñada exclusivamente para ayudar a los dueños de 'DBM Materiales y Acabados' en Ecuador.
    Tienes acceso a herramientas (tools) para consultar la base de datos PostgreSQL de la empresa en tiempo real.
    
    Reglas:
    1. Si te preguntan por stock, ventas del día, el mejor cliente o el producto más vendido, SIEMPRE usa tus herramientas para buscar el dato real. No inventes números.
    2. Responde de manera profesional, directa y amigable.
    3. Si el stock de un producto es crítico, sugiérele al dueño que contacte a su proveedor.
    4. Usa Markdown para que tu respuesta se lea bien (negritas para números importantes, listas con viñetas).
    """

    try:
        chat = client.chats.create(
            model='gemini-3.5-flash-lite',
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                # ¡Agregamos las nuevas funciones aquí!
                tools=[
                    obtener_stock_por_nombre, 
                    obtener_productos_criticos,
                    obtener_ventas_hoy,
                    obtener_producto_mas_vendido,
                    obtener_mejor_cliente
                ],
                temperature=0.1, 
            )
        )
        
        response = chat.send_message(request.prompt)
        return {"reply": response.text}
    
    except Exception as e:
        print(f"Error Gemini: {e}")
        return {"reply": "Lo siento, los servidores de IA están saturados en este momento o hubo un error al consultar la base de datos. Por favor, intenta de nuevo. ⏳"}