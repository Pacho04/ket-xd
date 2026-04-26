import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";

const S = {
  naranja: "#f5a623",
  oscuro: "#111009",
  oscuro2: "#1a1508",
  card: "#1e1a10",
  texto: "#ffffff",
  textoSub: "rgba(255,255,255,0.55)",
  verde: "#22c55e",
  azul: "#3b82f6",
};

// ── ESTADOS — ahora incluye "en_proceso" y "entregado" ──
const ESTADOS = [
  { key: "recibido",   label: "Recibido",        emoji: "📋", color: "#f5a623", bg: "rgba(245,166,35,0.15)"  },
  { key: "en_proceso", label: "En preparación",  emoji: "👨‍🍳", color: "#3b82f6", bg: "rgba(59,130,246,0.15)"  },
  { key: "listo",      label: "Listo / En camino", emoji: "✅", color: "#22c55e", bg: "rgba(34,197,94,0.15)"  },
  { key: "entregado",  label: "Entregado",        emoji: "🏁", color: "#64748b", bg: "rgba(100,116,139,0.15)" },
];

// Flujo lineal para avanzar estado
const FLUJO = ["recibido", "en_proceso", "listo", "entregado"];

const ADMIN_PASS = "arepa2024admin";

function EstadoBadge({ estado }) {
  const e = ESTADOS.find(e => e.key === estado) || ESTADOS[0];
  return (
    <span style={{
      background: e.bg, color: e.color,
      border: `1px solid ${e.color}`,
      borderRadius: 100, padding: "4px 14px",
      fontSize: "0.78rem", fontWeight: 800,
      fontFamily: "'Nunito',sans-serif",
      display: "inline-flex", alignItems: "center", gap: "0.4rem",
    }}>
      {e.emoji} {e.label}
    </span>
  );
}

// ── MODAL VER COMPROBANTE ──
function VistaComprobante({ url, onClose }) {
  if (!url) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 520, background: "#1e1a10", borderRadius: 20, border: "1px solid rgba(208,0,255,0.4)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "0.95rem", color: "#d000ff" }}>
            📸 Comprobante de pago
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ background: "#000", maxHeight: "70vh", overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={url} alt="Comprobante" style={{ width: "100%", objectFit: "contain" }} />
        </div>
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "0.75rem" }}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{ flex: 1, background: "#d000ff", color: "white", border: "none", borderRadius: 10, padding: "11px", fontFamily: "'Nunito',sans-serif", fontWeight: 800, textAlign: "center", textDecoration: "none", fontSize: "0.9rem" }}
          >
            Abrir en nueva pestaña ↗
          </a>
          <button onClick={onClose} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: 10, padding: "11px", fontFamily: "'Nunito',sans-serif", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TARJETA DE PEDIDO (ADMIN) ──
function TarjetaPedidoAdmin({ pedido, cambiarEstado }) {
  const [verComprobante, setVerComprobante] = useState(false);
  const [cambiando, setCambiando] = useState(false);

  const estadoObj  = ESTADOS.find(e => e.key === pedido.estado) || ESTADOS[0];
  const idxActual  = FLUJO.indexOf(pedido.estado);
  const siguienteKey = idxActual < FLUJO.length - 1 ? FLUJO[idxActual + 1] : null;
  const siguienteObj = siguienteKey ? ESTADOS.find(e => e.key === siguienteKey) : null;

  const avanzar = async () => {
    if (!siguienteKey || cambiando) return;
    setCambiando(true);
    await cambiarEstado(pedido.id, siguienteKey);
    setCambiando(false);
  };

  return (
    <div style={{ background: S.card, borderRadius: 16, border: `1.5px solid ${estadoObj.color}44`, overflow: "hidden" }}>

      {/* ── CABECERA ── */}
      <div style={{ padding: "1.1rem 1.4rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", background: estadoObj.bg }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
            {pedido.numeroPedido && (
              <span style={{ background: "rgba(245,166,35,0.15)", color: S.naranja, border: "1px solid rgba(245,166,35,0.4)", borderRadius: 8, padding: "2px 12px", fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.5rem", letterSpacing: "0.05em" }}>
                #{pedido.numeroPedido}
              </span>
            )}
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.4rem" }}>{pedido.nombre}</span>
            <EstadoBadge estado={pedido.estado} />
          </div>
          <div style={{ fontSize: "0.75rem", color: S.textoSub, fontFamily: "'Nunito',sans-serif" }}>
            {pedido.tipoEntrega === "domicilio" ? `🛵 Domicilio → ${pedido.direccion}` : "🏠 Recoge en tienda"}
          </div>
          {pedido.fechaPedido && (
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", fontFamily: "'Nunito',sans-serif", marginTop: "0.2rem" }}>
              📅 {pedido.fechaPedido}
            </div>
          )}
        </div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.8rem", color: S.naranja }}>
          $ {(pedido.total || 0).toLocaleString("es-CO")}
        </div>
      </div>

      {/* ── ITEMS ── */}
      <div style={{ padding: "1rem 1.4rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {(pedido.items || []).map((item, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "6px 12px", fontSize: "0.82rem", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontWeight: 700 }}>{item.nombre}</span>
              <span style={{ color: S.naranja, fontWeight: 800 }}>x{item.qty}</span>
              {item.adiciones && item.adiciones.length > 0 && (
                <span style={{ color: S.textoSub, fontSize: "0.72rem" }}>+{item.adiciones.length} ad.</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── MÉTODO DE PAGO + COMPROBANTE ── */}
      <div style={{ padding: "0.9rem 1.4rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.75rem", color: S.textoSub }}>Pago:</span>
          <span style={{
            background: pedido.metodoPago === "nequi" ? "rgba(208,0,255,0.15)" : "rgba(34,197,94,0.15)",
            color: pedido.metodoPago === "nequi" ? "#d000ff" : "#22c55e",
            border: `1px solid ${pedido.metodoPago === "nequi" ? "rgba(208,0,255,0.35)" : "rgba(34,197,94,0.35)"}`,
            borderRadius: 100, padding: "3px 12px",
            fontSize: "0.72rem", fontWeight: 800, fontFamily: "'Nunito',sans-serif",
          }}>
            {pedido.metodoPago === "nequi" ? "💜 Nequi" : pedido.metodoPago === "efectivo" ? "💵 Efectivo" : "❓ Sin definir"}
          </span>
        </div>

        {/* Comprobante */}
        {pedido.comprobanteURL ? (
          <button
            onClick={() => setVerComprobante(true)}
            style={{ background: "rgba(208,0,255,0.12)", border: "1px solid rgba(208,0,255,0.4)", color: "#d000ff", borderRadius: 9, padding: "7px 16px", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontSize: "0.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            📸 Ver comprobante
          </button>
        ) : pedido.metodoPago === "nequi" ? (
          <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.75rem", color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "5px 12px" }}>
            ⚠️ Sin comprobante
          </span>
        ) : null}
      </div>

      {/* ── CAMBIAR ESTADO: botón avanzar + selectores manuales ── */}
      <div style={{ padding: "1rem 1.4rem", display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
        {/* Botón principal de avance */}
        {siguienteObj && (
          <button
            onClick={avanzar}
            disabled={cambiando}
            style={{
              background: siguienteObj.color,
              color: "#000",
              border: "none",
              borderRadius: 9,
              padding: "9px 20px",
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 800,
              fontSize: "0.88rem",
              cursor: cambiando ? "not-allowed" : "pointer",
              opacity: cambiando ? 0.6 : 1,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {cambiando ? "⏳ Actualizando..." : `${siguienteObj.emoji} → ${siguienteObj.label}`}
          </button>
        )}

        {/* Separador */}
        <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.2)" }}>|</span>
        <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.72rem", color: S.textoSub }}>Mover a:</span>

        {/* Botones de todos los estados */}
        {ESTADOS.map(e => (
          <button
            key={e.key}
            onClick={() => cambiarEstado(pedido.id, e.key)}
            style={{
              background: pedido.estado === e.key ? e.color : "rgba(255,255,255,0.06)",
              color: pedido.estado === e.key ? "#000" : S.textoSub,
              border: `1px solid ${pedido.estado === e.key ? e.color : "rgba(255,255,255,0.1)"}`,
              borderRadius: 8, padding: "6px 12px",
              fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.75rem",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {e.emoji} {e.label}
          </button>
        ))}
      </div>

      {/* Modal comprobante */}
      {verComprobante && (
        <VistaComprobante url={pedido.comprobanteURL} onClose={() => setVerComprobante(false)} />
      )}
    </div>
  );
}

// ══════════════════════════════════
// VISTA CLIENTE
// ══════════════════════════════════
function VistaCliente({ pedidos, codigoInicial }) {
  const [codigo, setCodigo] = useState(codigoInicial || "");
  const [buscado, setBuscado] = useState(null);
  const [error, setError] = useState(false);

  const buscar = (val) => {
    const q = (val ?? codigo).trim();
    if (!q) { setBuscado(null); setError(false); return; }
    const porId   = pedidos.find(p => p.id === q);
    if (porId)   { setBuscado(porId);   setError(false); return; }
    const porNombre = pedidos.find(p => (p.nombre || "").toLowerCase() === q.toLowerCase());
    if (porNombre) { setBuscado(porNombre); setError(false); }
    else           { setBuscado(null); setError(true); }
  };

  // Auto-buscar si llega código desde el pedido recién confirmado
  useEffect(() => {
    if (codigoInicial && pedidos.length > 0) buscar(codigoInicial);
  }, [codigoInicial, pedidos]);

  // Actualizar en tiempo real
  useEffect(() => {
    if (buscado) {
      const actualizado = pedidos.find(p => p.id === buscado.id);
      if (actualizado) setBuscado(actualizado);
    }
  }, [pedidos]);

  // Índice del estado actual en el flujo CLIENTE (solo 3 pasos)
  const ESTADOS_CLIENTE = ESTADOS.filter(e => e.key !== "entregado");
  const estadoActual = buscado ? ESTADOS_CLIENTE.findIndex(e => e.key === buscado.estado) : -1;
  const pct = estadoActual <= 0 ? "0%" : estadoActual === 1 ? "42%" : "84%";

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2.8rem", marginBottom: "0.5rem" }}>
          Rastrear <span style={{ color: S.naranja }}>Pedido</span>
        </h2>
        <p style={{ color: S.textoSub, fontFamily: "'Nunito',sans-serif", fontSize: "0.9rem" }}>
          Ingresa el nombre con el que hiciste el pedido o el código que recibiste.
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
        <input
          value={codigo}
          onChange={e => { setCodigo(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && buscar()}
          placeholder="Ej: Juan Pérez o tu código de pedido..."
          style={{ flex: 1, background: S.card, border: `1.5px solid ${error ? "#ef4444" : "rgba(245,166,35,0.25)"}`, borderRadius: 10, padding: "13px 16px", color: S.texto, fontFamily: "'Nunito',sans-serif", fontSize: "0.95rem", outline: "none" }}
        />
        <button onClick={() => buscar()} style={{ background: S.naranja, color: S.oscuro, border: "none", borderRadius: 10, padding: "13px 22px", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer" }}>Buscar</button>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "1rem", textAlign: "center", color: "#ef4444", fontFamily: "'Nunito',sans-serif", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          ❌ No encontramos ese pedido. Verifica e intenta de nuevo.
        </div>
      )}

      {buscado && (
        <div style={{ background: S.card, borderRadius: 16, border: "1px solid rgba(245,166,35,0.2)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: S.textoSub, fontFamily: "'Nunito',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.3rem" }}>Pedido de</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.6rem" }}>{buscado.nombre}</div>
              <div style={{ fontSize: "0.75rem", color: S.textoSub, fontFamily: "'Nunito',sans-serif", marginTop: "0.2rem" }}>
                {buscado.tipoEntrega === "domicilio" ? `🛵 Domicilio · ${buscado.direccion}` : "🏠 Recoge en tienda"}
              </div>
            </div>
            <EstadoBadge estado={buscado.estado} />
          </div>

          {/* Barra de progreso */}
          <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
              <div style={{ position: "absolute", top: 20, left: "10%", right: "10%", height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, zIndex: 0 }} />
              <div style={{ position: "absolute", top: 20, left: "10%", height: 3, width: pct, background: `linear-gradient(to right, ${S.naranja}, ${S.verde})`, borderRadius: 2, zIndex: 1, transition: "width 0.8s ease" }} />
              {ESTADOS_CLIENTE.map((e, i) => (
                <div key={e.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", zIndex: 2, flex: 1 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: i <= estadoActual ? e.color : "rgba(255,255,255,0.08)", border: `2px solid ${i <= estadoActual ? e.color : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", transition: "all 0.4s", boxShadow: i === estadoActual ? `0 0 16px ${e.color}66` : "none" }}>
                    {i < estadoActual ? "✓" : e.emoji}
                  </div>
                  <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.72rem", fontWeight: i <= estadoActual ? 800 : 400, color: i <= estadoActual ? e.color : S.textoSub, textAlign: "center", lineHeight: 1.3 }}>{e.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "0.7rem", color: S.textoSub, fontFamily: "'Nunito',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>Tu pedido</div>
            {(buscado.items || []).map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                <div>
                  <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.88rem" }}>{item.nombre} x{item.qty}</div>
                  {item.adiciones && item.adiciones.length > 0 && (
                    <div style={{ fontSize: "0.72rem", color: S.naranja, fontFamily: "'Nunito',sans-serif" }}>+ {item.adiciones.map(a => a.nombre).join(", ")}</div>
                  )}
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem", color: S.naranja }}>$ {(item.precio * item.qty).toLocaleString("es-CO")}</div>
              </div>
            ))}

            {/* Método de pago */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "0.75rem", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, color: S.textoSub }}>Total</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.4rem", color: S.naranja }}>$ {(buscado.total || 0).toLocaleString("es-CO")}</span>
            </div>
            {buscado.metodoPago && (
              <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.75rem", color: S.textoSub }}>
                  {buscado.metodoPago === "nequi" ? "💜 Pagado por Nequi" : "💵 Pago en efectivo"}
                </span>
              </div>
            )}
          </div>

          {/* Banner estado listo */}
          {(buscado.estado === "listo" || buscado.estado === "entregado") && (
            <div style={{ margin: "0 1.5rem 1.5rem", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "1rem", textAlign: "center", color: S.verde, fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>
              {buscado.estado === "entregado"
                ? "🏁 ¡Tu pedido fue entregado! Buen provecho 😋"
                : buscado.tipoEntrega === "domicilio"
                  ? "🛵 ¡Tu pedido ya va en camino!"
                  : "🎉 ¡Tu pedido está listo para recoger!"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════
// VISTA ADMIN
// ══════════════════════════════════
function VistaAdmin({ pedidos }) {
  const [pass, setPass]   = useState("");
  const [ok, setOk]       = useState(false);
  const [error, setError] = useState(false);
  const [filtro, setFiltro] = useState("todos");

  const entrar = () => {
    if (pass === ADMIN_PASS) { setOk(true); setError(false); }
    else setError(true);
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await updateDoc(doc(db, "pedidos", id), { estado: nuevoEstado });
    } catch (e) {
      alert("Error al cambiar estado. Intenta de nuevo.");
    }
  };

  if (!ok) return (
    <div style={{ maxWidth: 380, margin: "4rem auto", padding: "1rem" }}>
      <div style={{ background: S.card, borderRadius: 16, border: "1px solid rgba(245,166,35,0.2)", padding: "2.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔐</div>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2rem", marginBottom: "0.5rem" }}>Panel Admin</h2>
        <p style={{ color: S.textoSub, fontFamily: "'Nunito',sans-serif", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Solo el dueño puede acceder aquí.</p>
        <input
          type="password"
          value={pass}
          onChange={e => { setPass(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && entrar()}
          placeholder="Contraseña"
          style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1.5px solid ${error ? "#ef4444" : "rgba(245,166,35,0.25)"}`, borderRadius: 10, padding: "13px 16px", color: S.texto, fontFamily: "'Nunito',sans-serif", fontSize: "0.95rem", outline: "none", marginBottom: "1rem", textAlign: "center", boxSizing: "border-box" }}
        />
        {error && <p style={{ color: "#ef4444", fontFamily: "'Nunito',sans-serif", fontSize: "0.82rem", marginBottom: "1rem" }}>❌ Contraseña incorrecta</p>}
        <button onClick={entrar} style={{ width: "100%", background: S.naranja, color: S.oscuro, border: "none", borderRadius: 10, padding: "13px", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1rem", cursor: "pointer" }}>Entrar</button>
      </div>
    </div>
  );

  const pedidosFiltrados = filtro === "todos" ? pedidos : pedidos.filter(p => p.estado === filtro);

  // Contadores por estado para los badges del filtro
  const conteos = ESTADOS.reduce((acc, e) => {
    acc[e.key] = pedidos.filter(p => p.estado === e.key).length;
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2.5rem", lineHeight: 1 }}>
            Panel de <span style={{ color: S.naranja }}>Pedidos</span>
          </h2>
          <p style={{ color: S.textoSub, fontFamily: "'Nunito',sans-serif", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} · Actualización en tiempo real 🟢
          </p>
        </div>

        {/* Resumen rápido */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {ESTADOS.map(e => (
            <div key={e.key} style={{ background: e.bg, border: `1px solid ${e.color}44`, borderRadius: 10, padding: "6px 14px", textAlign: "center", minWidth: 80 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.5rem", color: e.color, lineHeight: 1 }}>{conteos[e.key] || 0}</div>
              <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.65rem", color: S.textoSub, marginTop: "0.1rem" }}>{e.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {[{ key: "todos", label: "Todos", emoji: "📊" }, ...ESTADOS].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            style={{ background: filtro === f.key ? S.naranja : "rgba(255,255,255,0.07)", color: filtro === f.key ? S.oscuro : S.textoSub, border: "none", borderRadius: 8, padding: "7px 16px", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            {f.emoji} {f.label}
            {f.key !== "todos" && conteos[f.key] > 0 && (
              <span style={{ background: filtro === f.key ? S.oscuro : "rgba(255,255,255,0.15)", color: filtro === f.key ? S.naranja : "#fff", borderRadius: "50%", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800 }}>
                {conteos[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista de pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: S.textoSub, fontFamily: "'Nunito',sans-serif" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌽</div>
          <p>No hay pedidos {filtro !== "todos" ? `en estado "${filtro}"` : "aún"}.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {pedidosFiltrados.map(pedido => (
            <TarjetaPedidoAdmin
              key={pedido.id}
              pedido={pedido}
              cambiarEstado={cambiarEstado}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════
// EXPORT PRINCIPAL
// ══════════════════════════════════
export default function PaginaPedidos({ vista = "cliente", codigoInicial = null }) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("creadoEn", "desc"));
    const unsub = onSnapshot(q, snap => {
      setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div style={{ background: S.oscuro, minHeight: "100vh", color: S.texto, paddingTop: "80px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
      `}</style>
      {vista === "admin"
        ? <VistaAdmin pedidos={pedidos} />
        : <VistaCliente pedidos={pedidos} codigoInicial={codigoInicial} />
      }
    </div>
  );
}