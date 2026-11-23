import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock_actual: number;
  stock_minimo: number;
  is_service: boolean;
  is_active: boolean;
}

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Estado para la importación
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    sku: '', name: '', description: 'Sin descripción', price: 0, cost: 0, stock_minimo: 5, is_service: false
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error("Error cargando productos:", error);
      alert("No se pudo cargar el catálogo de productos. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error guardando producto:", error);
      alert("Error al guardar. Verifica la consola.");
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku, name: product.name, description: product.description || 'Sin descripción',
      price: product.price, cost: product.cost, stock_minimo: product.stock_minimo, is_service: product.is_service || false
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ sku: '', name: '', description: 'Sin descripción', price: 0, cost: 0, stock_minimo: 5, is_service: false });
    setIsModalOpen(true);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (confirm(`¿Desactivar/Activar este producto?`)) {
      try {
        await api.put(`/products/${id}/status`, { is_active: !currentStatus });
        fetchProducts();
      } catch (error: any) {
        console.error("Error cambiando estado:", error);
        alert(error.response?.data?.detail || "Error al cambiar el estado del producto.");
      }
    }
  };

  // --- LÓGICA DE EXCEL ---
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      'SKU': 'EJEMPLO-001',
      'Nombre': 'Saco de Cemento 50kg',
      'Descripción': 'Uso general',
      'Costo': 6.50,
      'Precio': 8.00,
      'Stock Mínimo': 10,
      'Es Servicio': 'NO'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "Plantilla_Productos_DBM.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsImporting(true);
      const res = await api.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message);
      fetchProducts(); 
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al importar el archivo Excel");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo de Productos</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de inventario, precios y artículos de la tienda</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button 
              onClick={downloadTemplate}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg shadow-sm font-medium transition-colors text-sm"
            >
              📥 Plantilla
            </button>
            
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-sm font-medium transition-colors text-sm disabled:opacity-70"
            >
              {isImporting ? '⏳ Subiendo...' : '📁 Importar Excel'}
            </button>

            <button 
              onClick={openCreateModal}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg shadow-sm font-medium transition-colors text-sm"
            >
              + Nuevo Producto
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1 overflow-hidden p-6">
        <div className="mb-6">
          <div className="relative w-full md:w-1/2 lg:w-1/3">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar producto por nombre o SKU..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="pb-3 font-medium">SKU</th>
                <th className="pb-3 font-medium">Nombre / Detalles</th>
                <th className="pb-3 font-medium text-right">Stock</th>
                {isAdmin && <th className="pb-3 font-medium text-right">Costo</th>}
                <th className="pb-3 font-medium text-right">Precio</th>
                <th className="pb-3 font-medium text-center">Estado</th>
                {isAdmin && <th className="pb-3 font-medium text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">Cargando catálogo...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">No se encontraron productos.</td></tr>
              ) : filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 text-sm font-mono text-slate-400">{p.sku}</td>
                  <td className="py-4">
                    <div className="font-medium text-slate-700">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.description}</div>
                  </td>
                  <td className="py-4 text-right">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${p.stock_actual <= p.stock_minimo ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-600'}`}>
                      {p.stock_actual}
                    </span>
                  </td>
                  {isAdmin && <td className="py-4 text-right text-sm text-slate-500">${Number(p.cost).toFixed(2)}</td>}
                  <td className="py-4 text-right font-bold text-orange-600">${Number(p.price).toFixed(2)}</td>
                  <td className="py-4 text-center">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${p.is_active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(p)} className="text-blue-500 hover:text-blue-700 text-xs font-medium mr-3">Editar</button>
                      <button onClick={() => toggleStatus(p.id, p.is_active)} className="text-red-400 hover:text-red-600 text-xs font-medium">
                        {p.is_active ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">SKU / Código</label>
                  <input required type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción Corta</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Costo ($)</label>
                  <input required type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Precio Venta ($)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm font-bold text-orange-600" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Stock Mínimo</label>
                  <input required type="number" value={formData.stock_minimo} onChange={(e) => setFormData({...formData, stock_minimo: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm" />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors shadow-sm">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}