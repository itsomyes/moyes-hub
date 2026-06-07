import React, { useState, useEffect } from 'react';
import { Menu, X, Plus, ChevronDown, ChevronRight, LayoutDashboard, Wrench, Apple, Brain, Compass, Users, Map, Building2, Truck, Tractor, Calendar, Package, Trash2 } from 'lucide-react';

const MEDIDAS = ['1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"', '3"', '4"', '6"', '8"', '10"', '12"'];
const MEDIDAS_PEQUENAS = ['1/2"', '3/4"', '1"'];
const ACC_PEQUENAS = ['Codo M/H', 'Codo H/H', 'TRC.RDC', 'TAPON'];

// Estructura para medidas grandes (1 1/4" a 12"):
// simple = una sola fila ; grupo = acordeón con sub-filas ; editable = el texto de la fila se puede escribir
const ACC_GRANDES_DEF = [
  { id: 'ACOPLES', label: 'ACOPLES', tipo: 'simple' },
  { id: 'CODOS', label: 'CODOS', tipo: 'grupo', subfilas: [
    { id: '90', label: '90°', editable: false },
    { id: '45', label: '45°', editable: false },
    { id: 'otro', label: '', editable: true },
  ]},
  { id: 'TS', label: "T'S", tipo: 'grupo', subfilas: [
    { id: 'br1', label: '1 boca reducida', editable: false },
    { id: 'br2', label: '1 boca reducida', editable: false },
  ]},
  { id: 'TAPON', label: 'TAPON', tipo: 'simple' },
];

const esGrande = (medida) => !MEDIDAS_PEQUENAS.includes(medida);

// Construye el objeto de datos vacío de un pedido para una medida
function tamanosVacios(medida) {
  const obj = {};
  if (esGrande(medida)) {
    ACC_GRANDES_DEF.forEach(acc => {
      if (acc.tipo === 'simple') {
        obj[acc.id] = { inicial: 0, usada: 0 };
      } else {
        obj[acc.id] = {};
        acc.subfilas.forEach(sf => {
          obj[acc.id][sf.id] = { inicial: 0, usada: 0, nombre: sf.label };
        });
      }
    });
  } else {
    ACC_PEQUENAS.forEach(a => { obj[a] = { inicial: 0, usada: 0 }; });
  }
  return obj;
}

const acordeonAnim = `
@keyframes desplegar {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 1000px; }
}
.acordeon-contenido {
  animation: desplegar 0.4s ease-in-out;
  overflow: hidden;
}
`;

// ---- ZONA OBRA: secciones del centro de mando de cada obra ----
const OBRA_SECCIONES = [
  { id: 'pedidos',      label: 'Pedidos de material', icon: Package,   color: 'from-blue-600 to-blue-700' },
  { id: 'equipo',       label: 'Equipo / Gente',      icon: Users,     color: 'from-orange-600 to-orange-700' },
  { id: 'planos',       label: 'Planos',              icon: Map,       color: 'from-emerald-600 to-emerald-700' },
  { id: 'instalacion',  label: 'Instalación',         icon: Building2, color: 'from-slate-600 to-slate-700' },
  { id: 'maquinaria',   label: 'Maquinaria',          icon: Tractor,   color: 'from-amber-600 to-amber-700' },
  { id: 'agenda',       label: 'Agenda',              icon: Calendar,  color: 'from-purple-600 to-purple-700' },
  { id: 'repartidores', label: 'Repartidores',        icon: Truck,     color: 'from-rose-600 to-rose-700' },
];

// Definición de campos de cada sección tipo lista
const CAMPOS_EQUIPO = [
  { id: 'nombre', label: 'Nombre', tipo: 'text' },
  { id: 'rol', label: 'Rol / Categoría', tipo: 'text' },
  { id: 'telefono', label: 'Teléfono', tipo: 'tel' },
  { id: 'notas', label: 'Notas', tipo: 'text' },
];
const CAMPOS_PLANOS = [
  { id: 'nombre', label: 'Nombre del plano', tipo: 'text' },
  { id: 'zona', label: 'Zona / Planta', tipo: 'text' },
  { id: 'enlace', label: 'Enlace (PDF / foto)', tipo: 'url' },
  { id: 'nota', label: 'Nota', tipo: 'textarea' },
];
const CAMPOS_MAQUINARIA = [
  { id: 'nombre', label: 'Máquina', tipo: 'text' },
  { id: 'proveedor', label: 'Proveedor', tipo: 'text' },
  { id: 'telefono', label: 'Teléfono', tipo: 'tel' },
  { id: 'inicio', label: 'Inicio alquiler', tipo: 'date' },
  { id: 'fin', label: 'Fin alquiler', tipo: 'date' },
  { id: 'estado', label: 'Estado', tipo: 'select', opciones: ['Solicitada', 'Confirmada', 'En obra', 'Devuelta'] },
];
const CAMPOS_AGENDA = [
  { id: 'fecha', label: 'Fecha', tipo: 'date' },
  { id: 'hora', label: 'Hora', tipo: 'time' },
  { id: 'titulo', label: 'Tarea / Cita', tipo: 'text' },
  { id: 'notas', label: 'Detalles', tipo: 'textarea' },
];
const CAMPOS_REPARTIDORES = [
  { id: 'nombre', label: 'Contacto', tipo: 'text' },
  { id: 'empresa', label: 'Empresa', tipo: 'text' },
  { id: 'telefono', label: 'Teléfono', tipo: 'tel' },
  { id: 'material', label: 'Material / Ruta', tipo: 'text' },
];

const INPUT_CLS = 'w-full px-3 py-2 bg-slate-50 text-black border border-gray-300 rounded-lg focus:border-orange-500 outline-none text-sm';

// ---- SUB-COMPONENTES FUERA del principal (React ya no los recrea) ----

function MainModal({ selectedObra, onObraNueva, onPedidoNuevo, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white p-12 rounded-lg border border-gray-300 w-96 text-center">
        <h2 className="text-3xl font-bold text-black mb-6">¿Qué deseas crear?</h2>
        <div className="space-y-3">
          <button onClick={onObraNueva} className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all text-lg font-semibold flex items-center justify-center gap-2">
            <Plus size={24} /> Obra Nueva
          </button>
          <button onClick={() => { if (selectedObra) onPedidoNuevo(); }} disabled={!selectedObra}
            className={`w-full px-6 py-4 rounded-lg transition-all text-lg font-semibold flex items-center justify-center gap-2 ${selectedObra ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>
            <Plus size={24} /> Pedido Nuevo
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-4 px-6 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-lg transition-all">Cancelar</button>
      </div>
    </div>
  );
}

function ObraModal({ value, onChange, onCrear, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg border border-gray-300 w-96">
        <h3 className="text-2xl font-bold text-black mb-4">Nueva Obra</h3>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Nombre de la obra..."
          className="w-full px-4 py-3 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-lg focus:border-orange-500 outline-none mb-4"
          onKeyPress={(e) => e.key === 'Enter' && onCrear()} autoFocus />
        <div className="flex gap-2">
          <button onClick={onCrear} className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all font-semibold">Crear</button>
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded-lg transition-all">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function FilaCasillas({ item, onCant, onUsado }) {
  const disponible = Math.max(0, (item.inicial || 0) - (item.usada || 0));
  return (
    <div className="flex gap-2">
      <input type="number" inputMode="numeric" value={item.inicial} onChange={(e) => onCant(e.target.value)} className="flex-1 min-w-0 px-1 py-2 bg-slate-50 text-black rounded border border-gray-300 focus:border-orange-500 outline-none font-semibold text-center text-sm" />
      <span className={`flex-1 flex items-center justify-center font-bold text-sm ${disponible > 0 ? 'text-green-600' : 'text-red-600'}`}>{disponible}</span>
      <input type="number" inputMode="numeric" value={item.usada} onChange={(e) => onUsado(e.target.value)} className="flex-1 min-w-0 px-1 py-2 bg-slate-50 text-black rounded border border-gray-300 focus:border-orange-500 outline-none font-semibold text-center text-sm" />
    </div>
  );
}

function Encabezados() {
  return (
    <div className="flex gap-2 px-3 pb-2 text-xs font-bold text-gray-600">
      <span className="flex-1 text-center">Cant.</span>
      <span className="flex-1 text-center">Disp.</span>
      <span className="flex-1 text-center">Usado</span>
    </div>
  );
}

function TablaPedido({ pedido, expandedMedidas, expandedGrupos, onToggleMedida, onToggleGrupo, onActualizar, onNombreSubfila }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 sm:p-6 flex-1 overflow-y-auto">
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-black px-1 mb-2">Medidas</h3>
        {MEDIDAS.map((medida) => {
          const grande = esGrande(medida);
          return (
            <div key={medida} id={`medida-${medida}`} style={{ scrollMarginTop: '12px' }}>
              <button onClick={() => onToggleMedida(medida)} className="w-full flex items-center gap-3 px-3 py-4 bg-slate-100 hover:bg-orange-100 rounded-lg transition-all">
                {expandedMedidas[medida] ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                <span className="text-2xl font-bold text-black">📏 {medida}</span>
              </button>

              {expandedMedidas[medida] && (
                <div className="mt-2 acordeon-contenido">
                  {grande ? (
                    /* MEDIDAS GRANDES: ACOPLES, CODOS, T'S, TAPON */
                    <div className="space-y-2">
                      {ACC_GRANDES_DEF.map((acc) => {
                        if (acc.tipo === 'simple') {
                          const item = pedido.tamaños[medida][acc.id];
                          return (
                            <div key={acc.id} className="bg-white px-3 py-2 rounded-lg">
                              <p className="text-black font-semibold text-sm mb-1">{acc.label}</p>
                              <Encabezados />
                              <FilaCasillas item={item}
                                onCant={(v) => onActualizar(medida, acc.id, null, 'inicial', v)}
                                onUsado={(v) => onActualizar(medida, acc.id, null, 'usada', v)} />
                            </div>
                          );
                        }
                        // grupo (acordeón interno)
                        const grupoKey = `${medida}-${acc.id}`;
                        return (
                          <div key={acc.id} className="bg-white rounded-lg overflow-hidden">
                            <button onClick={() => onToggleGrupo(grupoKey)} className="w-full flex items-center gap-2 px-3 py-3 bg-gray-100 hover:bg-orange-50 transition-all">
                              {expandedGrupos[grupoKey] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                              <span className="font-bold text-black text-sm">{acc.label}</span>
                            </button>
                            {expandedGrupos[grupoKey] && (
                              <div className="p-3 acordeon-contenido">
                                <Encabezados />
                                <div className="space-y-2">
                                  {acc.subfilas.map((sf) => {
                                    const item = pedido.tamaños[medida][acc.id][sf.id];
                                    return (
                                      <div key={sf.id} className="border border-gray-200 rounded-lg px-3 py-2">
                                        {sf.editable ? (
                                          <input type="text" value={item.nombre || ''} placeholder="Escribe medida..."
                                            onChange={(e) => onNombreSubfila(medida, acc.id, sf.id, e.target.value)}
                                            className="w-full text-black font-semibold text-sm mb-1 bg-yellow-50 border border-gray-300 rounded px-2 py-1 focus:border-orange-500 outline-none" />
                                        ) : (
                                          <p className="text-black font-semibold text-sm mb-1">{item.nombre || sf.label}</p>
                                        )}
                                        <FilaCasillas item={item}
                                          onCant={(v) => onActualizar(medida, acc.id, sf.id, 'inicial', v)}
                                          onUsado={(v) => onActualizar(medida, acc.id, sf.id, 'usada', v)} />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* MEDIDAS PEQUEÑAS: lista plana de siempre */
                    <>
                      <Encabezados />
                      <div className="space-y-2">
                        {ACC_PEQUENAS.map((accesorio) => {
                          const item = pedido.tamaños[medida][accesorio];
                          return (
                            <div key={accesorio} className="bg-white px-3 py-2 rounded-lg">
                              <p className="text-black font-semibold text-sm mb-1">{accesorio}</p>
                              <FilaCasillas item={item}
                                onCant={(v) => onActualizar(medida, accesorio, null, 'inicial', v)}
                                onUsado={(v) => onActualizar(medida, accesorio, null, 'usada', v)} />
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- ZONA OBRA: campo reutilizable (input / textarea / select) ----
function CampoEditable({ campo, valor, onChange }) {
  if (campo.tipo === 'select') {
    return (
      <select value={valor} onChange={(e) => onChange(e.target.value)} className={INPUT_CLS}>
        {campo.opciones.map((op) => <option key={op} value={op}>{op}</option>)}
      </select>
    );
  }
  if (campo.tipo === 'textarea') {
    return (
      <textarea value={valor} onChange={(e) => onChange(e.target.value)} rows={2}
        className={INPUT_CLS} placeholder={campo.label} />
    );
  }
  return (
    <input type={campo.tipo || 'text'} value={valor} onChange={(e) => onChange(e.target.value)}
      className={INPUT_CLS} placeholder={campo.label} />
  );
}

// ---- ZONA OBRA: sección genérica tipo lista (equipo, planos, maquinaria, agenda, repartidores) ----
function ListaSeccion({ titulo, Icon, ayuda, items, campos, onAdd, onUpdate, onRemove, onBack, etiquetaAnadir = 'Añadir' }) {
  const vacio = () => campos.reduce((acc, c) => ({ ...acc, [c.id]: c.opciones ? c.opciones[0] : '' }), {});
  const [nuevo, setNuevo] = useState(vacio());
  const puedeAnadir = campos.some((c) => (nuevo[c.id] || '').toString().trim() !== '');

  const handleAdd = () => {
    if (!puedeAnadir) return;
    onAdd(nuevo);
    setNuevo(vacio());
  };

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-8 max-w-4xl mx-auto">
      <button onClick={onBack} className="text-orange-600 hover:text-orange-700 font-semibold mb-2 flex items-center gap-2 self-start">← Volver a la obra</button>
      <h2 className="text-3xl font-bold text-orange-600 flex items-center gap-3"><Icon size={30} /> {titulo}</h2>
      {ayuda && <p className="text-gray-500 text-sm mt-1 mb-4">{ayuda}</p>}

      {/* Formulario para añadir */}
      <div className="bg-white border-2 border-dashed border-orange-300 rounded-lg p-4 mb-5">
        <p className="text-black font-bold text-sm mb-3 flex items-center gap-2"><Plus size={16} /> {etiquetaAnadir}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {campos.map((campo) => (
            <label key={campo.id} className="block">
              <span className="text-xs font-semibold text-gray-500 mb-1 block">{campo.label}</span>
              <CampoEditable campo={campo} valor={nuevo[campo.id]} onChange={(v) => setNuevo((n) => ({ ...n, [campo.id]: v }))} />
            </label>
          ))}
        </div>
        <button onClick={handleAdd} disabled={!puedeAnadir}
          className={`mt-3 w-full sm:w-auto px-5 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${puedeAnadir ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
          <Plus size={18} /> {etiquetaAnadir}
        </button>
      </div>

      {/* Lista de registros */}
      <div className="space-y-3 overflow-y-auto flex-1">
        {items.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Todavía no hay registros. Añade el primero arriba.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {campos.map((campo) => (
                  <label key={campo.id} className="block">
                    <span className="text-xs font-semibold text-gray-500 mb-1 block">{campo.label}</span>
                    <CampoEditable campo={campo} valor={item[campo.id] ?? ''} onChange={(v) => onUpdate(item.id, { [campo.id]: v })} />
                  </label>
                ))}
              </div>
              <button onClick={() => onRemove(item.id)} className="mt-3 text-red-600 hover:text-red-700 text-sm font-semibold flex items-center gap-1">
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---- ZONA OBRA: sección de notas libres (instalación) ----
function NotasSeccion({ titulo, Icon, ayuda, placeholder, valor, onChange, onBack }) {
  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-8 max-w-4xl mx-auto">
      <button onClick={onBack} className="text-orange-600 hover:text-orange-700 font-semibold mb-2 flex items-center gap-2 self-start">← Volver a la obra</button>
      <h2 className="text-3xl font-bold text-orange-600 flex items-center gap-3"><Icon size={30} /> {titulo}</h2>
      {ayuda && <p className="text-gray-500 text-sm mt-1 mb-4">{ayuda}</p>}
      <textarea value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="flex-1 w-full p-4 bg-white text-black border border-gray-300 rounded-lg focus:border-orange-500 outline-none text-sm leading-relaxed resize-none" />
      <p className="text-gray-400 text-xs mt-2">Se guarda automáticamente.</p>
    </div>
  );
}

// ---- COMPONENTE PRINCIPAL ----

export default function AtlasApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [obras, setObras] = useState([]);
  const [selectedObra, setSelectedObra] = useState(null);
  const [obraSection, setObraSection] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showMainModal, setShowMainModal] = useState(false);
  const [showObraModal, setShowObraModal] = useState(false);
  const [newObraNombre, setNewObraNombre] = useState('');
  const [expandedMedidas, setExpandedMedidas] = useState({});
  const [expandedGrupos, setExpandedGrupos] = useState({});
  const [touchStartX, setTouchStartX] = useState(null);

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 60) setSidebarOpen(true);
    if (deltaX < -60) setSidebarOpen(false);
    setTouchStartX(null);
  };

  useEffect(() => {
    const saved = localStorage.getItem('moyesDataAtlas');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleanedObras = (parsed.obras || []).map(obra => ({
          ...obra,
          pedidos: (obra.pedidos || []).map(pedido => {
            const nuevo = {};
            MEDIDAS.forEach(medida => {
              const base = tamanosVacios(medida);
              const prev = pedido.tamaños?.[medida] || {};
              // merge: conserva valores guardados si existen
              Object.keys(base).forEach(accId => {
                if (base[accId].inicial !== undefined) {
                  // fila simple
                  if (prev[accId]?.inicial !== undefined) base[accId] = { inicial: prev[accId].inicial || 0, usada: prev[accId].usada || 0 };
                } else {
                  // grupo
                  Object.keys(base[accId]).forEach(sfId => {
                    if (prev[accId]?.[sfId]) {
                      base[accId][sfId] = {
                        inicial: prev[accId][sfId].inicial || 0,
                        usada: prev[accId][sfId].usada || 0,
                        nombre: prev[accId][sfId].nombre ?? base[accId][sfId].nombre,
                      };
                    }
                  });
                }
              });
              nuevo[medida] = base;
            });
            return { ...pedido, tamaños: nuevo };
          })
        }));
        setObras(cleanedObras);
      } catch (e) { localStorage.removeItem('moyesDataAtlas'); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('moyesDataAtlas', JSON.stringify({ obras }));
  }, [obras]);

  const crearObraNueva = () => {
    if (newObraNombre.trim()) {
      const newObra = { id: Date.now(), nombre: newObraNombre, fecha: new Date().toLocaleDateString(), pedidos: [], equipo: [], planos: [], maquinaria: [], agenda: [], repartidores: [], instalacion: '' };
      setObras(prev => [...prev, newObra]);
      setSelectedObra(newObra);
      setObraSection(null);
      setSelectedPedido(null);
      setNewObraNombre('');
      setShowObraModal(false);
      setShowMainModal(false);
    }
  };

  const crearPedido = () => {
    if (selectedObra) {
      const newPedido = { id: Date.now(), nombre: `Pedido ${selectedObra.pedidos.length + 1}`, fecha: new Date().toLocaleDateString(), tamaños: {} };
      MEDIDAS.forEach((medida) => {
        newPedido.tamaños[medida] = tamanosVacios(medida);
      });
      const obraActualizada = { ...selectedObra, pedidos: [...selectedObra.pedidos, newPedido] };
      setObras(prev => prev.map(o => o.id === selectedObra.id ? obraActualizada : o));
      setSelectedObra(obraActualizada);
      setObraSection('pedidos');
      setSelectedPedido(newPedido);
      setShowMainModal(false);
    }
  };

  const actualizarValor = (medida, accId, subfilaId, campo, valor) => {
    if (!selectedObra || !selectedPedido) return;
    const obraActualizada = {
      ...selectedObra,
      pedidos: selectedObra.pedidos.map(p => {
        if (p.id === selectedPedido.id) {
          const tamanos = { ...p.tamaños };
          tamanos[medida] = { ...p.tamaños[medida] };
          if (subfilaId) {
            tamanos[medida][accId] = { ...p.tamaños[medida][accId] };
            tamanos[medida][accId][subfilaId] = { ...p.tamaños[medida][accId][subfilaId], [campo]: Number(valor) };
          } else {
            tamanos[medida][accId] = { ...p.tamaños[medida][accId], [campo]: Number(valor) };
          }
          return { ...p, tamaños: tamanos };
        }
        return p;
      })
    };
    setObras(prev => prev.map(o => o.id === selectedObra.id ? obraActualizada : o));
    setSelectedObra(obraActualizada);
    setSelectedPedido(obraActualizada.pedidos.find(p => p.id === selectedPedido.id));
  };

  const actualizarNombreSubfila = (medida, accId, subfilaId, nuevoNombre) => {
    if (!selectedObra || !selectedPedido) return;
    const obraActualizada = {
      ...selectedObra,
      pedidos: selectedObra.pedidos.map(p => {
        if (p.id === selectedPedido.id) {
          const tamanos = { ...p.tamaños };
          tamanos[medida] = { ...p.tamaños[medida] };
          tamanos[medida][accId] = { ...p.tamaños[medida][accId] };
          tamanos[medida][accId][subfilaId] = { ...p.tamaños[medida][accId][subfilaId], nombre: nuevoNombre };
          return { ...p, tamaños: tamanos };
        }
        return p;
      })
    };
    setObras(prev => prev.map(o => o.id === selectedObra.id ? obraActualizada : o));
    setSelectedObra(obraActualizada);
    setSelectedPedido(obraActualizada.pedidos.find(p => p.id === selectedPedido.id));
  };

  // ---- ZONA OBRA: helpers genéricos para los campos de la obra ----
  const actualizarObra = (cambios) => {
    if (!selectedObra) return;
    const obraActualizada = { ...selectedObra, ...cambios };
    setObras(prev => prev.map(o => o.id === selectedObra.id ? obraActualizada : o));
    setSelectedObra(obraActualizada);
  };
  const addItemLista = (campo, item) => {
    const lista = selectedObra[campo] || [];
    actualizarObra({ [campo]: [...lista, { id: Date.now(), ...item }] });
  };
  const updateItemLista = (campo, id, cambios) => {
    const lista = selectedObra[campo] || [];
    actualizarObra({ [campo]: lista.map(it => it.id === id ? { ...it, ...cambios } : it) });
  };
  const removeItemLista = (campo, id) => {
    const lista = selectedObra[campo] || [];
    actualizarObra({ [campo]: lista.filter(it => it.id !== id) });
  };

  const toggleGrupo = (key) => setExpandedGrupos(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleMedida = (medida) => {
    setExpandedMedidas(prev => {
      const abriendo = !prev[medida];
      if (abriendo) {
        setTimeout(() => {
          const el = document.getElementById(`medida-${medida}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
      return { ...prev, [medida]: abriendo };
    });
  };

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'obras', label: 'Obras', icon: Wrench },
    { id: 'alimentacion', label: 'Alimentación', icon: Apple },
    { id: 'skills', label: 'Skills', icon: Brain },
  ];

  // Vista de Obras (función normal, no componente, para no recrear)
  const renderObras = () => {
    if (!selectedObra) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 relative">
          <button onClick={() => setActiveTab('home')} className="absolute top-6 left-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-orange-600 rounded-lg transition-all font-semibold flex items-center gap-2 border border-gray-300">← Home</button>
          <div className="text-center max-w-2xl">
            <h1 className="text-4xl font-bold text-orange-600 mb-8 flex items-center justify-center gap-3"><Wrench size={36} /> OBRAS</h1>
            {obras.length === 0 ? (
              <div>
                <p className="text-gray-600 text-lg mb-6">No hay obras creadas aún</p>
                <button onClick={() => setShowMainModal(true)} className="px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all text-xl font-bold flex items-center justify-center gap-3 mx-auto"><Plus size={28} /> Crear Primera Obra</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  {obras.map((obra) => (
                    <button key={obra.id} onClick={() => { setSelectedObra(obra); setObraSection(null); setSelectedPedido(null); }} className="bg-white p-6 rounded-lg border-2 border-gray-300 hover:border-orange-500 hover:shadow-lg transition-all">
                      <p className="text-black font-bold text-lg">{obra.nombre}</p>
                      <p className="text-gray-600 text-sm mt-2">{obra.pedidos.length} pedidos</p>
                      <p className="text-gray-500 text-xs mt-1">{obra.fecha}</p>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowMainModal(true)} className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all font-bold flex items-center justify-center gap-2 mx-auto"><Plus size={20} /> Nueva Obra</button>
              </>
            )}
          </div>
        </div>
      );
    }

    // Pedido abierto: detalle del pedido (usa selectedObra como fuente fresca de datos)
    if (selectedPedido) {
      const pedidoVivo = selectedObra.pedidos.find(p => p.id === selectedPedido.id) || selectedPedido;
      return (
        <div className="w-full h-full flex flex-col p-8 max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex gap-3 mb-2">
              <button onClick={() => { setSelectedPedido(null); setExpandedMedidas({}); }} className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-2">← Pedidos</button>
              <button onClick={() => { setSelectedObra(null); setObraSection(null); setSelectedPedido(null); setExpandedMedidas({}); setActiveTab('home'); }} className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">↖ Home</button>
            </div>
            <h2 className="text-3xl font-bold text-orange-600">{pedidoVivo.nombre}</h2>
            <p className="text-gray-600">{pedidoVivo.fecha}</p>
          </div>
          <TablaPedido pedido={pedidoVivo} expandedMedidas={expandedMedidas} expandedGrupos={expandedGrupos} onToggleMedida={toggleMedida} onToggleGrupo={toggleGrupo} onActualizar={actualizarValor} onNombreSubfila={actualizarNombreSubfila} />
        </div>
      );
    }

    // Sección PEDIDOS: lista de pedidos de la obra
    if (obraSection === 'pedidos') {
      return (
        <div className="w-full h-full flex flex-col p-8 max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <button onClick={() => setObraSection(null)} className="text-orange-600 hover:text-orange-700 font-semibold mb-2 flex items-center gap-2">← Volver a la obra</button>
              <h2 className="text-3xl font-bold text-orange-600 flex items-center gap-3"><Package size={30} /> Pedidos</h2>
              <p className="text-gray-600">{selectedObra.nombre}</p>
            </div>
            <button onClick={() => setShowMainModal(true)} className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center gap-2 transition-all"><Plus size={20} /> Nuevo</button>
          </div>
          {selectedObra.pedidos.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600 text-lg mb-6">No hay pedidos en esta obra</p>
                <button onClick={crearPedido} className="px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all text-xl font-bold"><Plus size={20} className="inline mr-2" /> Crear Primer Pedido</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1 content-start">
              {selectedObra.pedidos.map((pedido) => (
                <button key={pedido.id} onClick={() => { setSelectedPedido(pedido); setExpandedMedidas({}); }} className="bg-white p-6 rounded-lg border-2 border-gray-300 hover:border-orange-500 hover:shadow-lg transition-all text-left">
                  <p className="text-black font-bold text-lg">{pedido.nombre}</p>
                  <p className="text-gray-600 text-sm mt-2">{pedido.fecha}</p>
                  <p className="text-orange-600 text-xs mt-2 font-semibold">Click para ver detalles →</p>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Secciones tipo lista
    if (obraSection === 'equipo') return (
      <ListaSeccion titulo="Equipo / Gente" Icon={Users} ayuda="Organiza a las personas a tu cargo en esta obra." etiquetaAnadir="Añadir persona"
        items={selectedObra.equipo || []} campos={CAMPOS_EQUIPO}
        onAdd={(i) => addItemLista('equipo', i)} onUpdate={(id, c) => updateItemLista('equipo', id, c)} onRemove={(id) => removeItemLista('equipo', id)} onBack={() => setObraSection(null)} />
    );
    if (obraSection === 'planos') return (
      <ListaSeccion titulo="Planos" Icon={Map} ayuda="Guarda los planos por zona y enlaza el PDF o la foto." etiquetaAnadir="Añadir plano"
        items={selectedObra.planos || []} campos={CAMPOS_PLANOS}
        onAdd={(i) => addItemLista('planos', i)} onUpdate={(id, c) => updateItemLista('planos', id, c)} onRemove={(id) => removeItemLista('planos', id)} onBack={() => setObraSection(null)} />
    );
    if (obraSection === 'maquinaria') return (
      <ListaSeccion titulo="Maquinaria" Icon={Tractor} ayuda="Controla el alquiler de maquinaria: proveedor, fechas y estado." etiquetaAnadir="Añadir máquina"
        items={selectedObra.maquinaria || []} campos={CAMPOS_MAQUINARIA}
        onAdd={(i) => addItemLista('maquinaria', i)} onUpdate={(id, c) => updateItemLista('maquinaria', id, c)} onRemove={(id) => removeItemLista('maquinaria', id)} onBack={() => setObraSection(null)} />
    );
    if (obraSection === 'agenda') return (
      <ListaSeccion titulo="Agenda" Icon={Calendar} ayuda="Apunta tareas y citas de la obra con su fecha y hora." etiquetaAnadir="Añadir cita"
        items={selectedObra.agenda || []} campos={CAMPOS_AGENDA}
        onAdd={(i) => addItemLista('agenda', i)} onUpdate={(id, c) => updateItemLista('agenda', id, c)} onRemove={(id) => removeItemLista('agenda', id)} onBack={() => setObraSection(null)} />
    );
    if (obraSection === 'repartidores') return (
      <ListaSeccion titulo="Repartidores" Icon={Truck} ayuda="Contactos de reparto y la ruta o material que traen." etiquetaAnadir="Añadir repartidor"
        items={selectedObra.repartidores || []} campos={CAMPOS_REPARTIDORES}
        onAdd={(i) => addItemLista('repartidores', i)} onUpdate={(id, c) => updateItemLista('repartidores', id, c)} onRemove={(id) => removeItemLista('repartidores', id)} onBack={() => setObraSection(null)} />
    );
    if (obraSection === 'instalacion') return (
      <NotasSeccion titulo="Instalación" Icon={Building2} ayuda="Apunta cómo es la instalación donde vas a montar y cómo adaptarte."
        placeholder="Tipo de instalación, alturas, soportes, accesos, condiciones del local, mediciones in situ, particularidades del montaje..."
        valor={selectedObra.instalacion || ''} onChange={(v) => actualizarObra({ instalacion: v })} onBack={() => setObraSection(null)} />
    );

    // Centro de mando de la obra (obraSection === null)
    const contar = (sec) => {
      if (sec.id === 'instalacion') return (selectedObra.instalacion || '').trim() ? '✓' : '—';
      if (sec.id === 'pedidos') return selectedObra.pedidos.length;
      return (selectedObra[sec.id] || []).length;
    };
    return (
      <div className="w-full h-full flex flex-col p-4 sm:p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <button onClick={() => { setSelectedObra(null); setObraSection(null); setActiveTab('home'); }} className="text-orange-600 hover:text-orange-700 font-semibold mb-2 flex items-center gap-2">← Home</button>
          <h2 className="text-3xl font-bold text-orange-600">{selectedObra.nombre}</h2>
          <p className="text-gray-600">{selectedObra.fecha}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {OBRA_SECCIONES.map((sec) => {
            const Icon = sec.icon;
            return (
              <button key={sec.id} onClick={() => setObraSection(sec.id)}
                className="bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:shadow-lg hover:scale-[1.02] transition-all text-left">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${sec.color} flex items-center justify-center mb-3`}>
                  <Icon size={26} className="text-white" strokeWidth={1.8} />
                </div>
                <p className="text-black font-bold text-base">{sec.label}</p>
                <p className="text-gray-500 text-xs mt-1">{contar(sec)} {sec.id === 'instalacion' ? '' : 'registros'}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-black overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <style>{acordeonAnim}</style>
      {activeTab !== 'obras' && (
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 overflow-y-auto`}>
          <div className="p-4 flex items-center justify-between mb-8">
            {sidebarOpen && (
              <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                <Compass size={26} strokeWidth={1.5} className="text-black" /> ATLAS
              </h1>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-black">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          <nav className="space-y-2 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-black text-white shadow-lg' : 'text-black hover:bg-gray-100'}`}>
                  <Icon size={22} strokeWidth={1.5} />
                  {sidebarOpen && <span className="font-semibold">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      )}
      <div className="flex-1 overflow-auto bg-slate-50">
        {activeTab === 'home' && (
          <div className="p-8">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {menuItems.filter((m) => m.id !== 'home').map((item) => {
                  const Icon = item.icon;
                  const count = item.id === 'obras' ? obras.length : 0;
                  return (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className="bg-white border-2 border-gray-200 p-6 rounded-lg text-black hover:border-black hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
                      <Icon size={32} className="mb-2" strokeWidth={1.5} />
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{count} items</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'obras' && renderObras()}
        {activeTab === 'alimentacion' && (
          <div className="p-8">
            <button onClick={() => setActiveTab('home')} className="text-orange-600 font-semibold mb-6 flex items-center gap-2">← Home</button>
            <h1 className="text-4xl font-bold text-black mb-4 flex items-center gap-3"><Apple size={36} strokeWidth={1.5} /> Alimentación</h1>
            <p className="text-gray-500">Próximamente — esta sección aún no está construida.</p>
          </div>
        )}
        {activeTab === 'skills' && (
          <div className="p-8">
            <button onClick={() => setActiveTab('home')} className="text-orange-600 font-semibold mb-6 flex items-center gap-2">← Home</button>
            <h1 className="text-4xl font-bold text-black mb-4 flex items-center gap-3"><Brain size={36} strokeWidth={1.5} /> Skills</h1>
            <p className="text-gray-500">Próximamente — esta sección aún no está construida.</p>
          </div>
        )}
      </div>

      {showMainModal && (
        <MainModal
          selectedObra={selectedObra}
          onObraNueva={() => setShowObraModal(true)}
          onPedidoNuevo={crearPedido}
          onClose={() => setShowMainModal(false)}
        />
      )}
      {showObraModal && (
        <ObraModal
          value={newObraNombre}
          onChange={setNewObraNombre}
          onCrear={crearObraNueva}
          onClose={() => setShowObraModal(false)}
        />
      )}
    </div>
  );
}
