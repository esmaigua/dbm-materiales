import { useState, useEffect } from 'react';
import api from '../services/api';

interface Product {
  id: string;
  sku: string;
  name: string;
  cost: number;
  stock_actual: number;
}

interface Supplier {
  id: string;
  name: string;
  document_number: string;
}

interface Location {
  id: string;
  name: string;
  is_active: boolean;
}

interface CartItem extends Product {
  quantity: number;
  input_cost: number; // Permite modificar el costo al que llega en esta factura específica
}

export default function Purchases() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado del carrito y la transacción
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Cargamos catálogo, directorio y sucursales simultáneamente
      const [productsRes, suppliersRes, locationsRes] = await Promise.all([
        api.get('/products'),
        api.get('/suppliers'),
        api.get('/locations')
      ]);
      // Filtramos para mostrar solo activos (opcional, dependiendo de tu lógica)
      setProducts(productsRes.data.filter((p: any) => p.is_active));
      setSuppliers(suppliersRes.data.filter((s: any) => s.is_active));

      const activeLocations = locationsRes.data.filter((l: Location) => l.is_active);
      setLocations(activeLocations);
      setSelectedLocation(prev => prev || activeLocations[0]?.id || '');
    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, input_cost: product.cost }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const updateInputCost = (id: string, newCost: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, input_cost: newCost } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleConfirmPurchase = async () => {
    if (!selectedSupplier) {
      alert("Por favor, selecciona un proveedor.");
      return;
    }
    if (!selectedLocation) {
      alert("Por favor, selecciona la sucursal que recibe la mercadería.");
      return;
    }
    if (cart.length === 0) {
      alert("El carrito de compras está vacío.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Estructura esperada por un backend transaccional típico
      const payload = {
        supplier_id: selectedSupplier,
        location_id: selectedLocation,
        subtotal: subtotal,
        iva: iva,
        total: total,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_cost: item.input_cost
        }))
      };

      await api.post('/purchases', payload);

      alert("Compra registrada exitosamente. El inventario de la sucursal ha sido actualizado.");
      setCart([]);
      setSelectedSupplier('');
      fetchInitialData(); // Recargamos para ver el nuevo stock
    } catch (error) {
      console.error("Error registrando compra:", error);
      alert("Error al procesar la compra. Verifica la consola.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cálculos financieros (IVA 15% vigente en Ecuador)
  const subtotal = cart.reduce((sum, item) => sum + (item.input_cost * item.quantity), 0);
  const iva = subtotal * 0.15;
  const total = subtotal + iva;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ingreso de Mercadería</h1>
        <p className="text-sm text-slate-500 mt-1">Registra compras a proveedores y actualiza el stock</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
        
        {/* COLUMNA IZQUIERDA: Catálogo y Buscador */}
        <div className="w-full lg:w-7/12 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar producto por nombre o SKU..." 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:border-orange-300 hover:shadow-sm cursor-pointer transition-all group"
              >
                <div>
                  <div className="font-bold text-slate-700 group-hover:text-orange-600 transition-colors">{product.name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{product.sku} • Stock actual: {product.stock_actual}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-600">${Number(product.cost).toFixed(2)}</div>
                  <div className="text-[10px] uppercase text-slate-400">Costo Ref.</div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm">No se encontraron productos.</div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Carrito y Confirmación */}
        <div className="w-full lg:w-5/12 flex flex-col gap-4">
          
          {/* Detalles del Carrito */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-700">Detalle de Ingreso</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded-md">{cart.length} items</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex flex-col gap-2 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm text-slate-700 leading-tight pr-4">{item.name}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 font-bold">&times;</button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    {/* Controles de Cantidad */}
                    <div className="flex items-center border border-slate-200 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 text-slate-500 hover:bg-slate-50 border-r border-slate-200 font-bold">−</button>
                      <span className="px-4 py-1 text-sm font-bold text-slate-700 min-w-[3rem] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 text-slate-500 hover:bg-slate-50 border-l border-slate-200 font-bold">+</button>
                    </div>
                    
                    {/* Input de Costo editable */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Costo c/u:</span>
                      <div className="relative w-20">
                        <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-500 text-xs">$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          value={item.input_cost}
                          onChange={(e) => updateInputCost(item.id, parseFloat(e.target.value) || 0)}
                          className="w-full pl-5 pr-2 py-1 border border-slate-300 rounded text-sm text-right font-bold focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500 mt-1">
                    Subtotal item: <span className="font-bold text-slate-700">${(item.quantity * item.input_cost).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Agrega productos desde el catálogo
                </div>
              )}
            </div>
          </div>

          {/* Panel de Totales y Proveedor */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sucursal que recibe</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
              >
                <option value="">Seleccione una sucursal...</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Proveedor</label>
              <select 
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
              >
                <option value="">Seleccione un proveedor...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.document_number})</option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>IVA 15%</span>
                <span>${iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="font-bold text-slate-800">TOTAL</span>
                <span className="text-2xl font-black text-orange-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleConfirmPurchase}
              disabled={cart.length === 0 || !selectedSupplier || !selectedLocation || isSubmitting}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors shadow-sm mt-2"
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar Ingreso'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}