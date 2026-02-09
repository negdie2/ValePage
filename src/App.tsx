import React, { useEffect, useRef, useState } from "react";

function App() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonsAreaRef = useRef<HTMLDivElement | null>(null);
  const noBtnRef = useRef<HTMLDivElement | null>(null);
  const yesBtnRef = useRef<HTMLButtonElement | null>(null);
  const [noWidth, setNoWidth] = useState<number | null>(null);
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

      if (!res.ok) throw new Error("Error al guardar");

      setMsg("Respuesta guardada correctamente 💌");
    } catch (err) {
      setMsg("Error al enviar la respuesta ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const setInitial = () => {
      const ba = buttonsAreaRef.current;
      const btn = noBtnRef.current;
      const yesBtn = yesBtnRef.current;
      if (!ba || !btn) return;
      const rect = ba.getBoundingClientRect();

      if (yesBtn) setNoWidth(yesBtn.offsetWidth);

      const left = Math.round(rect.width * 0.65 - btn.offsetWidth / 2);
      const top = Math.round(rect.height * 0.25);
      setNoPos({ left: Math.max(8, left), top: Math.max(6, top) });
    };
    setInitial();
    window.addEventListener("resize", setInitial);
    return () => window.removeEventListener("resize", setInitial);
  }, []);

  const moveNoButton = (clientX?: number, clientY?: number) => {
    const ba = buttonsAreaRef.current;
    const btn = noBtnRef.current;
    const card = containerRef.current;
    if (!ba || !btn || !card) return;

    const cardRect = card.getBoundingClientRect();
    const baRect = ba.getBoundingClientRect();
    const margin = 10;
    const btnW = btn.offsetWidth;
    const btnH = btn.offsetHeight;

    const maxLeftCard = Math.max(0, cardRect.width - btnW - margin * 2);
    const maxTopCard = Math.max(0, cardRect.height - btnH - margin * 2);

    const candidates: { leftCard: number; topCard: number }[] = [];
    const GRID_X = 10;
    const GRID_Y = 7;
    for (let i = 0; i <= GRID_X; i++) {
      for (let j = 0; j <= GRID_Y; j++) {
        const leftCard = Math.round(margin + (i / GRID_X) * maxLeftCard);
        const topCard = Math.round(margin + (j / GRID_Y) * maxTopCard);
        candidates.push({ leftCard, topCard });
      }
    }
    const EXTRA = 60;
    for (let k = 0; k < EXTRA; k++) {
      candidates.push({
        leftCard: Math.round(margin + Math.random() * maxLeftCard),
        topCard: Math.round(margin + Math.random() * maxTopCard),
      });
    }

    if (typeof clientX === "number" && typeof clientY === "number") {
      const MIN_DIST = 100;
      const farEnough = candidates.filter((c) => {
        const cx = cardRect.left + c.leftCard + btnW / 2;
        const cy = cardRect.top + c.topCard + btnH / 2;
        const dx = cx - clientX;
        const dy = cy - clientY;
        const d = Math.sqrt(dx * dx + dy * dy);
        return d >= MIN_DIST;
      });

      const pool = farEnough.length > 0 ? farEnough : candidates;
      const pick = pool[Math.floor(Math.random() * pool.length)];

      const leftRelativeToBA = Math.round(
        pick.leftCard - (baRect.left - cardRect.left),
      );
      const topRelativeToBA = Math.round(
        pick.topCard - (baRect.top - cardRect.top),
      );

      setNoPos({ left: leftRelativeToBA, top: topRelativeToBA });
      return;
    }

    const leftCard = Math.round(margin + Math.random() * maxLeftCard);
    const topCard = Math.round(margin + Math.random() * maxTopCard);

    const leftRelativeToBA = Math.round(
      leftCard - (baRect.left - cardRect.left),
    );
    const topRelativeToBA = Math.round(topCard - (baRect.top - cardRect.top));

    setNoPos({ left: leftRelativeToBA, top: topRelativeToBA });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const ba = buttonsAreaRef.current;
    const btn = noBtnRef.current;
    if (!ba || !btn) return;
    const baRect = ba.getBoundingClientRect();

    const bx =
      baRect.left + (noPos ? noPos.left : btn.offsetLeft) + btn.offsetWidth / 2;
    const by =
      baRect.top + (noPos ? noPos.top : btn.offsetTop) + btn.offsetHeight / 2;
    const dx = e.clientX - bx;
    const dy = e.clientY - by;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const THRESHOLD = 120;
    if (dist < THRESHOLD) moveNoButton(e.clientX, e.clientY);
  };

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
        .bg {
          /* volver a la paleta rosada original */
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
        .icon, .heart {
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
        .buttons-area {
          position: relative;
          height: 110px;
          margin-top: 18px;
        }
        .btn {
          padding: 12px 22px;
          border-radius: 999px;
          border: none;
          font-weight: 700;
          cursor: pointer;
          font-size: 16px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
          transition: transform 220ms ease, box-shadow 220ms ease;
          box-sizing: border-box;
        }
        .btn:active:not(.btn-no) { transform: scale(0.97); }
        .btn-yes {
          background: linear-gradient(90deg,#ff6f9a,#ff3e7a);
          color: white;
        }
        .btn-no {
          background: linear-gradient(90deg,#fff2f7,#ffe7ef);
          color: #8b1330;
          border: 1px solid rgba(139,19,48,0.06);
          -webkit-tap-highlight-color: transparent;
          -webkit-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          outline: none;
          transform: none !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }
        .btn-no:active, .btn-no:focus, .btn-no:focus-visible {
          transform: none !important;
          outline: none !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.12) !important;
          background: linear-gradient(90deg,#fff2f7,#ffe7ef) !important;
          color: #8b1330 !important;
        }
        .btn[disabled] { opacity: 0.6; cursor: default; transform: none; }
        .floating-heart {
          position: absolute;
          width: 16px; height: 16px; pointer-events: none;
          transform: rotate(-45deg);
          animation: floatUp 5s linear infinite;
          display: inline-flex; align-items:center; justify-content:center;
          font-size: 14px;
        }
        @keyframes floatUp {
          0% { transform: translateY(20px) scale(0.8) rotate(-45deg); opacity: 0.95; }
          100% { transform: translateY(-140px) scale(1.05) rotate(-45deg); opacity: 0; }
        }
        .msg { text-align:center; margin-top: 16px; color:#6b1630; font-weight:600; }
      `}</style>

      <div className="bg">
        <div className="card" ref={containerRef} onMouseMove={handleMouseMove}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 780 }}>
              <div className="heart-row" aria-hidden>
                <div className="icon">🐱</div>
                <div className="icon" style={{ transform: "scale(1.1)" }}>
                  🍱
                </div>
                <div className="icon">🐱</div>
                <div
                  className="icon"
                  style={{ fontSize: 22, transform: "translateY(1px)" }}
                >
                  🐈‍⬛
                </div>
              </div>

              <h1 className="title">¿San Valentine?</h1>
              <p className="subtitle">
                Se que el 14 no podremos vernos pero... pensaba que podiamos
                fingir que el viernes es 14 👉👈 jeje
              </p>

              <div className="panel">
                <div
                  className="cta"
                  role="region"
                  aria-label="Tarjeta de San Valentín"
                >
                  <div style={{ fontSize: 16, color: "#5a5a62" }}>
                    Que dices? 😉
                  </div>

                  <div
                    className="buttons-area"
                    ref={buttonsAreaRef}
                    aria-hidden={false}
                  >
                    <button
                      ref={yesBtnRef}
                      className="btn btn-yes"
                      onClick={() => enviarRespuesta("yes")}
                      disabled={loading}
                      style={{
                        position: "absolute",
                        left: "calc(50% - 160px)",
                        top: 12,
                        transform: "translateX(-0%)",
                        minWidth: 120,
                      }}
                      aria-label="Responder sí"
                    >
                      Yes
                    </button>

                    <div
                      ref={noBtnRef}
                      className="btn btn-no"
                      onMouseEnter={(e) => moveNoButton(e.clientX, e.clientY)}
                      onMouseMove={(e) => moveNoButton(e.clientX, e.clientY)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        moveNoButton(e.clientX, e.clientY);
                      }}
                      aria-label="Responder no"
                      style={{
                        position: "absolute",
                        width: noWidth ? `${noWidth}px` : undefined,
                        minWidth: 120,
                        left: noPos ? noPos.left : "calc(50% + 40px)",
                        top: noPos ? noPos.top : 12,
                        transition:
                          "left 120ms linear, top 120ms linear, transform 60ms linear",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: loading ? "none" : "auto",
                        userSelect: "none",
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
        </div>
      </div>
    </div>
  );
}

export default App;
