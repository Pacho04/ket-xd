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
  amarillo: "#f5a623",
};

const ESTADOS = [
  { key: "recibido",   label: "Recibido",          emoji: "📋", color: "#f5a623", bg: "rgba(245,166,35,0.15)"  },
  { key: "preparando", label: "En preparación",    emoji: "👨‍🍳", color: "#3b82f6", bg: "rgba(59,130,246,0.15)"  },
  { key: "listo",      label: "Listo / En camino", emoji: "✅", color: "#22c55e", bg: "rgba(34,197,94,0.15)"   },
];

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

// ── VISTA CLIENTE ──
function VistaCliente({ pedidos }) {
  const [codigo, setCodigo] = useState("");
  const [buscado, setBuscado] = useState(null);
  const [error, setError] = useState(false);

  const buscar = () => {
    const q = codigo.trim();
    if (!q) { setBuscado(null); setError(false); return; }
    const encontradoById = pedidos.find(p => p.id === q);
    if (encontradoById) { setBuscado(encontradoById); setError(false); return; }
    const encontradoByName = pedidos.find(p => (p.nombre || "").toLowerCase() === q.toLowerCase());
    if (encontradoByName) { setBuscado(encontradoByName); setError(false); }
    else { setBuscado(null); setError(true); }
  };

  useEffect(() => {
    if (buscado) {
      const actualizado = pedidos.find(p => p.id === buscado.id);
      if (actualizado) setBuscado(actualizado);
    }
  }, [pedidos]);

  const estadoActual = buscado ? ESTADOS.findIndex(e => e.key === buscado.estado) : -1;

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
          placeholder="Ej: Juan Pérez o abc123xyz..."
          style={{ flex: 1, background: S.card, border: `1.5px solid ${error ? "#ef4444" : "rgba(245,166,35,0.25)"}`, borderRadius: 10, padding: "13px 16px", color: S.texto, fontFamily: "'Nunito',sans-serif", fontSize: "0.95rem", outline: "none" }}
        />
        <button onClick={buscar} style={{ background: S.naranja, color: S.oscuro, border: "none", borderRadius: 10, padding: "13px 22px", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer" }}>Buscar</button>
      </div>
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "1rem", textAlign: "center", color: "#ef4444", fontFamily: "'Nunito',sans-serif", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          ❌ No encontramos ese código. Verifica e intenta de nuevo.
        </div>
      )}
      {buscado && (
        <div style={{ background: S.card, borderRadius: 16, border: "1px solid rgba(245,166,35,0.2)", overflow: "hidden" }}>
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
          <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
              <div style={{ position: "absolute", top: 20, left: "10%", right: "10%", height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, zIndex: 0 }} />
              <div style={{ position: "absolute", top: 20, left: "10%", height: 3, width: estadoActual === 0 ? "0%" : estadoActual === 1 ? "40%" : "80%", background: `linear-gradient(to right, ${S.naranja}, ${S.verde})`, borderRadius: 2, zIndex: 1, transition: "width 0.8s ease" }} />
              {ESTADOS.map((e, i) => (
                <div key={e.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", zIndex: 2, flex: 1 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: i <= estadoActual ? e.color : "rgba(255,255,255,0.08)", border: `2px solid ${i <= estadoActual ? e.color : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", transition: "all 0.4s", boxShadow: i === estadoActual ? `0 0 16px ${e.color}66` : "none" }}>
                    {i < estadoActual ? "✓" : e.emoji}
                  </div>
                  <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.72rem", fontWeight: i <= estadoActual ? 800 : 400, color: i <= estadoActual ? e.color : S.textoSub, textAlign: "center", lineHeight: 1.3 }}>{e.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "0.7rem", color: S.textoSub, fontFamily: "'Nunito',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>Tu pedido</div>
            {buscado.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span>{item.emoji}</span>
                  <div>
                    <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.88rem" }}>{item.nombre} x{item.qty}</div>
                    {item.adiciones && item.adiciones.length > 0 && (
                      <div style={{ fontSize: "0.72rem", color: S.naranja, fontFamily: "'Nunito',sans-serif" }}>+ {item.adiciones.map(a => a.nombre).join(", ")}</div>
                    )}
                  </div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem", color: S.naranja }}>$ {(item.precio * item.qty).toLocaleString("es-CO")}</div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "1rem", paddingTop: "1rem", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, color: S.textoSub }}>Total</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.4rem", color: S.naranja }}>$ {buscado.total.toLocaleString("es-CO")}</span>
            </div>
          </div>
          {buscado.estado === "listo" && (
            <div style={{ margin: "0 1.5rem 1.5rem", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "1rem", textAlign: "center", color: S.verde, fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>
              {buscado.tipoEntrega === "domicilio" ? "🛵 ¡Tu pedido ya va en camino!" : "🎉 ¡Tu pedido está listo para recoger!"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── VISTA ADMIN ──
function VistaAdmin({ pedidos }) {
  const [pass, setPass] = useState("");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState(false);
  const [filtro, setFiltro] = useState("todos");

  const entrar = () => {
    if (pass === ADMIN_PASS) { setOk(true); setError(false); }
    else { setError(true); }
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
          style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1.5px solid ${error ? "#ef4444" : "rgba(245,166,35,0.25)"}`, borderRadius: 10, padding: "13px 16px", color: S.texto, fontFamily: "'Nunito',sans-serif", fontSize: "0.95rem", outline: "none", marginBottom: "1rem", textAlign: "center" }}
        />
        {error && <p style={{ color: "#ef4444", fontFamily: "'Nunito',sans-serif", fontSize: "0.82rem", marginBottom: "1rem" }}>❌ Contraseña incorrecta</p>}
        <button onClick={entrar} style={{ width: "100%", background: S.naranja, color: S.oscuro, border: "none", borderRadius: 10, padding: "13px", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1rem", cursor: "pointer" }}>Entrar</button>
      </div>
    </div>
  );

  const pedidosFiltrados = filtro === "todos" ? pedidos : pedidos.filter(p => p.estado === filtro);

  const cambiarEstado = async (id, nuevoEstado) => {
    await updateDoc(doc(db, "pedidos", id), { estado: nuevoEstado });
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2.5rem", lineHeight: 1 }}>Panel de <span style={{ color: S.naranja }}>Pedidos</span></h2>
          <p style={{ color: S.textoSub, fontFamily: "'Nunito',sans-serif", fontSize: "0.85rem" }}>{pedidos.length} pedidos en total · Actualización en tiempo real 🟢</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[{ key: "todos", label: "Todos", emoji: "📊" }, ...ESTADOS.map(e => ({ key: e.key, label: e.label, emoji: e.emoji }))].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)} style={{ background: filtro === f.key ? S.naranja : "rgba(255,255,255,0.07)", color: filtro === f.key ? S.oscuro : S.textoSub, border: "none", borderRadius: 8, padding: "7px 14px", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              {f.emoji} {f.label}
            </button>
          ))}
        </div>
      </div>
      {pedidosFiltrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: S.textoSub, fontFamily: "'Nunito',sans-serif" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌽</div>
          <p>No hay pedidos {filtro !== "todos" ? `en estado "${filtro}"` : "aún"}.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {pedidosFiltrados.map(pedido => {
            const estadoObj = ESTADOS.find(e => e.key === pedido.estado) || ESTADOS[0];
            return (
              <div key={pedido.id} style={{ background: S.card, borderRadius: 14, border: `1px solid ${estadoObj.color}33`, overflow: "hidden" }}>
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                      {pedido.numeroPedido && (
                        <span style={{ background: "rgba(245,166,35,0.12)", color: S.naranja, border: "1px solid rgba(245,166,35,0.35)", borderRadius: 8, padding: "2px 14px", fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.6rem", letterSpacing: "0.05em", lineHeight: 1.3 }}>
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
                      <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.22)", fontFamily: "'Nunito',sans-serif", marginTop: "0.25rem" }}>
                        📅 {pedido.fechaPedido}
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.6rem", color: S.naranja }}>
                    $ {pedido.total.toLocaleString("es-CO")}
                  </div>
                </div>
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {pedido.items.map((item, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "6px 12px", fontSize: "0.82rem", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span>{item.emoji}</span>
                        <span style={{ fontWeight: 700 }}>{item.nombre}</span>
                        <span style={{ color: S.naranja, fontWeight: 800 }}>x{item.qty}</span>
                        {item.adiciones && item.adiciones.length > 0 && (
                          <span style={{ color: S.textoSub, fontSize: "0.72rem" }}>+{item.adiciones.length} ad.</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "1rem 1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: "0.75rem", color: S.textoSub, marginRight: "0.5rem" }}>Cambiar estado:</span>
                  {ESTADOS.map(e => (
                    <button key={e.key} onClick={() => cambiarEstado(pedido.id, e.key)} style={{ background: pedido.estado === e.key ? e.color : "rgba(255,255,255,0.06)", color: pedido.estado === e.key ? S.oscuro : S.textoSub, border: `1px solid ${pedido.estado === e.key ? e.color : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "7px 14px", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s" }}>
                      {e.emoji} {e.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── EXPORT PRINCIPAL ──
export default function PaginaPedidos({ vista = "cliente" }) {
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
      {vista === "admin" ? <VistaAdmin pedidos={pedidos} /> : <VistaCliente pedidos={pedidos} />}
    </div>
  );
}
