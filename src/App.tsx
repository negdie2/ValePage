import React, { useEffect, useRef, useState } from "react";

function App() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonsAreaRef = useRef<HTMLDivElement | null>(null);
  // NOTE: ahora es HTMLDivElement porque NO es un <button> real
  const noBtnRef = useRef<HTMLDivElement | null>(null);

  // Posición del botón "No" (en px relativos al área de botones)
  const [noPos, setNoPos] = useState<{ left: number; top: number } | null>(
    null,
  );

  const enviarRespuesta = async (respuesta: "yes" | "no") => {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(
        "https://valentinespagebackend-production.up.railway.app/api/respuestas",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            respuestas: respuesta,
            comentarios: null,
          }),
        },
      );

      if (!res.ok) {
        throw new Error("Error al guardar");
      }

      setMsg("Respuesta guardada correctamente 💌");
    } catch (err) {
      setMsg("Error al enviar la respuesta ❌");
    } finally {
      setLoading(false);
    }
  };

  // Posicionar inicialmente botones (centrado dentro de buttons-area)
  useEffect(() => {
    const setInitial = () => {
      const ba = buttonsAreaRef.current;
      const btn = noBtnRef.current;
      if (!ba || !btn) return;
      const rect = ba.getBoundingClientRect();

      // colocar "No" a la derecha dentro del área de botones
      const left = Math.round(rect.width * 0.65 - btn.offsetWidth / 2);
      const top = Math.round(rect.height * 0.25); // un poco abajo dentro del área
      // clamp por seguridad para que nunca quede fuera
      const margin = 8;
      const maxLeft = Math.max(0, rect.width - btn.offsetWidth - margin);
      const finalLeft = Math.min(Math.max(margin, left), maxLeft);
      setNoPos({ left: Math.max(8, finalLeft), top: Math.max(6, top) });
    };
    setInitial();
    window.addEventListener("resize", setInitial);
    return () => window.removeEventListener("resize", setInitial);
  }, []);

  /**
   * Mueve el botón "No".
   * Si se pasan clientX/clientY (coordenadas del cursor en ventana),
   * elige la posición dentro del área que maximice la distancia al cursor.
   * Si no, usa una posición aleatoria.
   */
  const moveNoButton = (clientX?: number, clientY?: number) => {
    const ba = buttonsAreaRef.current;
    const btn = noBtnRef.current;
    if (!ba || !btn) return;
    const areaRect = ba.getBoundingClientRect();
    const margin = 10;
    const btnW = btn.offsetWidth;
    const btnH = btn.offsetHeight;
    // maxLeft/maxTop *relativos a la caja* (ya restamos el tamaño del botón)
    const maxLeft = Math.max(0, areaRect.width - btnW - margin * 2);
    const maxTop = Math.max(0, areaRect.height - btnH - margin * 2);

    // Si tenemos coords del cursor, creamos candidatos y escogemos el que esté más lejos del cursor
    if (typeof clientX === "number" && typeof clientY === "number") {
      const candidates: { left: number; top: number }[] = [];

      // posiciones en una grilla (esquinas + intermedias)
      for (let i = 0; i <= 4; i++) {
        for (let j = 0; j <= 2; j++) {
          const left = Math.round(margin + (i / 4) * maxLeft);
          const top = Math.round(margin + (j / 2) * maxTop);
          candidates.push({ left, top });
        }
      }

      // algunas posiciones aleatorias para variedad
      for (let k = 0; k < 8; k++) {
        candidates.push({
          left: Math.round(margin + Math.random() * maxLeft),
          top: Math.round(margin + Math.random() * maxTop),
        });
      }

      // convertir client coords a coords relativas al área (centro del posible botón)
      const toWindowCoords = (cand: { left: number; top: number }) => {
        return {
          x: areaRect.left + cand.left + btnW / 2,
          y: areaRect.top + cand.top + btnH / 2,
        };
      };

      // escoger candidato que maximice distancia al cursor
      let best = candidates[0];
      let bestDist = -1;
      for (const c of candidates) {
        const p = toWindowCoords(c);
        const dx = p.x - clientX;
        const dy = p.y - clientY;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > bestDist) {
          bestDist = d;
          best = c;
        }
      }

      // clamp final (por seguridad)
      const finalLeft = Math.min(Math.max(margin, best.left), maxLeft + margin);
      const finalTop = Math.min(Math.max(margin, best.top), maxTop + margin);

      setNoPos({ left: finalLeft, top: finalTop });
      return;
    }

    // si no hay coords, posición aleatoria (fallback)
    const left = Math.round(margin + Math.random() * maxLeft);
    const top = Math.round(margin + Math.random() * maxTop);
    setNoPos({ left, top });
  };

  // Detectar proximidad del mouse al botón "No" (usando coords relativas al área de botones)
  // (seguimos manteniendo la detección global por si el cursor se acerca desde otras zonas)
  const handleMouseMove = (e: React.MouseEvent) => {
    const ba = buttonsAreaRef.current;
    const btn = noBtnRef.current;
    if (!ba || !btn) return;
    const baRect = ba.getBoundingClientRect();

    // centro del botón NO (en coordenadas de ventana)
    const bx =
      baRect.left + (noPos ? noPos.left : btn.offsetLeft) + btn.offsetWidth / 2;
    const by =
      baRect.top + (noPos ? noPos.top : btn.offsetTop) + btn.offsetHeight / 2;
    const dx = e.clientX - bx;
    const dy = e.clientY - by;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // umbral; si está muy cerca, movemos (esto ayuda si el cursor viene desde lejos)
    const THRESHOLD = 120;
    if (dist < THRESHOLD) {
      // pasar coords para maximizar distancia
      moveNoButton(e.clientX, e.clientY);
    }
  };

  // Eventos touch: mover botón si el dedo se acerca (pasamos coords para maximizar distancia)
  useEffect(() => {
    const onTouch = (ev: TouchEvent) => {
      const touch = ev.touches[0];
      if (!touch) return;
      moveNoButton(touch.clientX, touch.clientY);
    };
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return (
    <div
      style={{ minHeight: "100vh", fontFamily: "'Poppins', Arial, sans-serif" }}
    >
      {/* Estilos locales */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');

        .bg {
          /* mantengo el fondo que ya tenías */
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(closest-side at 10% 10%, #fff0f6, transparent 20%),
                      linear-gradient(135deg, #ffe6f0 0%, #ffd1e8 30%, #ff9cc0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .card {
          width: 100%;
          max-width: 920px;
          background: rgba(255,255,255,0.85);
          border-radius: 22px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
          padding: 44px 36px;
          position: relative;
          overflow: hidden;
        }

        .title {
          text-align: center;
          font-size: 38px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 6px 0 8px;
          color: #9a0839;
          text-shadow: 0 1px 0 rgba(255,255,255,0.6);
        }

        .subtitle {
          text-align: center;
          font-size: 18px;
          margin-bottom: 28px;
          color: #6b1630;
          opacity: 0.9;
        }

        .heart-row {
          display:flex; gap:10px; justify-content:center; margin-bottom: 20px;
        }

        .heart {
          width: 24px; height: 24px; transform: rotate(-45deg);
          position: relative;
        }
        .heart:before, .heart:after {
          content: "";
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(180deg,#ff5d8f,#ff2d6f);
          position: absolute;
        }
        .heart:before { top: -12px; left: 0; }
        .heart:after { left: 12px; top: 0; }

        .panel {
          position: relative;
          height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cta {
          width: 560px;
          max-width: 95%;
          text-align: center;
          padding: 28px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.4));
          box-shadow: 0 6px 18px rgba(155,10,60,0.08);
        }

        /* --- CAMBIO: hacemos el box de botones un poco más alto en móvil --- */
        .buttons-area {
          position: relative;
          height: 110px; /* original */
          margin-top: 18px;
        }

        @media (max-width: 520px) {
          .buttons-area {
            height: 150px; /* un poco más de espacio en móvil */
          }

          .cta {
            padding: 22px;
          }
        }
        /* --------------------------------------------------------------- */

        .btn {
          padding: 12px 22px;
          border-radius: 999px;
          border: none;
          font-weight: 700;
          cursor: pointer;
          font-size: 16px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
          transition: transform 220ms ease, box-shadow 220ms ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .btn:active { transform: scale(0.97); }

        .btn-yes {
          background: linear-gradient(90deg,#ff6f9a,#ff3e7a);
          color: white;
          /* posicionamiento por defecto: centrado para evitar overflow en móvil */
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          top: 12px;
          min-width: 120px;
        }

        /* NO es ahora un 'falso-botón' (div), con estilos de botón pero sin efectos de focus/presionar) */
        .btn-no {
          background: linear-gradient(90deg,#fff2f7,#ffe7ef);
          color: #8b1330;
          border: 1px solid rgba(139,19,48,0.06);
          position: absolute;
          min-width: 120px;
          /* evitar que el mobile browser muestre color al tocar */
          -webkit-tap-highlight-color: transparent;
          touch-action: none;
        }
        /* quitar cualquier transform en active para la 'falsa' pieza */
        .btn-no:active { transform: none; }
        .btn-no:focus { outline: none; }

        .btn[disabled] { opacity: 0.6; cursor: default; transform: none; }

        .floating-heart {
          position: absolute;
          width: 16px; height: 16px; pointer-events: none;
          transform: rotate(-45deg);
          animation: floatUp 5s linear infinite;
        }
        @keyframes floatUp {
          0% { transform: translateY(20px) scale(0.8) rotate(-45deg); opacity: 0.95; }
          100% { transform: translateY(-140px) scale(1.05) rotate(-45deg); opacity: 0; }
        }
        .msg { text-align:center; margin-top: 16px; color:#6b1630; font-weight:600; }
      `}</style>

      <div className="bg">
        <div className="card" ref={containerRef} onMouseMove={handleMouseMove}>
          {/* floating little hearts for decoration */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 10,
              opacity: 0.9,
            }}
            aria-hidden
          >
            <div className="heart" />
          </div>

          <div
            style={{
              position: "absolute",
              right: 20,
              bottom: 18,
              opacity: 0.9,
            }}
          >
            <div className="heart" />
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 780 }}>
              <div className="heart-row" aria-hidden>
                <div className="heart" />
                <div
                  className="heart"
                  style={{ transform: "rotate(-45deg) scale(1.1)" }}
                />
                <div className="heart" />
              </div>

              <h1 className="title">¿Serías mi San Valentine?</h1>
              <p className="subtitle">
                Un momento bonito necesita una decisión atrevida 💘
              </p>

              <div className="panel">
                <div
                  className="cta"
                  role="region"
                  aria-label="Tarjeta de San Valentín"
                >
                  <div style={{ fontSize: 16, color: "#6b1630" }}>
                    Haz clic en la respuesta que sientas... si sobrevives al
                    botón travieso 😉
                  </div>

                  <div
                    className="buttons-area"
                    ref={buttonsAreaRef}
                    aria-hidden={false}
                  >
                    {/* Botón YES - fijo (seguimos usando <button> para Yes) */}
                    <button
                      className="btn btn-yes"
                      onClick={() => enviarRespuesta("yes")}
                      disabled={loading}
                      aria-label="Responder sí"
                    >
                      Yes
                    </button>

                    {/* "Falso botón" NO: es un div que solo parece botón */}
                    <div
                      ref={noBtnRef}
                      className="btn btn-no"
                      // movemos en cuanto el cursor entra o se mueve sobre la "falsa pieza"
                      onMouseEnter={(e) => moveNoButton(e.clientX, e.clientY)}
                      onMouseMove={(e) => moveNoButton(e.clientX, e.clientY)}
                      // también para touch (móvil)
                      onTouchStart={(ev) => {
                        const t = ev.touches && ev.touches[0];
                        if (t) moveNoButton(t.clientX, t.clientY);
                      }}
                      role="button"
                      aria-label="Responder no (no clickeable)"
                      style={{
                        left: noPos ? noPos.left : "calc(50% + 40px)",
                        top: noPos ? noPos.top : 12,
                        transition:
                          "left 120ms linear, top 120ms linear, transform 60ms linear",
                      }}
                    >
                      No
                    </div>
                  </div>

                  {msg && <div className="msg">{msg}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* pequeñas partículas / corazones que flotan (decorativas) */}
          <FloatingHearts />
        </div>
      </div>
    </div>
  );
}

/** Pequeño componente que genera corazones flotando (decoración) */
function FloatingHearts() {
  // generar posiciones y retrasos para varios corazones
  const hearts = new Array(8).fill(0).map((_, i) => {
    const left = Math.round(Math.random() * 90);
    const size = 10 + Math.round(Math.random() * 18);
    const delay = Math.random() * 4;
    const duration = 4 + Math.random() * 3;
    return { id: i, left, size, delay, duration };
  });

  return (
    <>
      {hearts.map((h) => (
        <div
          key={h.id}
          className="floating-heart"
          style={{
            left: `${h.left}%`,
            bottom: -10 - Math.random() * 10,
            width: h.size,
            height: h.size,
            background: "linear-gradient(180deg,#ff5d8f,#ff2d6f)",
            borderRadius: "50% 50% 0 0",
            transform: "rotate(-45deg)",
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.duration}s`,
            opacity: 0.95,
            clipPath:
              "polygon(50% 0%, 100% 35%, 80% 100%, 50% 80%, 20% 100%, 0% 35%)",
          }}
        />
      ))}
    </>
  );
}

export default App;
