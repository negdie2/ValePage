import { useState } from "react";

function App() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

      setMsg("Respuesta guardada correctamente ");
    } catch (err) {
      setMsg("Error al enviar la respuesta ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <p>xxxxx</p>

      <button
        onClick={() => enviarRespuesta("yes")}
        disabled={loading}
        style={{ marginRight: "10px" }}
      >
        Yes
      </button>

      <button onClick={() => enviarRespuesta("no")} disabled={loading}>
        No
      </button>

      {msg && <p>{msg}</p>}
    </div>
  );
}

export default App;
