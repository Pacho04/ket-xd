import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import PaginaPedidos from "./paginapedidos.jsx";

// ── SVG LOGO ──
const LogoSVG = ({ size = 40, opacity = 1, id = "logo" }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
    <defs>
      <linearGradient id={`ringGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5a623" />
        <stop offset="45%" stopColor="#e03e2d" />
        <stop offset="100%" stopColor="#9b1fa8" />
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="57" stroke={`url(#ringGrad-${id})`} strokeWidth="5.5" fill="#f0e8d0" />
    <ellipse cx="60" cy="66" rx="33" ry="29" stroke="#1a1508" strokeWidth="3.5" fill="none" />
    <path d="M42 62 Q60 39 78 62" stroke="#1a1508" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <line x1="45" y1="59" x2="75" y2="59" stroke="#1a1508" strokeWidth="3" strokeLinecap="round" />
    <line x1="45" y1="66" x2="75" y2="66" stroke="#1a1508" strokeWidth="3" strokeLinecap="round" />
    <line x1="45" y1="73" x2="75" y2="73" stroke="#1a1508" strokeWidth="3" strokeLinecap="round" />
    <text fontFamily="'Arial Black', sans-serif" fontSize="11.5" fontWeight="900" fill="#f5a623" letterSpacing="2.5">
      <textPath href={`#topArc-${id}`} startOffset="50%" textAnchor="middle">RELLENITAS</textPath>
    </text>
    <path id={`topArc-${id}`} d="M 14,60 A 46,46 0 0,1 106,60" fill="none" />
    <text fontFamily="'Arial Black', sans-serif" fontSize="13" fontWeight="900" fill="#f5a623" letterSpacing="4">
      <textPath href={`#botArc-${id}`} startOffset="50%" textAnchor="middle">XD</textPath>
    </text>
    <path id={`botArc-${id}`} d="M 20,74 A 46,46 0 0,0 100,74" fill="none" />
  </svg>
);

const WatermarkBg = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
    {[...Array(12)].map((_, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      return (
        <div key={i} style={{ position: "absolute", top: `${row * 33 + 5}%`, left: `${col * 26 + 2}%`, transform: `rotate(${(i % 3 - 1) * 12}deg)`, opacity: 0.028 }}>
          <LogoSVG size={160} id={`wm-${i}`} />
        </div>
      );
    })}
  </div>
);

// ── DATOS ──
const entradas = [
  { id: 101, emoji: "🥟", nombre: "Empanadas", desc: "Elige el relleno:", precio: 3000, badge: null, opciones: ["Papa carne", "Pollo", "Carne desmechada", "Arepa de huevo"] },
  { id: 102, emoji: "🌶️", nombre: "Choricriollas", desc: "Papa criolla acompañada de chorícito santaresano y guacamole", precio: 16500, badge: "ESPECIAL" },
];
const arepas = [
  { id: 1, emoji: "🍖", nombre: "Albóndiga", desc: "Albóndiga, queso y huevo de codorniz", precio: 14000, badge: null },
  { id: 2, emoji: "🥩", nombre: "Carne Desmechada", desc: "Carne desmechada, queso y huevo codorniz", precio: 14000, badge: null },
  { id: 3, emoji: "🍳", nombre: "Mixta", desc: "Pollo, carne, jamón, queso y huevo de codorniz", precio: 14000, badge: "POPULAR" },
  { id: 4, emoji: "🌽", nombre: "Criolla", desc: "Carne, chicharrón, platanitos, queso y huevo de codorniz", precio: 14500, badge: null },
  { id: 5, emoji: "🍗", nombre: "Pollo", desc: "Pollo, queso, jamón y huevo de codorniz", precio: 13000, badge: null },
  { id: 6, emoji: "🍳", nombre: "Huevos Rancheros", desc: "Huevos pericos, salchicha ranchera y queso", precio: 11000, badge: null },
  { id: 7, emoji: "🍄", nombre: "Huevos con Champiñón o Tocineta", desc: "Huevos revueltos, champiñón o tocineta y queso", precio: 10000, badge: null },
  { id: 8, emoji: "🌭", nombre: "Con Chorizo", desc: "Chorizo santaresano y queso", precio: 11000, badge: null },
  { id: 9, emoji: "🐔", nombre: "Pollo XD", desc: "Pollo, guacamole, queso, jamón y huevo de codorniz", precio: 14000, badge: null },
  { id: 10, emoji: "🧀", nombre: "Queso", desc: "Doble queso", precio: 5000, badge: null },
  { id: 11, emoji: "🥓", nombre: "Jamón", desc: "Queso y Jamón", precio: 7000, badge: null },
  { id: 12, emoji: "🍔", nombre: "Arepaburguer", desc: "Carne artesanal y queso", precio: 14000, badge: null },
  { id: 13, emoji: "⭐", nombre: "Súper Rellenita", desc: "Carne, pollo, maíz, chicharrón, champiñón, chorizo, queso y huevo de codorniz", precio: 17000, badge: "ESTRELLA" },
  { id: 14, emoji: "🌮", nombre: "Mexicana", desc: "Carne, frijol, pico de gallo, queso y huevo de codorniz", precio: 16000, badge: null },
];
const otrosPlatos = [
  { id: 201, emoji: "🥖", nombre: "Choripan", desc: "Pan salteado en mantequilla, chorizo y chimichurri argentino", precio: 11000, badge: null },
  { id: 202, emoji: "🏆", nombre: "Toston XD", desc: "Chicharrón, chorizo, carne desmechada, guacamole y pico de gallo", precio: 16000, badge: "ESPECIAL" },
];
const SABORES_JUGO = [
  { nombre: "Mora", emoji: "🫐" }, { nombre: "Maracuyá", emoji: "🟡" },
  { nombre: "Mango", emoji: "🥭" }, { nombre: "Mandarina", emoji: "🍊" }, { nombre: "Lulo", emoji: "🟢" },
];
const bebidas = [
  { id: 301, emoji: "🍹", nombre: "Jugo en Agua", desc: "Mora, Maracuyá", precio: 6500, badge: null, tieneSabor: true },
  { id: 302, emoji: "🥛", nombre: "Jugo en Leche", desc: "Mora, Maracuyá", precio: 7500, badge: null, tieneSabor: true },
  { id: 303, emoji: "🍋", nombre: "Limonada Natural", desc: "Limonada fresca natural", precio: 5000, badge: null },
  { id: 304, emoji: "🥥", nombre: "Limonada de Coco", desc: "Refrescante limonada con coco", precio: 10000, badge: "ESPECIAL" },
  { id: 305, emoji: "🥤", nombre: "Gaseosa 250", desc: "Gaseosa personal 250ml", precio: 3000, badge: null },
  { id: 306, emoji: "🥤", nombre: "Gaseosa 350", desc: "Gaseosa mediana 350ml", precio: 4000, badge: null },
  { id: 307, emoji: "🥤", nombre: "Gaseosa 400", desc: "Gaseosa grande 400ml", precio: 4500, badge: null },
  { id: 308, emoji: "🧃", nombre: "Gaseosa Familiar", desc: "Gaseosa familiar para compartir", precio: 8500, badge: null },
];
const adiciones = [
  { id: 401, emoji: "🍄", nombre: "Champiñón, Tocineta y Maíz", precio: 2500 },
  { id: 402, emoji: "🐷", nombre: "Chicharrón", precio: 2800 },
  { id: 403, emoji: "🥚", nombre: "Huevo Codorniz", precio: 4000 },
  { id: 404, emoji: "🌭", nombre: "Chorizo", precio: 4800 },
  { id: 405, emoji: "🥩", nombre: "Carne Desmechada", precio: 4500 },
  { id: 406, emoji: "🍗", nombre: "Pollo", precio: 4000 },
  { id: 407, emoji: "🍖", nombre: "Albóndiga", precio: 6000 },
  { id: 408, emoji: "🥑", nombre: "Guacamole", precio: 2500 },
  { id: 409, emoji: "🧀", nombre: "Queso", precio: 2500 },
  { id: 410, emoji: "🍟", nombre: "Papa Francesa o Criolla", precio: 6500 },
];
const pasos = [
  { num: 1, emoji: "🍽️", titulo: "Arma tu pedido", desc: "Navega el menú y agrega al carrito las arepas, entradas y bebidas que te provoquen." },
  { num: 2, emoji: "➕", titulo: "Añade adiciones", desc: "Personaliza tu arepa con adiciones. ¡Ponle lo que más te guste!" },
  { num: 3, emoji: "💬", titulo: "Confirma y listo", desc: "Dinos tu nombre, si recoges o necesitas domicilio, y confirmamos tu pedido." },
];

const S = {
  naranja: "#f5a623", oscuro: "#111009", oscuro2: "#1a1508",
  card: "#1e1a10", texto: "#ffffff", textoSub: "rgba(255,255,255,0.55)",
  verde: "#25d366", rojo: "#e03e2d",
};

// ── NÚMERO DE WHATSAPP (sin + ni espacios) ──
const WA_NUMBER = "573103830424";

// ── GENERAR MENSAJE WHATSAPP ──
function generarMensajeWA({ nombre, carrito, total, tipo, direccion, codigoPedido }) {
  const lineas = carrito.map(i => {
    const adStr = i.adiciones && i.adiciones.length > 0
      ? ` (+${i.adiciones.map(a => a.nombre).join(", ")})`
      : "";
    return `  • ${i.emoji} ${i.nombre} x${i.qty}${adStr} — $${(i.precio * i.qty).toLocaleString("es-CO")}`;
  });

  const entrega = tipo === "domicilio"
    ? `🛵 Domicilio a: ${direccion}`
    : "🏠 Recoge en tienda";

  const msg = [
    `🌽 *Nuevo pedido - Rellenitas XD*`,
    ``,
    `👤 *Cliente:* ${nombre}`,
    `📦 *Entrega:* ${entrega}`,
    ``,
    `*Pedido:*`,
    ...lineas,
    ``,
    `💰 *Total: $${total.toLocaleString("es-CO")}*`,
    ``,
    `🔖 Código: ${codigoPedido}`,
  ].join("\n");

  return encodeURIComponent(msg);
}

// ── MODAL SABOR ──
function ModalSabor({ item, onConfirm, onClose }) {
  const [sabor, setSabor] = useState(null);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 350, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 380, background: "#1e1a10", borderRadius: 20, border: "1px solid rgba(59,130,246,0.4)", overflow: "hidden" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: "0.7rem", color: "#3b82f6", fontFamily: "'Nunito',sans-serif", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Elige tu sabor</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.8rem" }}>{item.emoji}</span>
            <div>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.5rem" }}>{item.nombre}</h3>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", color: "#3b82f6", fontSize: "1.1rem" }}>$ {item.precio.toLocaleString("es-CO")}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {SABORES_JUGO.map(s => {
              const sel = sabor === s.nombre;
              return (
                <button key={s.nombre} onClick={() => setSabor(s.nombre)} style={{ background: sel ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${sel ? "#3b82f6" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s", color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.3rem" }}>{s.emoji}</span>
                    <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{s.nombre}</span>
                  </div>
                  {sel && <span style={{ background: "#3b82f6", color: "white", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ padding: "1rem 1.25rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "0.75rem" }}>
          <button onClick={onClose} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: S.textoSub, borderRadius: 10, padding: "11px", fontFamily: "'Nunito',sans-serif", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>Cancelar</button>
          <button onClick={() => sabor && onConfirm(item, sabor)} disabled={!sabor} style={{ flex: 2, background: sabor ? "#3b82f6" : "rgba(59,130,246,0.25)", color: "white", border: "none", borderRadius: 10, padding: "11px", fontFamily: "'Nunito',sans-serif", fontWeight: 800, cursor: sabor ? "pointer" : "not-allowed", fontSize: "0.95rem" }}>
            🛒 Añadir al carrito
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL ADICIONES ──
function ModalAdiciones({ item, onConfirm, onClose }) {
  const [sel, setSel] = useState([]);
  const toggle = ad => setSel(prev => prev.find(a => a.id === ad.id) ? prev.filter(a => a.id !== ad.id) : [...prev, ad]);
  const extra = sel.reduce((s, a) => s + a.precio, 0);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 480, background: "#1e1a10", borderRadius: 20, border: "1px solid rgba(245,166,35,0.3)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: S.naranja, fontFamily: "'Nunito',sans-serif", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Agregando al carrito</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.8rem" }}>{item.emoji}</span>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.6rem" }}>{item.nombre}</h3>
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.2rem", color: S.naranja, marginTop: "0.2rem" }}>$ {item.precio.toLocaleString("es-CO")}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", color: S.textoSub, fontFamily: "'Nunito',sans-serif", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>➕ ¿Le agregas algo? (opcional)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            {adiciones.map(ad => {
              const isSel = sel.find(a => a.id === ad.id);
              return (
                <button key={ad.id} onClick={() => toggle(ad)} style={{ background: isSel ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${isSel ? S.naranja : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "0.75rem", cursor: "pointer", textAlign: "left", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: "0.25rem", color: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "1.1rem" }}>{ad.emoji}</span>
                    {isSel && <span style={{ background: S.naranja, color: S.oscuro, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800 }}>✓</span>}
                  </div>
                  <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.78rem", lineHeight: 1.3 }}>{ad.nombre}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.95rem", color: isSel ? S.naranja : S.textoSub }}>+ $ {ad.precio.toLocaleString("es-CO")}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ padding: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {sel.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontFamily: "'Nunito',sans-serif", fontSize: "0.88rem" }}>
              <span style={{ color: S.textoSub }}>Total con adiciones:</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.2rem", color: S.naranja }}>$ {(item.precio + extra).toLocaleString("es-CO")}</span>
            </div>
          )}
          <button onClick={() => onConfirm(item, sel)} style={{ width: "100%", background: S.naranja, color: S.oscuro, border: "none", padding: "14px", borderRadius: 10, fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1rem", cursor: "pointer" }}>
            🛒 Añadir al carrito {sel.length > 0 ? `(+${sel.length} adición${sel.length > 1 ? "es" : ""})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL CONFIRMAR PEDIDO ──
function ModalConfirmarPedido({ carrito, total, onConfirmar, onClose }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [codigoPedido, setCodigoPedido] = useState(null);

  const valido = nombre.trim() && tipo && (tipo === "recoger" || (tipo === "domicilio" && direccion.trim()));

  // ── CONFIRMAR: guarda en Firebase Y abre WhatsApp ──
  const confirmar = async () => {
    if (!valido) return;
    setEnviando(true);
    try {
      const hoy = new Date().toISOString().split("T")[0];
      const q = query(collection(db, "pedidos"), where("fechaPedido", "==", hoy));
      const snap = await getDocs(q);
      const numCorto = String(snap.size + 1).padStart(2, "0");

      const ref = await addDoc(collection(db, "pedidos"), {
        nombre: nombre.trim(),
        items: carrito.map(i => ({
          nombre: i.nombre, qty: i.qty, precio: i.precio, emoji: i.emoji,
          adiciones: i.adiciones || [],
        })),
        total,
        tipoEntrega: tipo,
        direccion: tipo === "domicilio" ? direccion.trim() : "Recoge en tienda",
        estado: "recibido",
        fechaPedido: hoy,
        numeroPedido: numCorto,
        creadoEn: serverTimestamp(),
      });

      const pedidoId = ref.id;
      setCodigoPedido(pedidoId);

      // ── Abrir WhatsApp con el resumen del pedido ──
      const msgWA = generarMensajeWA({
        nombre: nombre.trim(),
        carrito,
        total,
        tipo,
        direccion: tipo === "domicilio" ? direccion.trim() : "Recoge en tienda",
        codigoPedido: pedidoId,
      });
      window.open(`https://wa.me/${WA_NUMBER}?text=${msgWA}`, "_blank");

      onConfirmar(pedidoId);
    } catch (e) {
      alert("Error al enviar el pedido. Intenta de nuevo.");
    }
    setEnviando(false);
  };

  if (codigoPedido) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 420, background: "#1e1a10", borderRadius: 20, border: "1px solid rgba(34,197,94,0.4)", padding: "2.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2.2rem", color: "#22c55e", marginBottom: "0.5rem" }}>¡Pedido Confirmado!</h2>
        <p style={{ color: S.textoSub, fontFamily: "'Nunito',sans-serif", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Tu pedido fue registrado y enviado por WhatsApp. Guarda este código para rastrearlo.
        </p>
        <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.7rem", color: S.textoSub, fontFamily: "'Nunito',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Tu código de pedido</div>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "0.85rem", color: "#22c55e", wordBreak: "break-all", letterSpacing: "0.05em" }}>{codigoPedido}</div>
        </div>
        <button onClick={onClose} style={{ width: "100%", background: "#22c55e", color: S.oscuro, border: "none", borderRadius: 10, padding: "14px", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1rem", cursor: "pointer" }}>
          Ver estado de mi pedido →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 460, background: "#1e1a10", borderRadius: 20, border: "1px solid rgba(245,166,35,0.3)", overflow: "hidden", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.8rem", lineHeight: 1 }}>Confirmar Pedido</h3>
            <p style={{ color: S.textoSub, fontFamily: "'Nunito',sans-serif", fontSize: "0.82rem", marginTop: "0.2rem" }}>Casi listo, solo un par de datos</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", padding: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.7rem", color: S.textoSub, fontFamily: "'Nunito',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Resumen de tu pedido</div>
            {carrito.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontFamily: "'Nunito',sans-serif" }}>
                <span style={{ fontSize: "0.85rem" }}>{item.emoji} {item.nombre} x{item.qty}</span>
                <span style={{ color: S.naranja, fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem" }}>$ {(item.precio * item.qty).toLocaleString("es-CO")}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "0.75rem", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, color: S.textoSub }}>Total</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.4rem", color: S.naranja }}>$ {total.toLocaleString("es-CO")}</span>
            </div>
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.82rem", color: S.textoSub, marginBottom: "0.5rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>👤 Tu nombre</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="¿A nombre de quién?" style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(245,166,35,0.25)", borderRadius: 10, padding: "12px 16px", color: S.texto, fontFamily: "'Nunito',sans-serif", fontSize: "0.95rem", outline: "none" }} />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.82rem", color: S.textoSub, marginBottom: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>📦 ¿Cómo lo recibes?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {[
                { key: "recoger", emoji: "🏠", titulo: "Recojo en tienda", sub: "Vienes a recogerlo" },
                { key: "domicilio", emoji: "🛵", titulo: "Domicilio", sub: "Te lo llevamos" },
              ].map(op => (
                <button key={op.key} onClick={() => setTipo(op.key)} style={{ background: tipo === op.key ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.04)", border: `2px solid ${tipo === op.key ? S.naranja : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "1rem", cursor: "pointer", textAlign: "center", transition: "all 0.2s", color: "#fff" }}>
                  <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>{op.emoji}</div>
                  <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "0.88rem" }}>{op.titulo}</div>
                  <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.75rem", color: S.textoSub, marginTop: "0.2rem" }}>{op.sub}</div>
                  {tipo === op.key && <div style={{ color: S.naranja, fontSize: "0.75rem", fontWeight: 800, marginTop: "0.4rem" }}>✓ Seleccionado</div>}
                </button>
              ))}
            </div>
          </div>
          {tipo === "domicilio" && (
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.82rem", color: S.textoSub, marginBottom: "0.5rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>📍 Tu dirección</label>
              <input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Ej: Cra 7 #12-34, barrio..." style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(59,130,246,0.35)", borderRadius: 10, padding: "12px 16px", color: S.texto, fontFamily: "'Nunito',sans-serif", fontSize: "0.95rem", outline: "none" }} />
              <p style={{ color: S.textoSub, fontFamily: "'Nunito',sans-serif", fontSize: "0.78rem", marginTop: "0.4rem" }}>Incluye barrio y alguna referencia si puedes.</p>
            </div>
          )}
          {/* Aviso WhatsApp */}
          <div style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: 10, padding: "0.9rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.4rem" }}>💬</span>
            <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
              Al confirmar, tu pedido se registra <strong style={{ color: "#25d366" }}>y</strong> se envía automáticamente por <strong style={{ color: "#25d366" }}>WhatsApp</strong> para coordinarlo.
            </p>
          </div>
        </div>
        <div style={{ padding: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={confirmar} disabled={!valido || enviando} style={{ width: "100%", background: valido ? S.naranja : "rgba(245,166,35,0.25)", color: valido ? S.oscuro : S.textoSub, border: "none", borderRadius: 10, padding: "14px", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1rem", cursor: valido ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
            {enviando ? "Enviando..." : "✅ Confirmar y enviar por WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CARD ITEM ──
function ItemCard({ item, onAgregar, accentColor = "#f5a623", showAdicionesModal, showSaborModal, showOpcionesModal }) {
  const handleClick = () => {
    if (showOpcionesModal && item.opciones) return showOpcionesModal(item);
    if (showSaborModal && item.tieneSabor) return showSaborModal(item);
    if (showAdicionesModal) return showAdicionesModal(item);
    onAgregar(item);
  };
  return (
    <div className="card-item" style={{ background: S.card, borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", padding: "1.25rem", position: "relative", display: "flex", flexDirection: "column" }}>
      {item.badge && <span style={{ position: "absolute", top: 10, left: 10, background: accentColor, color: S.oscuro, borderRadius: 100, padding: "3px 10px", fontSize: "0.6rem", fontWeight: 800, fontFamily: "'Nunito',sans-serif" }}>{item.badge}</span>}
      {item.tieneSabor && <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(59,130,246,0.2)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 100, padding: "2px 8px", fontSize: "0.58rem", fontWeight: 800, fontFamily: "'Nunito',sans-serif" }}>+ SABOR</span>}
      <div style={{ fontSize: "2.2rem", marginBottom: "0.6rem", textAlign: "center", marginTop: item.badge ? "0.6rem" : 0 }}>{item.emoji}</div>
      <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "0.95rem", marginBottom: "0.3rem" }}>{item.nombre}</h3>
      <p style={{ color: S.textoSub, fontSize: "0.8rem", lineHeight: 1.5, marginBottom: "1rem", fontFamily: "'Nunito',sans-serif", flex: 1 }}>{item.desc}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "0.6rem", color: S.textoSub, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Nunito',sans-serif" }}>PRECIO</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.5rem", color: accentColor }}>$ {item.precio.toLocaleString("es-CO")}</div>
        </div>
        <button className="btn-mas" onClick={handleClick} style={{ width: 38, height: 38, borderRadius: "50%", background: accentColor, color: S.oscuro, border: "none", fontSize: "1.3rem", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>+</button>
      </div>
    </div>
  );
}

function SeccionHeader({ emoji, bg, border, titulo, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
      <div style={{ width: 50, height: 50, borderRadius: 12, background: bg, border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>{emoji}</div>
      <div>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2rem,4vw,2.8rem)", lineHeight: 1 }}>{titulo}</h2>
        <p style={{ color: S.textoSub, fontFamily: "'Nunito',sans-serif", fontSize: "0.85rem" }}>{sub}</p>
      </div>
    </div>
  );
}

// ── MODAL OPCIONES ──
function ModalOpciones({ item, onConfirm, onClose }) {
  const [sel, setSel] = useState(null);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 350, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 420, background: "#1e1a10", borderRadius: 20, border: "1px solid rgba(59,130,246,0.4)", overflow: "hidden" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.8rem" }}>{item.emoji}</span>
            <div>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.5rem" }}>{item.nombre}</h3>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", color: "#3b82f6", fontSize: "1.1rem" }}>$ {item.precio.toLocaleString("es-CO")}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {item.opciones && item.opciones.map(opt => {
              const seleccionado = sel === opt;
              return (
                <button key={opt} onClick={() => setSel(opt)} style={{ background: seleccionado ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${seleccionado ? "#3b82f6" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s", color: "#fff" }}>
                  <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{opt}</span>
                  {seleccionado && <span style={{ background: "#3b82f6", color: "white", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ padding: "1rem 1.25rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "0.75rem" }}>
          <button onClick={onClose} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", borderRadius: 10, padding: "11px", fontFamily: "'Nunito',sans-serif", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>Cancelar</button>
          <button onClick={() => sel && onConfirm(item, sel)} disabled={!sel} style={{ flex: 2, background: sel ? "#3b82f6" : "rgba(59,130,246,0.25)", color: "white", border: "none", borderRadius: 10, padding: "11px", fontFamily: "'Nunito',sans-serif", fontWeight: 800, cursor: sel ? "pointer" : "not-allowed", fontSize: "0.95rem" }}>
            🛒 Añadir ({sel || "elige"})
          </button>
        </div>
      </div>
    </div>
  );
}

// ── APP PRINCIPAL ──
export default function App() {
  const [pagina, setPagina] = useState("inicio");
  const [adminMode, setAdminMode] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [modalSaborItem, setModalSaborItem] = useState(null);
  const [modalOpcionesItem, setModalOpcionesItem] = useState(null);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [pedidoConfirmadoId, setPedidoConfirmadoId] = useState(null);

  const agregarConAdiciones = (item, adicionesSeleccionadas) => {
    const precioFinal = item.precio + adicionesSeleccionadas.reduce((s, a) => s + a.precio, 0);
    const key = `${item.id}-${adicionesSeleccionadas.map(a => a.id).sort().join("_") || "base"}`;
    setCarrito(prev => {
      const existe = prev.find(i => i._key === key);
      if (existe) return prev.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, _key: key, precio: precioFinal, adiciones: adicionesSeleccionadas, qty: 1 }];
    });
    setModalItem(null);
  };

  const confirmarSabor = (item, sabor) => {
    const key = `${item.id}-${sabor}`;
    setCarrito(prev => {
      const existe = prev.find(i => i._key === key);
      if (existe) return prev.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, _key: key, sabor, adiciones: [], qty: 1, nombre: `${item.nombre} de ${sabor}` }];
    });
    setModalSaborItem(null);
  };

  const confirmarOpciones = (item, opcion) => {
    const key = `${item.id}-${opcion}`;
    setCarrito(prev => {
      const existe = prev.find(i => i._key === key);
      if (existe) return prev.map(i => i._key === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, _key: key, precio: item.precio, opcionesSeleccionadas: opcion, qty: 1, nombre: `${item.nombre} (${opcion})` }];
    });
    setModalOpcionesItem(null);
  };

  const agregar = (item) => {
    setCarrito(prev => {
      const existe = prev.find(i => i._key === `${item.id}`);
      if (existe) return prev.map(i => i._key === `${item.id}` ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, _key: `${item.id}`, adiciones: [], qty: 1 }];
    });
  };

  const quitar = (key) => {
    setCarrito(prev => {
      const existe = prev.find(i => i._key === key);
      if (!existe) return prev;
      if (existe.qty === 1) return prev.filter(i => i._key !== key);
      return prev.map(i => i._key === key ? { ...i, qty: i.qty - 1 } : i);
    });
  };

  const total = carrito.reduce((s, i) => s + i.precio * i.qty, 0);
  const totalItems = carrito.reduce((s, i) => s + i.qty, 0);

  const onPedidoConfirmado = (id) => {
    setPedidoConfirmadoId(id);
    setCarrito([]);
    setCarritoAbierto(false);
  };

  const irAPedidos = () => {
    setModalConfirmar(false);
    setPagina("pedidos");
  };

  return (
    <div style={{ background: S.oscuro, color: S.texto, fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@300;400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #111009; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111009; }
        ::-webkit-scrollbar-thumb { background: #f5a623; border-radius: 3px; }
        .btn-naranja { background: #f5a623; color: #111009; border: none; padding: 14px 28px; border-radius: 8px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: all 0.2s; font-family: 'Nunito', sans-serif; }
        .btn-naranja:hover { background: #e09500; transform: translateY(-2px); }
        .btn-outline { background: transparent; color: white; border: 1.5px solid rgba(255,255,255,0.25); padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s; font-family: 'Nunito', sans-serif; }
        .btn-outline:hover { border-color: #f5a623; color: #f5a623; }
        .card-item { transition: all 0.25s; }
        .card-item:hover { transform: translateY(-4px); border-color: rgba(245,166,35,0.5) !important; }
        .btn-mas:hover { opacity: 0.85 !important; transform: scale(1.1) !important; }
        .nav-link { background: none; border: none; color: rgba(255,255,255,0.6); font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 600; cursor: pointer; padding: 8px 14px; border-radius: 8px; transition: all 0.2s; }
        .nav-link:hover { color: #f5a623; background: rgba(245,166,35,0.08); }
        .nav-link.active { color: #f5a623; }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(245,166,35,0.4); } 50% { box-shadow: 0 0 0 10px rgba(245,166,35,0); } }
        .pulse { animation: pulse 2s infinite; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.1rem; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.1rem; }
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.1rem; }
        .adiciones-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; }

        /* ── NAVBAR RESPONSIVE ── */
        .nav-desktop { display: flex; }
        .nav-mobile  { display: none; }

        @media (max-width: 900px) {
          .grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
          .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .adiciones-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-4 { grid-template-columns: 1fr 1fr !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .adiciones-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .hero-titulo { font-size: 3.5rem !important; }
          .pasos-grid { flex-direction: column !important; align-items: center !important; }
          .footer-grid { flex-direction: column !important; gap: 2rem !important; }
          .paso-linea { display: none !important; }
          /* En móvil: ocultar desktop, mostrar mobile */
          .nav-desktop { display: none !important; }
          .nav-mobile  { display: flex !important; }
        }
      `}</style>

      <WatermarkBg />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ══════════════════════════════════
            NAVBAR
           ══════════════════════════════════ */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "0 2rem", height: "64px",
          background: "rgba(17,16,9,0.93)", backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(245,166,35,0.15)"
        }}>

          {/* ── LOGO / BRAND ──
              Desktop → va a "inicio"
              Móvil   → va directo a "admin"  (clase nav-mobile lo reemplaza) */}
          <button
            onClick={() => setPagina("inicio")}
            className="nav-desktop"
            style={{ alignItems: "center", gap: "0.75rem", background: "none", border: "none", cursor: "pointer" }}
          >
            <LogoSVG size={42} id="nav-d" />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1, color: S.texto }}>Rellenitas XD</div>
              <div style={{ fontSize: "0.65rem", color: S.textoSub, letterSpacing: "0.1em", textTransform: "uppercase" }}>El sabor de verdad</div>
            </div>
          </button>

          {/* Versión móvil del logo → lleva a admin */}
          <button
            onClick={() => setPagina("admin")}
            className="nav-mobile"
            style={{ alignItems: "center", gap: "0.75rem", background: "none", border: "none", cursor: "pointer" }}
          >
            <LogoSVG size={42} id="nav-m" />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1, color: S.texto }}>Rellenitas XD</div>
              <div style={{ fontSize: "0.65rem", color: S.textoSub, letterSpacing: "0.1em", textTransform: "uppercase" }}>El sabor de verdad</div>
            </div>
          </button>

          {/* ── LINKS DESKTOP: solo Rastrear + Carrito ── */}
          <div className="nav-desktop" style={{ alignItems: "center", gap: "0.75rem" }}>
            <button
              className={`nav-link ${pagina === "pedidos" ? "active" : ""}`}
              onClick={() => setPagina("pedidos")}
            >
              🔍 Rastrear pedido
            </button>

            <button
              onClick={() => setCarritoAbierto(true)}
              className={totalItems > 0 ? "pulse" : ""}
              style={{
                background: totalItems > 0 ? S.naranja : "rgba(255,255,255,0.08)",
                color: totalItems > 0 ? S.oscuro : S.texto,
                border: "none", borderRadius: 8, padding: "10px 20px",
                cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 700,
                display: "flex", alignItems: "center", gap: "0.5rem"
              }}
            >
              🛒
              {totalItems > 0 && (
                <span style={{
                  background: S.oscuro, color: S.naranja, borderRadius: "50%",
                  width: 22, height: 22, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "0.75rem", fontWeight: 800
                }}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* ── LINKS MÓVIL: solo carrito ── */}
          <div className="nav-mobile" style={{ alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={() => setCarritoAbierto(true)}
              className={totalItems > 0 ? "pulse" : ""}
              style={{
                background: totalItems > 0 ? S.naranja : "rgba(255,255,255,0.08)",
                color: totalItems > 0 ? S.oscuro : S.texto,
                border: "none", borderRadius: 8, padding: "10px 16px",
                cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 700,
                display: "flex", alignItems: "center", gap: "0.5rem"
              }}
            >
              🛒
              {totalItems > 0 && (
                <span style={{
                  background: S.oscuro, color: S.naranja, borderRadius: "50%",
                  width: 22, height: 22, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "0.75rem", fontWeight: 800
                }}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* ══════════════════════════════════
            PÁGINAS
           ══════════════════════════════════ */}
        {(pagina === "pedidos" || pagina === "admin") ? (
          <PaginaPedidos vista={pagina === "admin" ? "admin" : "cliente"} codigoInicial={pedidoConfirmadoId} />
        ) : (
          <>
            {/* HERO */}
            <section style={{ minHeight: "100vh", background: "linear-gradient(to bottom, rgba(17,16,9,0.55) 0%, rgba(17,16,9,0.88) 60%, #111009 100%), url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=80') center/cover no-repeat", display: "flex", alignItems: "center", padding: "100px 2rem 4rem" }}>
              <div style={{ maxWidth: 700, margin: "0 auto 0 5vw" }} className="fade-up">
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 100, padding: "6px 16px", marginBottom: "1.5rem", fontSize: "0.8rem", color: S.naranja, fontWeight: 700, fontFamily: "'Nunito',sans-serif" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: S.naranja, display: "inline-block" }} /> 🔥 PARRILLA ENCENDIDA · 100% MAÍZ
                </div>
                <h1 className="hero-titulo" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(4rem, 9vw, 7rem)", lineHeight: 0.95, marginBottom: "1.5rem", letterSpacing: "0.02em" }}>
                  Puro <span style={{ color: S.naranja }}>queso,</span><br />pura <span style={{ color: S.rojo }}>candela.</span>
                </h1>
                <p style={{ fontSize: "1.1rem", color: S.textoSub, maxWidth: 480, lineHeight: 1.7, marginBottom: "2.5rem", fontFamily: "'Nunito', sans-serif" }}>
                  Las <strong style={{ color: S.texto }}>Rellenitas XD</strong> que te hacen manchar los dedos. Masa tostadita, carnes jugosas y queso que estira hasta el techo.
                </p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <button className="btn-naranja" onClick={() => document.getElementById("menu").scrollIntoView({ behavior: "smooth" })}>Pedir Ahora →</button>
                  <button className="btn-outline" onClick={() => setPagina("pedidos")}>🔍 Rastrear mi pedido</button>
                </div>
              </div>
            </section>

            {/* 3 PASOS */}
            <section style={{ background: "rgba(26,21,8,0.97)", padding: "5rem 2rem" }}>
              <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.5rem,5vw,3.5rem)", marginBottom: "0.5rem" }}>Pide en <span style={{ color: S.naranja }}>3 simples pasos</span></h2>
                <p style={{ color: S.textoSub, marginBottom: "3rem", fontFamily: "'Nunito',sans-serif" }}>Selecciona, personaliza con adiciones y confirma tu pedido.</p>
                <div className="pasos-grid" style={{ display: "flex", gap: "1.5rem", justifyContent: "center" }}>
                  {pasos.map((p, i) => (
                    <div key={p.num} style={{ flex: 1, maxWidth: 260, position: "relative" }}>
                      {i < pasos.length - 1 && <div className="paso-linea" style={{ position: "absolute", top: 30, left: "calc(50% + 35px)", width: "calc(100% - 70px)", height: 2, background: `linear-gradient(to right, ${S.naranja}, rgba(245,166,35,0.2))`, zIndex: 0 }} />}
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ width: 60, height: 60, borderRadius: 14, margin: "0 auto 1rem", background: i === 2 ? "#1a3a2a" : S.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", border: `1px solid ${i === 2 ? "#25d366" : "rgba(245,166,35,0.2)"}`, position: "relative" }}>
                          {p.emoji}
                          <span style={{ position: "absolute", top: -8, right: -8, background: i === 2 ? S.verde : S.naranja, color: S.oscuro, width: 20, height: 20, borderRadius: "50%", fontSize: "0.7rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito',sans-serif" }}>{p.num}</span>
                        </div>
                        <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, marginBottom: "0.5rem" }}>{p.titulo}</h3>
                        <p style={{ color: S.textoSub, fontSize: "0.88rem", lineHeight: 1.6, fontFamily: "'Nunito',sans-serif" }}>{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* MENÚ */}
            <section id="menu" style={{ padding: "5rem 2rem", background: "rgba(17,16,9,0.97)" }}>
              <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                <div style={{ marginBottom: "4rem" }}>
                  <SeccionHeader emoji="🥟" bg="rgba(224,62,45,0.15)" border="1px solid rgba(224,62,45,0.35)" titulo="Entradas" sub="Para abrir el apetito." />
                  <div className="grid-2" style={{ maxWidth: 680 }}>{entradas.map(item => <ItemCard key={item.id} item={item} accentColor={S.rojo} onAgregar={agregar} showOpcionesModal={item.opciones ? setModalOpcionesItem : null} />)}</div>
                </div>
                <div style={{ marginBottom: "4rem" }}>
                  <SeccionHeader emoji="🌽" bg="rgba(245,166,35,0.15)" border="1px solid rgba(245,166,35,0.35)" titulo="Nuestras Arepas" sub="Crujientes por fuera, una locura por dentro. Personalízalas con adiciones." />
                  <div className="grid-3">{arepas.map(item => <ItemCard key={item.id} item={item} accentColor={S.naranja} showAdicionesModal={setModalItem} />)}</div>
                </div>
                <div style={{ marginBottom: "4rem" }}>
                  <SeccionHeader emoji="🏆" bg="rgba(168,85,247,0.15)" border="1px solid rgba(168,85,247,0.35)" titulo="Otros Platos" sub="Para los que quieren más." />
                  <div className="grid-2" style={{ maxWidth: 680 }}>{otrosPlatos.map(item => <ItemCard key={item.id} item={item} accentColor="#a855f7" onAgregar={agregar} />)}</div>
                </div>
                <div style={{ marginBottom: "4rem" }}>
                  <SeccionHeader emoji="🥤" bg="rgba(59,130,246,0.15)" border="1px solid rgba(59,130,246,0.35)" titulo="Para Acompañar" sub="Los jugos vienen en: Mora, Maracuyá, Mango, Mandarina o Lulo." />
                  <div className="grid-4">{bebidas.map(item => <ItemCard key={item.id} item={item} accentColor="#3b82f6" showSaborModal={item.tieneSabor ? setModalSaborItem : null} onAgregar={agregar} />)}</div>
                </div>
                <div style={{ background: "rgba(26,21,8,0.95)", borderRadius: 20, border: "1px solid rgba(245,166,35,0.12)", padding: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>➕</div>
                    <div>
                      <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.8rem", lineHeight: 1 }}>Adiciones Disponibles</h2>
                      <p style={{ color: S.textoSub, fontFamily: "'Nunito',sans-serif", fontSize: "0.82rem" }}>Se seleccionan al agregar cualquier arepa al carrito.</p>
                    </div>
                  </div>
                  <div className="adiciones-grid">
                    {adiciones.map(ad => (
                      <div key={ad.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "0.75rem", textAlign: "center" }}>
                        <div style={{ fontSize: "1.4rem", marginBottom: "0.35rem" }}>{ad.emoji}</div>
                        <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.75rem", lineHeight: 1.3, color: "rgba(255,255,255,0.85)", marginBottom: "0.3rem" }}>{ad.nombre}</div>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.95rem", color: S.naranja }}>+ $ {ad.precio.toLocaleString("es-CO")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer id="footer" style={{ background: "rgba(13,12,6,0.98)", borderTop: "1px solid rgba(245,166,35,0.1)", padding: "4rem 2rem 2rem" }}>
              <div className="footer-grid" style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: "4rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                    <LogoSVG size={48} id="footer-logo" />
                    <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.2rem" }}>Rellenitas XD</span>
                  </div>
                  <p style={{ color: S.textoSub, fontSize: "0.9rem", lineHeight: 1.7, fontFamily: "'Nunito',sans-serif" }}>Las mejores arepas rellenas. Si no te manchas los dedos, no cuenta.</p>
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <h4 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: S.naranja, marginBottom: "1.2rem" }}>📍 VISÍTANOS</h4>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.2rem" }}>
                    <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, marginBottom: "0.4rem" }}>Sede Principal</p>
                    <p style={{ color: S.textoSub, fontSize: "0.88rem", fontFamily: "'Nunito',sans-serif" }}>Calle 17 # 7-28, Soacha Centro</p>
                    <div style={{ marginTop: "0.8rem", background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 8, padding: "8px 12px", fontSize: "0.82rem", color: S.naranja, fontFamily: "'Nunito',sans-serif", fontWeight: 600 }}>⏰ Dom–Dom | 07:00 – 22:30</div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <h4 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: S.naranja, marginBottom: "1.2rem" }}>📞 DOMICILIOS</h4>
                  <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: S.verde, color: "white", borderRadius: 10, padding: "12px 18px", textDecoration: "none", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>
                    💬 WhatsApp +57 3103830424
                  </a>
                </div>
              </div>
              <div style={{ maxWidth: 1100, margin: "3rem auto 0", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <span style={{ color: S.textoSub, fontSize: "0.82rem", fontFamily: "'Nunito',sans-serif" }}>© 2026 Rellenitas XD. Todos los derechos reservados.</span>
                <span style={{ color: S.textoSub, fontSize: "0.82rem", fontFamily: "'Nunito',sans-serif" }}>Hecho con ❤️ y mucho queso.</span>
              </div>
            </footer>
          </>
        )}

        {/* ══════════════════════════════════
            MODALES
           ══════════════════════════════════ */}
        {modalSaborItem && <ModalSabor item={modalSaborItem} onConfirm={confirmarSabor} onClose={() => setModalSaborItem(null)} />}
        {modalItem && <ModalAdiciones item={modalItem} onConfirm={agregarConAdiciones} onClose={() => setModalItem(null)} />}
        {modalOpcionesItem && <ModalOpciones item={modalOpcionesItem} onConfirm={confirmarOpciones} onClose={() => setModalOpcionesItem(null)} />}
        {modalConfirmar && (
          <ModalConfirmarPedido
            carrito={carrito}
            total={total}
            onConfirmar={onPedidoConfirmado}
            onClose={() => { setModalConfirmar(false); if (pedidoConfirmadoId) irAPedidos(); }}
          />
        )}

        {/* ══════════════════════════════════
            CARRITO (panel lateral)
           ══════════════════════════════════ */}
        {carritoAbierto && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
            <div onClick={() => setCarritoAbierto(false)} style={{ flex: 1, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
            <div style={{ width: 400, background: "#1e1a10", borderLeft: "1px solid rgba(245,166,35,0.2)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.8rem", letterSpacing: "0.05em" }}>Tu Carrito 🛒</h3>
                <button onClick={() => setCarritoAbierto(false)} style={{ background: "none", border: "none", color: S.textoSub, fontSize: "1.5rem", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
                {carrito.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem 1rem", color: S.textoSub, fontFamily: "'Nunito',sans-serif" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}><LogoSVG size={64} id="cart-empty" opacity={0.25} /></div>
                    <p>Tu carrito está vacío.<br />¡Agrega unas rellenitas!<br /><br />
                      <span style={{ fontSize: "14px", fontWeight: "bold" }}>⚠️ Si ya pediste, ve a Rastrear mi pedido y pon tu nombre. ⚠️</span>
                    </p>
                  </div>
                ) : carrito.map(item => (
                  <div key={item._key} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "1rem", marginBottom: "0.5rem", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: "1.6rem", marginTop: "2px" }}>{item.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.88rem" }}>{item.nombre}</div>
                      {item.adiciones && item.adiciones.length > 0 && (
                        <div style={{ color: S.naranja, fontSize: "0.72rem", fontFamily: "'Nunito',sans-serif", marginTop: "0.2rem", opacity: 0.85 }}>+ {item.adiciones.map(a => a.nombre).join(", ")}</div>
                      )}
                      <div style={{ color: S.naranja, fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.05rem", marginTop: "0.2rem" }}>$ {(item.precio * item.qty).toLocaleString("es-CO")}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                      <button onClick={() => quitar(item._key)} style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", color: "white", cursor: "pointer", fontSize: "1rem" }}>−</button>
                      <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, minWidth: 16, textAlign: "center", fontSize: "0.9rem" }}>{item.qty}</span>
                      <button onClick={() => agregar(item)} style={{ width: 26, height: 26, borderRadius: "50%", background: S.naranja, border: "none", color: S.oscuro, cursor: "pointer", fontSize: "1rem", fontWeight: 700 }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              {carrito.length > 0 && (
                <div style={{ padding: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontFamily: "'Nunito',sans-serif" }}>
                    <span style={{ color: S.textoSub }}>Total</span>
                    <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.5rem", color: S.naranja }}>$ {total.toLocaleString("es-CO")}</span>
                  </div>
                  <button
                    className="btn-naranja"
                    onClick={() => { setCarritoAbierto(false); setModalConfirmar(true); }}
                    style={{ width: "100%", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                  >
                    ✅ Confirmar Pedido
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}