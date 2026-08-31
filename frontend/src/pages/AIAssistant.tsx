import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

type Message = { role: 'user' | 'assistant'; content: string; tiempo: string };

const sugerencias = [
  '¿Cuánto stock tenemos de Duela PVC Blanca?',
  '¿Qué productos están con stock crítico (menos del mínimo)?',
  'Dame un resumen de las ventas de hoy',
];

// Función para parsear Markdown básico (negritas y listas)
const formatContent = (content: string) => {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    // Bold
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const formatted = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={j} className="font-semibold text-orange-600">{part}</strong> : <span key={j}>{part}</span>
    );
    // Heading
    if (line.startsWith('### ')) return <h4 key={i} className="font-display font-semibold text-slate-800 text-sm mt-3 mb-1">{line.slice(4)}</h4>;
    if (line.startsWith('## ')) return <h3 key={i} className="font-display font-bold text-slate-800 text-base mt-4 mb-2">{line.slice(3)}</h3>;
    if (line.startsWith('---')) return <hr key={i} className="my-3" style={{ borderColor: '#E5E7EB' }} />;
    if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} className="flex gap-2 text-sm text-slate-700 mt-1"><span className="text-orange-500 flex-shrink-0">•</span><span>{formatted.slice(1)}</span></div>;
    if (line === '') return <div key={i} className="h-1" />;
    return <p key={i} className="text-sm text-slate-700 leading-relaxed mt-1">{formatted}</p>;
  });
};

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hola. Soy el Asistente DBM. Estoy conectado a la base de datos de tu inventario y ventas. ¿En qué te puedo ayudar hoy?', tiempo: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    
    const now = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: 'user', content: text, tiempo: now }]);
    setInput('');
    setLoading(true);

    try {
      // Llamada real al backend
      const response = await api.post('/chat', { prompt: text });
      
      const nowResp = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [...prev, { role: 'assistant', content: response.data.reply, tiempo: nowResp }]);
    } catch (error) {
      console.error("Error en el chat:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "❌ Ocurrió un error al conectar con el cerebro del asistente. Revisa la consola del servidor.", tiempo: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ background: '#F0F2F5' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center gap-4" style={{ background: '#fff', borderColor: '#E5E7EB' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#1D2647' }}>🤖</div>
        <div>
          <h1 className="font-display font-bold text-lg text-slate-800">Asistente DBM (Gemini AI)</h1>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-slate-500">Conectado a PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 chat-scroll space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 self-end text-sm" style={{ background: '#1D2647' }}>🤖</div>
            )}
            <div
              className="max-w-2xl rounded-2xl px-4 py-3 shadow-sm"
              style={{
                background: m.role === 'user' ? '#ED871B' : '#ffffff',
                borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: m.role === 'assistant' ? 4 : 16,
                border: m.role === 'assistant' ? '1px solid #E5E7EB' : 'none',
              }}
            >
              {m.role === 'user' ? (
                <p className="text-sm text-white">{m.content}</p>
              ) : (
                <div>{formatContent(m.content)}</div>
              )}
              <div className="text-xs mt-1.5 text-right" style={{ color: m.role === 'user' ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}>
                {m.tiempo}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 self-end text-sm" style={{ background: '#1D2647' }}>🤖</div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-1.5" style={{ border: '1px solid #E5E7EB', borderBottomLeftRadius: 4 }}>
              <span className="text-xs text-slate-500 italic">Ejecutando consultas SQL y analizando...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sugerencias */}
      {messages.length <= 1 && (
        <div className="px-6 pb-3">
          <p className="text-xs text-slate-400 mb-2 font-medium">Consultas frecuentes:</p>
          <div className="flex flex-wrap gap-2">
            {sugerencias.map((s) => (
              <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full transition-colors hover:bg-gray-200" style={{ background: '#fff', color: '#1D2647', border: '1px solid #E5E7EB' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t" style={{ background: '#fff', borderColor: '#E5E7EB' }}>
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Pregunta algo al Asistente DBM..."
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none border focus:border-orange-500"
          />
          <button onClick={() => send(input)} disabled={!input.trim() || loading} className="px-5 py-3 rounded-xl font-bold text-white text-sm bg-orange-500 disabled:opacity-40">
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}