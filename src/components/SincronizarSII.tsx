import { useState } from "react";

export function SincronizarSII() {
  const [rut, setRut] = useState("");
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("enviando");
    setMensaje("");
    try {
      const res = await fetch("/api/sii-sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rut, clave }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEstado("error");
        setMensaje(data.error ?? "Error al sincronizar.");
      } else {
        setEstado("ok");
        setMensaje(data.mensaje ?? "Sincronización completada.");
      }
    } catch {
      setEstado("error");
      setMensaje("No se pudo contactar el servicio de sincronización.");
    } finally {
      // La clave nunca se guarda: se limpia del estado apenas se usa,
      // exitosa o no la solicitud.
      setClave("");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-slate-900">Sincronizar con SII</h3>
      <p className="mb-3 text-xs text-slate-500">
        Tu Clave Tributaria se envía una sola vez al servidor para esta sincronización y no se guarda en este
        navegador ni en nuestra base de datos. Deberás ingresarla nuevamente la próxima vez que quieras sincronizar.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">RUT</label>
          <input
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            placeholder="76146382-9"
            autoComplete="off"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Clave Tributaria</label>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {estado === "enviando" ? "Sincronizando..." : "Sincronizar ahora"}
        </button>
      </form>

      {mensaje && (
        <p className={`mt-3 text-sm ${estado === "error" ? "text-red-600" : "text-slate-600"}`}>{mensaje}</p>
      )}
    </div>
  );
}
