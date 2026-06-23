import { useState } from "react";
import type { Factura } from "./types";
import { FileUpload } from "./components/FileUpload";
import { FacturaTable } from "./components/FacturaTable";
import { FacturaDetalle } from "./components/FacturaDetalle";
import { Dashboard } from "./components/Dashboard";

type Vista = "facturas" | "dashboard";

function App() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [vista, setVista] = useState<Vista>("facturas");
  const [seleccionada, setSeleccionada] = useState<Factura | null>(null);

  const handleLoaded = (nuevas: Factura[]) => {
    setFacturas((prev) => {
      const existentes = new Set(prev.map((f) => `${f.emisor.rut}-${f.folio}`));
      const sinDuplicados = nuevas.filter((f) => !existentes.has(`${f.emisor.rut}-${f.folio}`));
      return [...prev, ...sinDuplicados];
    });
  };

  const handleClear = () => {
    setFacturas([]);
    setSeleccionada(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Facturas Electrónicas SII</h1>
        {facturas.length > 0 && (
          <button onClick={handleClear} className="text-sm text-gray-500 hover:text-red-600">
            Limpiar todo
          </button>
        )}
      </header>

      <div className="mb-6">
        <FileUpload onLoaded={handleLoaded} />
      </div>

      {facturas.length > 0 && (
        <>
          <nav className="mb-4 flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setVista("facturas")}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                vista === "facturas" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
              }`}
            >
              Facturas
            </button>
            <button
              onClick={() => setVista("dashboard")}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                vista === "dashboard" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
              }`}
            >
              Dashboard
            </button>
          </nav>

          {vista === "facturas" ? (
            <FacturaTable facturas={facturas} onSelect={setSeleccionada} />
          ) : (
            <Dashboard facturas={facturas} />
          )}
        </>
      )}

      {seleccionada && <FacturaDetalle factura={seleccionada} onClose={() => setSeleccionada(null)} />}
    </div>
  );
}

export default App;
