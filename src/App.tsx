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

  // --- NUEVO: contador de escapes y popup de imágenes ---
  // >>> CAMBIO MÍNIMO: ahora ESCAPE_THRESHOLD es estado para poder ajustarlo en mobile
  const [ESCAPE_THRESHOLD, setEscapeThreshold] = useState<number>(
    window.innerWidth <= 520 ? 15 : 30,
  );

  const imagePaths = [
    "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcT_-bMBrCvjJEJIElcdHgvlvp7fnH5lxUo0wsPGbnhf4y0DYiS5",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4GrI7kVfq7hVvAJlW2czaRzXX-G2Q0HcqaA&s",
    "https://i.pinimg.com/736x/90/80/59/90805915f0a1616ead4af48975d04378.jpg",
  ];
  const captions = ["", "", ""]; //test

  const [imgIdx, setImgIdx] = useState<number>(0); // para render
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [, setEscapeCount] = useState<number>(0);
  const popupTimerRef = useRef<number | null>(null); // para controlar el timeout del popup

  // --- Nuevo: popup persistente que aparece al presionar YES ---
  const yesPopupImage =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrAvagfS-VpALOhOYqU32Hac3tFNOuxCVMyw&s";
  const [showYesPopup, setShowYesPopup] = useState<boolean>(false);

  // estado para controlar la posición inicial del botón YES
  const [yesLeft, setYesLeft] = useState<string>("calc(50% - 160px)");

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

      // si es "yes", mostrar el popup persistente adicional
      if (respuesta === "yes") {
        setMsg("Respuesta guardada correctamente 💌");
        setShowYesPopup(true);
      }
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

      // si es pantalla pequeña, centramos y acercamos botones y ajustamos el threshold
      if (window.innerWidth <= 520) {
        setYesLeft("calc(50% - 110px)");
        const noLeftNum = Math.round(
          rect.width * 0.5 - btn.offsetWidth / 2 + 30,
        );
        setNoPos({ left: Math.max(8, noLeftNum), top: Math.max(6, top) });
        setEscapeThreshold(15); // <<< cambio mínimo: threshold más bajo en mobile
      } else {
        // comportamiento normal en desktop
        setYesLeft("calc(50% - 160px)");
        setNoPos({ left: Math.max(8, left), top: Math.max(6, top) });
        setEscapeThreshold(30);
      }
    };
    setInitial();
    window.addEventListener("resize", setInitial);
    return () => window.removeEventListener("resize", setInitial);
  }, []);

  // helper: manejar incremento de contador y mostrar popup cuando corresponda
  const handleEscapeIncrement = () => {
    setEscapeCount((prev) => {
      const next = prev + 1;

      if (next >= ESCAPE_THRESHOLD) {
        // si ya hay un popup en curso, no iniciar otro
        if (popupTimerRef.current !== null) {
          return 0;
        }

        // ENVIAR POST con respuesta "no" cada vez que se alcance el threshold
        // usamos la función existente; no hacemos await para no bloquear la UI
        void enviarRespuesta("no");

        // mostrar imagen actual
        setShowPopup(true);

        // programar ocultado y avanzar índice después de 5s
        popupTimerRef.current = window.setTimeout(() => {
          setShowPopup(false);
          setImgIdx((prevIdx) => (prevIdx + 1) % imagePaths.length);
          // liberar el timer ref
          popupTimerRef.current = null;
        }, 3000);

        return 0; // reset contador
      }
      return next;
    });
  };

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
      // NUEVO: contar este escape
      handleEscapeIncrement();
      return;
    }

    const leftCard = Math.round(margin + Math.random() * maxLeftCard);
    const topCard = Math.round(margin + Math.random() * maxTopCard);

    const leftRelativeToBA = Math.round(
      leftCard - (baRect.left - cardRect.left),
    );
    const topRelativeToBA = Math.round(topCard - (baRect.top - cardRect.top));

    setNoPos({ left: leftRelativeToBA, top: topRelativeToBA });
    // NUEVO: contar este escape
    handleEscapeIncrement();
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

  // limpieza del timeout del popup al desmontar
  useEffect(() => {
    return () => {
      if (popupTimerRef.current !== null) {
        clearTimeout(popupTimerRef.current);
        popupTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{ minHeight: "100vh", fontFamily: "'Poppins', Arial, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
        /* volver a la paleta morada */
        .bg {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(closest-side at 10% 10%, #d6b3ff, transparent 20%),
                      linear-gradient(135deg, #d6b3ff 0%, #d6b3ff 30%, #7a4dbd 100%);
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
          background: rgba(255,255,255,0.9);
          border-radius: 22px;
          box-shadow: 0 12px 40px rgba(122,77,189,0.12);
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
          color: #4b0f5a;
          text-shadow: 0 1px 0 rgba(255,255,255,0.6);
        }
        .subtitle {
          text-align: center;
          font-size: 18px;
          margin-bottom: 28px;
          color: #5a2a61;
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
          background: linear-gradient(180deg,#b76bff,#6b2abf);
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
          background: linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0.78));
          box-shadow: 0 6px 18px rgba(122,77,189,0.06);
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
          background: linear-gradient(90deg,#a463ff,#6c2bd6);
          color: white;
        }
        .btn-no {
          background: linear-gradient(90deg,#fbf3ff,#f5e8ff);
          color: #5a2a61;
          border: 1px solid rgba(90,42,97,0.06);
          -webkit-tap-highlight-color: transparent;
          -webkit-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          outline: none;
          transform: none !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.08);
        }
        .btn-no:active, .btn-no:focus, .btn-no:focus-visible {
          transform: none !important;
          outline: none !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.08) !important;
          background: linear-gradient(90deg,#fbf3ff,#f5e8ff) !important;
          color: #5a2a61 !important;
        }
        .btn[disabled] { opacity: 0.6; cursor: default; transform: none; }

        /* Estilos para popup de imagen */
        .popup-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(60,10,80,0.45);
          z-index: 2000;
          padding: 20px;
          box-sizing: border-box;
        }

        /* Wrapper con altura fija relativa a viewport: todas las imágenes tendrán la misma altura */
        .popup-img-wrapper {
          height: min(520px, 72vh); /* todas las imágenes tendrán esta altura (responsive) */
          width: auto; /* ancho automático según la proporción (se ajustará a cada imagen) */
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 12px;
          background: transparent; /* <-- fondo removido (antes #111) */
          padding: 6px; /* pequeño padding para separarlas del fondo */
          box-sizing: border-box;
        }

        /* El img tendrá el 60% de la altura del wrapper (aprox 60% del tamaño actual) */
        .popup-img {
          height: 60%;
          width: auto;
          object-fit: contain; /* mostrar completa, sin recortar */
          display: block;
          border-radius: 6px;
        }

        .popup-caption {
          margin-top: 12px;
          color: #fff;
          font-weight: 700;
          font-size: 18px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
          text-align: center;
        }

        .msg { text-align:center; margin-top: 16px; color:#5a2a61; font-weight:600; }
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

              <h1 className="title">Valeeee</h1>
              <p className="subtitle">
                Me encantaría que nos veamos el 14... pero se que es imposible
                entonces pensaba que podíamos vernos el viernes y fingir que es
                14 jajaja
              </p>

              <div className="panel">
                <div
                  className="cta"
                  role="region"
                  aria-label="Tarjeta de San Valentín"
                >
                  <div style={{ fontSize: 16, color: "#5a2a61" }}>
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
                        left: yesLeft,
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

      {/* Popup de imagen: aparece por 5s cada que se alcanza el threshold */}
      {showPopup && (
        <div className="popup-overlay" role="dialog" aria-modal="true">
          <div className="popup-img-wrapper">
            <img
              key={imgIdx}
              src={imagePaths[imgIdx]}
              alt={`popup-${imgIdx}`}
              className="popup-img"
            />
          </div>
          <div className="popup-caption">{captions[imgIdx] ?? ""}</div>
        </div>
      )}

      {/* Popup persistente que aparece al presionar YES (no desaparece automáticamente) */}
      {showYesPopup && (
        <div className="popup-overlay" role="dialog" aria-modal="true">
          <div className="popup-img-wrapper">
            <img src={yesPopupImage} alt="yes-popup" className="popup-img" />
          </div>
          <div className="popup-caption">sabia que dirias que si 😉</div>
        </div>
      )}
    </div>
  );
}

export default App;
