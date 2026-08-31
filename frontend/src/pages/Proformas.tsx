import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
// 1. REGLAS DE CÁLCULO (Plantilla Tumbado PVC)
const productRules = [
  { id: 'primario', sku: 'PERF-PRIMARIO', name: 'PRIMARIOS', calc: (a: number) => Math.ceil((a * 0.1766) * (4.88 / 3.8)), defaultCost: 1.60, defaultSale: 2.30 },
  { id: 'omega', sku: 'PERF-OMEGA', name: 'OMEGAS', calc: (a: number) => Math.ceil(a * 0.45), defaultCost: 1.54, defaultSale: 2.20 },
  { id: 'angulos', sku: 'PERF-ANGULO', name: 'ANGULOS', calc: (a: number) => Math.ceil(a * 0.37), defaultCost: 0.60, defaultSale: 0.95 },
  { id: 'duela', sku: 'PVC-595-BLANCA', name: 'DUELAS DE PVC BLANCA MATE', calc: (a: number) => Math.ceil(a / 1.45), defaultCost: 5.45, defaultSale: 8.25 },
  { id: 'cornisa', sku: 'CORNISA-BLANCA', name: 'CORNISA BLANCA', calc: (a: number) => Math.ceil(a * 0.20), defaultCost: 2.50, defaultSale: 5.00 },
  { id: 'tpbroca', sku: 'TORN-BROCA', name: 'TORNILLOS ESTRUCTURA PUNTA BROCA', calc: (a: number) => Math.ceil((Math.ceil(a * 0.45) * 8) / 100) * 100, defaultCost: 0.0052, defaultSale: 0.009 },
  { id: 'tpfina', sku: 'TORN-FINA', name: 'TORNILLO ESTRUCTURA PUNTA FINA', calc: (a: number) => Math.ceil((Math.ceil(a / 1.45) * 15) / 100) * 100, defaultCost: 0.0049, defaultSale: 0.009 },
  { id: 'clavo', sku: 'CLAVO-34', name: 'CLAVO DE 3/4', calc: (a: number) => Math.ceil((a * 10) / 100) * 100, defaultCost: 0.00483, defaultSale: 0.009 },
  { id: 'manoobra', sku: 'SERV-INSTALACION', name: 'MANO DE OBRA', calc: (a: number) => 0, defaultCost: 4.00, defaultSale: 5.00 }
];

export default function Proformas() {
  const { role, isAdmin, toggleRole } = useAuth();
  const [activeTab, setActiveTab] = useState('cotizador'); 
  const [useTemplate, setUseTemplate] = useState(true); // Toggle para usar o no la fórmula PVC
  const [area, setArea] = useState(30);
  
  const [tableData, setTableData] = useState<any[]>([]);
  const [extraItems, setExtraItems] = useState<any[]>([]); // Productos adicionales agregados manualmente
  const [searchProd, setSearchProd] = useState('');
  
  // Datos reales del backend
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para la Proforma
  const [clientData, setClientData] = useState({ id: '', nombre: 'CONSUMIDOR FINAL', ruc: '9999999999999', direccion: 'CAYAMBE', correo: '' });
  const [proformaConfig, setProformaConfig] = useState({
    numero: '500', tipo: 'detallada', descripcionGlobal: 'MATERIAL DE TUMBADO', descuento: 0,
    fecha: new Intl.DateTimeFormat('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())
  });

  // Cargar BD
  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodsRes, custRes] = await Promise.all([api.get('/products'), api.get('/customers')]);
        setDbProducts(prodsRes.data);
        setCustomers(custRes.data);
      } catch (error) { console.error(error); }
    };
    loadData();
  }, []);

  // Construir la Tabla Dinámicamente (Fórmulas + Extras)
  useEffect(() => {
    setTableData(prevData => {
      // 1. Productos de la plantilla (Si está activada)
      const baseRows = useTemplate ? productRules.map(rule => {
        const calcQty = rule.calc(area);
        const existingRow = prevData.find(r => r.id === rule.id);
        const realDbProduct = dbProducts.find(p => p.sku === rule.sku);
        return {
          id: rule.id,
          db_id: realDbProduct ? realDbProduct.id : null,
          sku: rule.sku, name: rule.name,
          calculatedQty: calcQty,
          manualQty: existingRow ? existingRow.manualQty : '', 
          costPrice: existingRow?.costPrice !== undefined ? existingRow.costPrice : (realDbProduct ? Number(realDbProduct.cost) : rule.defaultCost),
          salePrice: existingRow?.salePrice !== undefined ? existingRow.salePrice : (realDbProduct ? Number(realDbProduct.price) : rule.defaultSale),
          enBd: !!realDbProduct,
          isExtra: false
        };
      }) : [];

      // 2. Productos Extra (Agregados manualmente)
      const extraRows = extraItems.map(ext => {
        const existingRow = prevData.find(r => r.id === ext.id);
        return {
          ...ext,
          manualQty: existingRow?.manualQty !== undefined ? existingRow.manualQty : ext.manualQty,
          costPrice: existingRow?.costPrice !== undefined ? existingRow.costPrice : ext.costPrice,
          salePrice: existingRow?.salePrice !== undefined ? existingRow.salePrice : ext.salePrice,
        };
      });

      return [...baseRows, ...extraRows];
    });
  }, [area, dbProducts, extraItems, useTemplate]);

  // Funciones de edición
  const handleEdit = (id: string, field: string, value: string) => {
    setTableData(prev => prev.map(row => row.id === id ? { ...row, [field]: value === '' ? '' : Number(value) } : row));
  };

  const resetRow = (id: string) => setTableData(prev => prev.map(row => row.id === id ? { ...row, manualQty: '' } : row));

  // Función para agregar productos que no están en la plantilla
  const addExtraItem = (product: any) => {
    setExtraItems(prev => {
      if (prev.find(i => i.db_id === product.id)) return prev;
      return [...prev, {
        id: `extra-${product.id}`, db_id: product.id, sku: product.sku, name: product.name,
        calculatedQty: 0, manualQty: 1, // Por defecto 1
        costPrice: Number(product.cost), salePrice: Number(product.price),
        enBd: true, isExtra: true
      }];
    });
    setSearchProd('');
  };

  const removeExtraItem = (id: string) => setExtraItems(prev => prev.filter(i => i.id !== id));

  // Cálculos financieros
  const totals = useMemo(() => {
    let totalCost = 0; let totalSale = 0;
    tableData.forEach(row => {
      const activeQty = row.manualQty !== '' ? row.manualQty : row.calculatedQty;
      totalCost += activeQty * row.costPrice;
      totalSale += activeQty * row.salePrice;
    });
    const finalSale = totalSale - Number(proformaConfig.descuento || 0);
    return { totalCost, totalSale, utility: totalSale - totalCost, utilityPercent: totalSale > 0 ? ((totalSale - totalCost) / totalSale) * 100 : 0, finalSale };
  }, [tableData, proformaConfig.descuento]);

  // Selección de cliente y guardado
  const handleClientSelect = (e: any) => {
    const selected = customers.find(c => c.id === e.target.value);
    if (selected) setClientData({ id: selected.id, nombre: selected.name, ruc: selected.tax_id, direccion: selected.address || '', correo: selected.email || '' });
  };

  const handleSaveToDB = async () => {
    if (!clientData.id) return alert("Selecciona un cliente registrado.");
    const itemsToSave = tableData.filter(row => (row.manualQty !== '' ? row.manualQty : row.calculatedQty) > 0).map(row => {
      if (!row.db_id) throw new Error(`El producto ${row.name} no está en BD.`);
      return { product_id: row.db_id, quantity: row.manualQty !== '' ? row.manualQty : row.calculatedQty, unit_price: row.salePrice };
    });
    if (itemsToSave.length === 0) return alert("No hay productos válidos para guardar.");
    setIsSubmitting(true);
    try {
      await api.post('/proformas', { customer_id: clientData.id, discount: Number(proformaConfig.descuento), items: itemsToSave });
      alert("Proforma guardada en el sistema.");
    } catch (error: any) { alert(error.message || "Error al guardar"); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 md:p-6 print:p-0 print:bg-white text-sm font-sans">
      
      {/* Controles Principales */}
      <div className="max-w-7xl mx-auto mb-4 print:hidden">
        <div className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex space-x-2">
            <button onClick={toggleRole} className="ml-4 px-4 py-2 bg-red-500 text-white font-bold rounded-lg">
              👀 Simular vista: {role}
            </button>
            <button onClick={() => setActiveTab('cotizador')} className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === 'cotizador' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>1. Cotizador / Editor</button>
            <button onClick={() => setActiveTab('proforma')} className={`px-6 py-2 rounded-lg font-bold transition-colors ${activeTab === 'proforma' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>2. Configurar e Imprimir</button>
          </div>
          {activeTab === 'proforma' && (
             <div className="flex gap-2">
               <button onClick={handleSaveToDB} disabled={isSubmitting} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow">{isSubmitting ? 'Guardando...' : '💾 Guardar en BD'}</button>
               <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow">🖨️ Imprimir PDF</button>
             </div>
          )}
        </div>
      </div>

      {/* VISTA 1: COTIZADOR Y BUSCADOR */}
      {activeTab === 'cotizador' && (
        <div className="max-w-7xl mx-auto space-y-4 print:hidden">
          
          {/* Panel de Control Dinámico (La Magia Híbrida) */}
          <div className="bg-white p-4 rounded-xl shadow border border-gray-200 flex flex-col md:flex-row gap-6 items-end">
            <div className="flex flex-col gap-2 border-r pr-6 border-gray-200">
              <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer">
                <input type="checkbox" checked={useTemplate} onChange={e => setUseTemplate(e.target.checked)} className="w-4 h-4 text-orange-500" />
                Usar plantilla: Tumbado PVC
              </label>
              {useTemplate && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600 font-medium">Área Proyecto (m²):</span>
                  <input type="number" className="w-24 px-2 py-1 font-bold text-lg rounded border focus:border-orange-500 outline-none" value={area} onChange={(e) => setArea(Number(e.target.value) || 0)} min="1" />
                </div>
              )}
            </div>

            <div className="flex-1 relative w-full">
              <label className="text-xs font-bold text-gray-500 block mb-1 uppercase tracking-wider">Inyectar producto desde Base de Datos:</label>
              <input type="text" placeholder="Buscar por nombre o SKU y click para agregar..." value={searchProd} onChange={e => setSearchProd(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-orange-500 bg-gray-50" />
              {searchProd && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {dbProducts.filter(p => p.name.toLowerCase().includes(searchProd.toLowerCase()) || p.sku.toLowerCase().includes(searchProd.toLowerCase())).map(p => (
                    <button key={p.id} onClick={() => addExtraItem(p)} className="w-full text-left p-3 hover:bg-orange-50 border-b text-sm flex justify-between items-center">
                      <div><div className="font-bold">{p.name}</div><div className="text-xs text-gray-500">{p.sku}</div></div>
                      <span className="font-mono font-bold text-orange-500">${Number(p.price).toFixed(2)}</span>
                    </button>
                  ))}
                  {dbProducts.filter(p => p.name.toLowerCase().includes(searchProd.toLowerCase()) || p.sku.toLowerCase().includes(searchProd.toLowerCase())).length === 0 && (
                    <div className="p-3 text-sm text-gray-500 text-center">No se encontraron productos</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 border-b-2 border-r bg-gray-100 font-bold text-gray-700">Producto / Concepto</th>
                    <th className="p-3 border-b-2 border-r bg-orange-100 font-bold text-center">Cantidad</th>
                    <th className="p-3 border-b-2 border-r bg-gray-100 font-bold text-center">Fórmula (Base)</th>
                    {isAdmin && <th className="p-3 border-b-2 bg-orange-200 border-r text-center">Costo Unit.</th>}
                    {isAdmin && <th className="p-3 border-b-2 bg-orange-200 border-r text-center">Total Costo</th>}
                    <th className="p-3 border-b-2 bg-orange-300 border-r text-center">Venta Unit.</th>
                    <th className="p-3 border-b-2 bg-orange-300 text-center">Total Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => {
                    const activeQty = row.manualQty !== '' ? row.manualQty : row.calculatedQty;
                    const isOverridden = row.manualQty !== '';
                    return (
                      <tr key={row.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 border-r font-medium text-gray-800 flex items-center gap-2">
                          {!row.enBd && <span className="w-2 h-2 rounded-full bg-red-500" title="No está en BD"></span>}
                          {row.name}
                        </td>
                        <td className={`p-2 border-r text-center ${isOverridden || row.isExtra ? 'bg-yellow-50' : ''}`}>
                          <div className="flex justify-center items-center space-x-1">
                            <input type="number" className="w-16 p-1 text-center border border-gray-300 rounded font-bold text-blue-600 outline-none" value={row.manualQty} placeholder={row.calculatedQty.toString()} onChange={(e) => handleEdit(row.id, 'manualQty', e.target.value)} />
                            {row.isExtra ? (
                              <button onClick={() => removeExtraItem(row.id)} className="text-xs text-red-500 font-bold px-1" title="Eliminar fila">🗑️</button>
                            ) : (
                              isOverridden && <button onClick={() => resetRow(row.id)} className="text-xs text-red-500 font-bold px-1" title="Restaurar fórmula">✕</button>
                            )}
                          </div>
                        </td>
                        <td className="p-3 border-r text-center text-gray-400 bg-gray-50">{row.isExtra ? '—' : row.calculatedQty}</td>
                        {isAdmin && (
                          <td className="p-2 border-r text-center bg-orange-50/30">
                            <input type="number" step="0.01" className="..." value={row.costPrice} onChange={(e) => handleEdit(row.id, 'costPrice', e.target.value)} />
                          </td>
                        )}
                        {isAdmin && <td className="p-3 border-r text-right font-mono bg-orange-50/50">${(activeQty * row.costPrice).toFixed(2)}</td>}
                        <td className="p-2 border-r text-center bg-orange-100/30">
                          <input type="number" step="0.01" className="w-20 p-1 text-center bg-transparent outline-none border rounded focus:bg-white" value={row.salePrice} onChange={(e) => handleEdit(row.id, 'salePrice', e.target.value)} />
                        </td>
                        <td className="p-3 text-right font-mono bg-orange-100/50">${(activeQty * row.salePrice).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {tableData.length === 0 && (
                    <tr><td colSpan={7} className="p-10 text-center text-gray-400">Cotización vacía. Activa la plantilla o busca productos para agregar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
              {isAdmin && <div><span className="text-gray-400">Total Costo:</span> <span className="font-mono font-bold">${totals.totalCost.toFixed(2)}</span></div>}
              
              <div><span className="text-gray-400">Total Venta:</span> <span className="font-mono font-bold text-xl text-orange-400">${totals.totalSale.toFixed(2)}</span></div>
              
              {isAdmin && <div><span className="text-gray-400">Utilidad:</span> <span className="font-mono font-bold text-green-400">{totals.utilityPercent.toFixed(1)}%</span></div>}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: PROFORMA (Configuración e Impresión) */}
      {activeTab === 'proforma' && (
        <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
          
          <div className="w-full md:w-1/3 bg-white p-5 rounded-xl shadow border border-gray-200 print:hidden space-y-5">
            <h2 className="font-bold text-lg border-b pb-2">Configuración de Proforma</h2>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm">Cargar Cliente de BD</h3>
              <select onChange={handleClientSelect} className="w-full p-2 border rounded outline-none focus:border-orange-500">
                <option value="">Seleccione un cliente registrado...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="text" placeholder="Nombre" className="w-full p-2 border rounded bg-gray-50 outline-none" value={clientData.nombre} readOnly />
              <input type="text" placeholder="RUC / CI" className="w-full p-2 border rounded bg-gray-50 outline-none" value={clientData.ruc} readOnly />
            </div>
            <div className="space-y-3 pt-3 border-t">
              <h3 className="font-semibold text-gray-700 text-sm">Visualización PDF</h3>
              <select value={proformaConfig.tipo} onChange={e => setProformaConfig({...proformaConfig, tipo: e.target.value})} className="w-full p-2 border rounded outline-none">
                <option value="detallada">Detallada (Ítem por ítem)</option>
                <option value="global">Global (Solo 1 línea)</option>
              </select>
              {proformaConfig.tipo === 'global' && (
                <input type="text" placeholder="Descripción del servicio global..." className="w-full p-2 border rounded mt-1 outline-none" value={proformaConfig.descripcionGlobal} onChange={e => setProformaConfig({...proformaConfig, descripcionGlobal: e.target.value})} />
              )}
            </div>
            <div className="space-y-3 pt-3 border-t">
              <h3 className="font-semibold text-gray-700 text-sm">Finanzas</h3>
              <div><label className="text-xs text-gray-500">Nº Proforma:</label><input type="text" className="w-full p-2 border rounded mt-1" value={proformaConfig.numero} onChange={e => setProformaConfig({...proformaConfig, numero: e.target.value})} /></div>
              <div><label className="text-xs text-gray-500">Descuento Comercial ($):</label><input type="number" className="w-full p-2 border rounded mt-1 font-bold text-green-600" value={proformaConfig.descuento} onChange={e => setProformaConfig({...proformaConfig, descuento: Number(e.target.value)})} /></div>
            </div>
          </div>

          {/* DOCUMENTO PDF */}
          <div className="w-full md:w-2/3 bg-white shadow-2xl print:shadow-none print:w-full max-w-[800px] mx-auto overflow-hidden">
            <div className="p-8 print:p-0">
              <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
                <div className="w-1/2"><img src="/logo_DBM.png" alt="DBM" className="h-20 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} /></div>
                <div className="w-1/2 text-right text-sm pt-2"><p>{proformaConfig.fecha}</p><p className="font-bold mt-1">Nº PROFORMA: {proformaConfig.numero}</p><p>Arq. Diego Francisco Gordillo V.</p></div>
              </div>
              <div className="text-sm space-y-1 mb-6">
                <div className="grid grid-cols-[100px_1fr]"><span className="font-bold">NOMBRE:</span> <span className="uppercase">{clientData.nombre}</span></div>
                <div className="grid grid-cols-[100px_1fr]"><span className="font-bold">RUC:</span> <span>{clientData.ruc}</span></div>
                <div className="grid grid-cols-[100px_1fr]"><span className="font-bold">DIRECCION:</span> <span className="uppercase">{clientData.direccion}</span></div>
              </div>
              <div className="bg-[#ED7D31] text-black text-center font-bold py-2 border border-black mb-0 uppercase">
                {proformaConfig.tipo === 'global' ? proformaConfig.descripcionGlobal : `COTIZACIÓN DE MATERIALES`}
              </div>
              <table className="w-full text-sm border-collapse border border-black text-black">
                <thead>
                  <tr className="bg-[#ED7D31] text-black">
                    <th className="border border-black p-2 w-24 text-center">CANT.</th>
                    <th className="border border-black p-2 text-left">CONCEPTO</th>
                    <th className="border border-black p-2 w-32 text-center">V. UNITARIO</th>
                    <th className="border border-black p-2 w-32 text-center">V. TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {proformaConfig.tipo === 'detallada' ? (
                    tableData.map(row => {
                      const qty = row.manualQty !== '' ? row.manualQty : row.calculatedQty;
                      if (qty <= 0) return null;
                      return (
                        <tr key={row.id}>
                          <td className="border border-black p-2 text-center">{qty}</td>
                          <td className="border border-black p-2">{row.name}</td>
                          <td className="border border-black p-2 text-right">$ {row.salePrice.toFixed(2)}</td>
                          <td className="border border-black p-2 text-right">$ {(qty * row.salePrice).toFixed(2)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="border border-black p-2 text-center">1</td>
                      <td className="border border-black p-2">{proformaConfig.descripcionGlobal} {useTemplate ? `${area} MTS` : ''}</td>
                      <td className="border border-black p-2 text-right">$ {totals.totalSale.toFixed(2)}</td>
                      <td className="border border-black p-2 text-right">$ {totals.totalSale.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr><td colSpan={2} className="border-none"></td><td className="border border-black p-2 font-bold text-center">TOTAL</td><td className="border border-black p-2 text-right font-bold">$ {totals.totalSale.toFixed(2)}</td></tr>
                  {Number(proformaConfig.descuento) > 0 && (<tr><td colSpan={2} className="border-none"></td><td className="border border-black p-2 font-bold text-center">DESCUENTO</td><td className="border border-black p-2 text-right font-bold text-red-600">$ {Number(proformaConfig.descuento).toFixed(2)}</td></tr>)}
                  <tr className="bg-[#ED7D31]"><td colSpan={2} className="border-none bg-white"></td><td className="border border-black p-2 font-bold text-center">TOTAL a Pagar</td><td className="border border-black p-2 text-right font-bold">$ {totals.finalSale.toFixed(2)}</td></tr>
                </tbody>
              </table>
              <div className="mt-8 text-[11px] leading-relaxed">
                <div className="grid grid-cols-[200px_1fr] font-bold"><span>FORMA DE PAGO:</span> <span className="font-normal">70% ANTICIPO Y 30% CONTRA ENTREGA</span></div>
                <div className="grid grid-cols-[200px_1fr] font-bold"><span>TIEMPO DE ENTREGA:</span> <span className="font-normal">ENTRE 1 A 3 DIAS CALENDARIO</span></div>
                <div className="grid grid-cols-[200px_1fr] font-bold"><span>VALIDEZ DE LA OFERTA:</span> <span className="font-normal">15 DÍAS A PARTIR DE LA FECHA</span></div>
                <p className="mt-6">Saludos Cordiales,</p>
                <div className="mt-4"><img src="/firma_DBM.png" className="h-28 object-contain mb-1" onError={(e) => e.currentTarget.style.display = 'none'} /><p className="font-bold">ARQ. DIEGO FRANCISCO GORDILLO V.</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}