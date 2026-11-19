import { useState, useEffect } from 'react';
import api from '../services/api';

interface Movement {
  id: string;
  date: string;
  type: string;
  quantity: number;
  reference_id: string;
  notes: string;
  product_name: string;
  product_sku: string;
}

export default function Movements() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const response = await api.get('/movements');
        setMovements(response.data);
      } catch (error) {
        console.error("Error cargando movimientos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, []);

  const filteredMovements = movements.filter(m => 
    m.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.product_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.reference_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Auditoría de Movimientos</h1>
          <p className="text-sm text-slate-500 mt-1">Registro histórico de entradas y salidas de inventario</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="relative w-full md:w-1/3">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar por producto, SKU o ID de transacción..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Fecha y Hora</th>
                <th className="p-4 font-medium">Producto</th>
                <th className="p-4 font-medium text-center">Tipo</th>
                <th className="p-4 font-medium text-center">Cantidad</th>
                <th className="p-4 font-medium">Motivo / Notas</th>
                <th className="p-4 font-medium">ID Transacción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">Cargando registros...</td></tr>
              ) : filteredMovements.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">No se encontraron movimientos.</td></tr>
              ) : filteredMovements.map((m) => {
                const isIngreso = m.type === 'PURCHASE';
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-600">
                      {new Date(m.date).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{m.product_name}</div>
                      <div className="text-xs font-mono text-slate-400">{m.product_sku}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isIngreso ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {isIngreso ? 'Entrada' : 'Salida'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-bold text-sm ${isIngreso ? 'text-green-600' : 'text-red-600'}`}>
                        {isIngreso ? '+' : '-'}{m.quantity}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{m.notes}</td>
                    <td className="p-4 text-xs font-mono text-slate-400">
                      {m.reference_id ? m.reference_id.split('-')[0].toUpperCase() : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}