import { useState, useEffect } from 'react';
import api from '../services/api'; // Asegúrate de que esta ruta coincida con donde creaste api.ts

// 1. INTERFACES (Definen la forma de los datos reales de tu backend)
interface Category {
  id: string;
  name: string;
  description: string;
}

interface Product {
  id: string;
  category_id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock_actual: number;
  stock_minimo: number;
  is_service: boolean;
}

const unidades = ['Unidad', 'Metro', 'Metro cuadrado', 'Caja', 'Paquete'];

export default function Products() {
  // 2. ESTADOS PARA DATOS REALES
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [selectedCat, setSelectedCat] = useState('Todos');

  // 3. CARGAR DATOS DESDE EL BACKEND
  const loadData = async () => {
    try {
      const [prodsRes, catsRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      setProducts(prodsRes.data);
      setCategories(catsRes.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error conectando al servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Función auxiliar para obtener el nombre de la categoría
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Sin categoría';

  // Filtrar productos
  const filteredProducts = selectedCat === 'Todos' 
    ? products 
    : products.filter(p => getCategoryName(p.category_id) === selectedCat);

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Cargando catálogo DBM...</div>;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Catálogo de Productos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Base de datos en tiempo real (PostgreSQL)</p>
        </div>
        <button
          onClick={() => { setShowNew(true); setSelectedProduct(null); }}
          className="px-4 py-2 rounded-lg text-white text-sm font-display font-semibold"
          style={{ background: '#ED871B' }}
        >
          + Nuevo producto
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5" style={{ minHeight: '70vh' }}>
        {/* Product list */}
        <div className="col-span-1 bg-white rounded-xl flex flex-col overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
          
          {/* Filtros Categorías */}
          <div className="flex overflow-x-auto gap-1 px-3 py-2 border-b" style={{ borderColor: '#E5E7EB' }}>
            {['Todos', ...categories.map(c => c.name)].map((c) => (
              <button
                key={c}
                className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
                style={{
                  background: selectedCat === c ? '#1D2647' : '#F0F2F5',
                  color: selectedCat === c ? '#fff' : '#64748B',
                }}
                onClick={() => setSelectedCat(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Lista de productos */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProduct(p); setShowNew(false); }}
                className="w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-orange-50"
                style={{
                  background: selectedProduct?.id === p.id ? 'rgba(237,135,27,0.06)' : 'transparent',
                  borderLeft: selectedProduct?.id === p.id ? '3px solid #ED871B' : '3px solid transparent',
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: '#F0F2F5' }}>📦</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800 truncate">{p.name}</div>
                  <div className="font-mono text-xs text-slate-400">{p.sku}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: p.stock_actual <= p.stock_minimo ? '#FEF2F2' : '#F0FDF4', color: p.stock_actual <= p.stock_minimo ? '#DC2626' : '#16a34a' }}>
                      Stock: {p.stock_actual}
                    </span>
                    <span className="font-mono text-xs font-bold" style={{ color: '#ED871B' }}>${Number(p.price).toFixed(2)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail / New form */}
        <div className="col-span-2">
          {!selectedProduct && !showNew ? (
            <div className="h-full flex items-center justify-center bg-white rounded-xl" style={{ border: '1px solid #E5E7EB' }}>
              <div className="text-center text-slate-300">
                <div className="text-5xl mb-3">📦</div>
                <div className="font-display text-slate-400">Selecciona un producto</div>
              </div>
            </div>
          ) : showNew ? (
            <NewProductForm categories={categories} onCancel={() => setShowNew(false)} onSaved={loadData} />
          ) : selectedProduct ? (
            <ProductDetail product={selectedProduct} categoryName={getCategoryName(selectedProduct.category_id)} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// COMPONENTE: Detalle del Producto
function ProductDetail({ product, categoryName }: { product: Product, categoryName: string }) {
  const Field = ({ label, value }: { label: string; value: string | number }) => (
    <div>
      <label className="text-xs text-slate-400 block mb-0.5">{label}</label>
      <div className="text-sm font-medium text-slate-800">{value}</div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
      <div className="p-5 border-b flex items-start gap-4" style={{ borderColor: '#E5E7EB', background: 'linear-gradient(135deg, #1D2647 0%, #253060 100%)' }}>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-white text-lg leading-tight">{product.name}</div>
          <div className="font-mono text-xs text-white/60 mt-0.5">{product.sku}</div>
          <span className="text-xs px-2 py-0.5 rounded-full mt-2 inline-block" style={{ background: 'rgba(237,135,27,0.2)', color: '#ED871B' }}>
            {categoryName}
          </span>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-2xl text-white">${Number(product.price).toFixed(2)}</div>
        </div>
      </div>
      <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
        <div className="space-y-4">
          <Field label="Nombre completo" value={product.name} />
          <Field label="SKU / Código" value={product.sku} />
          <Field label="Descripción" value={product.description || 'Sin descripción'} />
        </div>
        <div className="space-y-4">
          <Field label="Precio de compra (Costo)" value={`$${Number(product.cost).toFixed(2)}`} />
          <Field label="Stock actual" value={product.stock_actual} />
          <Field label="Stock mínimo" value={product.stock_minimo} />
        </div>
      </div>
    </div>
  );
}

// COMPONENTE: Formulario de Nuevo Producto (CONECTADO A LA API)
function NewProductForm({ categories, onCancel, onSaved }: { categories: Category[], onCancel: () => void, onSaved: () => void }) {
  const [formData, setFormData] = useState({
    name: '', sku: '', category_id: categories[0]?.id || '', price: 0, cost: 0, stock_minimo: 0, description: ''
  });

  const handleSubmit = async () => {
    try {
      await api.post('/products', formData);
      alert("Producto creado con éxito!");
      onSaved(); // Recarga la lista
      onCancel(); // Cierra el formulario
    } catch (error) {
      console.error(error);
      alert("Error al crear producto");
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm border outline-none focus:border-orange-500";

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
      <h2 className="font-display font-bold text-lg mb-4">Nuevo producto</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="col-span-2">
          <label className="text-xs text-slate-500 block mb-1">Nombre</label>
          <input className={inputCls} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">SKU</label>
          <input className={inputCls} onChange={e => setFormData({...formData, sku: e.target.value})} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Categoría</label>
          <select className={inputCls} onChange={e => setFormData({...formData, category_id: e.target.value})}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Precio Venta</label>
          <input type="number" className={inputCls} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Costo Compra</label>
          <input type="number" className={inputCls} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Stock Mínimo</label>
          <input type="number" className={inputCls} onChange={e => setFormData({...formData, stock_minimo: Number(e.target.value)})} />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 border rounded-xl">Cancelar</button>
        <button onClick={handleSubmit} className="flex-1 py-2 bg-orange-500 text-white rounded-xl font-bold">Guardar</button>
      </div>
    </div>
  );
}