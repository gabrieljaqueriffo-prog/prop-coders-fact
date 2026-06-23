import { useEffect, useState } from "react";
import type { AlertConfig, Cliente, Factura, GestionCobro, LogEntry, MessageTemplate, Usuario } from "./types";
import { PERMISOS_POR_ROL, ROLE_LABEL, facturaId } from "./types";
import { storage } from "./utils/storage";
import { FileUpload } from "./components/FileUpload";
import { FacturaTable } from "./components/FacturaTable";
import { FacturaDetalle } from "./components/FacturaDetalle";
import { Dashboard } from "./components/Dashboard";
import { ClientesView } from "./components/ClientesView";
import { Configuracion } from "./components/Configuracion";
import { Login } from "./components/Login";
import { MessagePreviewModal } from "./components/MessagePreviewModal";
import { Calendario } from "./components/Calendario";

type Vista = "facturas" | "dashboard" | "clientes" | "calendario" | "configuracion";

// Datos de contacto de prueba para autocompletar clientes nuevos en este prototipo sin backend.
const CONTACTO_PRUEBA = {
  email: "gabriel.jaque.riffo@gmail.com",
  whatsapp: "+584125065488",
};

function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(() => storage.loadUsuario());
  const [facturas, setFacturas] = useState<Factura[]>(() => storage.loadFacturas());
  const [clientes, setClientes] = useState<Cliente[]>(() => storage.loadClientes());
  const [gestiones, setGestiones] = useState<GestionCobro[]>(() => storage.loadGestiones());
  const [logs, setLogs] = useState<LogEntry[]>(() => storage.loadLogs());
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => storage.loadTemplates());
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(() => storage.loadAlertConfig());
  const [vista, setVista] = useState<Vista>("facturas");
  const [seleccionada, setSeleccionada] = useState<Factura | null>(null);
  const [previewRapido, setPreviewRapido] = useState<{ factura: Factura; template: MessageTemplate } | null>(null);

  useEffect(() => storage.saveFacturas(facturas), [facturas]);
  useEffect(() => storage.saveClientes(clientes), [clientes]);
  useEffect(() => storage.saveGestiones(gestiones), [gestiones]);
  useEffect(() => storage.saveLogs(logs), [logs]);
  useEffect(() => storage.saveTemplates(templates), [templates]);
  useEffect(() => storage.saveAlertConfig(alertConfig), [alertConfig]);
  useEffect(() => storage.saveUsuario(usuario), [usuario]);

  if (!usuario) {
    return <Login onLogin={setUsuario} />;
  }

  const permisos = PERMISOS_POR_ROL[usuario.role];

  const handleLoaded = (nuevas: Factura[]) => {
    setFacturas((prev) => {
      const existentes = new Set(prev.map(facturaId));
      const sinDuplicados = nuevas.filter((f) => !existentes.has(facturaId(f)));
      return [...prev, ...sinDuplicados];
    });
    setClientes((prev) => {
      const existentes = new Set(prev.map((c) => c.rut));
      const nuevosClientes = nuevas
        .filter((f) => !existentes.has(f.receptor.rut))
        .map((f) => ({
          rut: f.receptor.rut,
          nombre: f.receptor.nombre,
          email: CONTACTO_PRUEBA.email,
          whatsapp: CONTACTO_PRUEBA.whatsapp,
          notas: "Contacto de prueba autocompletado al cargar el XML.",
        }));
      const sinDuplicadosEntreSi = nuevosClientes.filter(
        (c, idx) => nuevosClientes.findIndex((x) => x.rut === c.rut) === idx,
      );
      return [...prev, ...sinDuplicadosEntreSi];
    });
  };

  const handleClear = () => {
    setFacturas([]);
    setSeleccionada(null);
  };

  const handleLogout = () => {
    setUsuario(null);
  };

  const clienteDe = (factura: Factura) => clientes.find((c) => c.rut === factura.receptor.rut);
  const gestionDe = (factura: Factura) => gestiones.find((g) => g.facturaId === facturaId(factura));
  const logsDe = (factura: Factura) => logs.filter((l) => l.facturaId === facturaId(factura));

  const handleUpdateGestion = (gestion: GestionCobro) => {
    setGestiones((prev) => {
      const existe = prev.some((g) => g.facturaId === gestion.facturaId);
      return existe ? prev.map((g) => (g.facturaId === gestion.facturaId ? gestion : g)) : [...prev, gestion];
    });
  };

  const handleAddLog = (log: LogEntry) => {
    setLogs((prev) => [...prev, log]);
  };

  const handleContactoRapido = (factura: Factura, canal: "email" | "whatsapp") => {
    const template = templates.find((t) => t.canal === canal);
    if (!template) return;
    setPreviewRapido({ factura, template });
  };

  const NAV_ITEMS: { id: Vista; label: string; icon: string }[] = [
    { id: "facturas", label: "Facturas", icon: "📄" },
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "clientes", label: "Clientes", icon: "👥" },
    { id: "calendario", label: "Calendario", icon: "🗓️" },
    { id: "configuracion", label: "Configuración", icon: "⚙️" },
  ];

  const iniciales = usuario.nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-base font-bold text-white">
            S
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-slate-900">Facturas SII</p>
            <p className="text-xs text-slate-400">Gestión de cobranza</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setVista(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                vista === item.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          {facturas.length > 0 && permisos.limpiarFacturas && (
            <button
              onClick={handleClear}
              className="mb-1 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              Limpiar todo
            </button>
          )}
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
              {iniciales}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{usuario.nombre}</p>
              <p className="text-xs text-slate-400">{ROLE_LABEL[usuario.role]}</p>
            </div>
            <button onClick={handleLogout} title="Salir" className="text-slate-400 hover:text-slate-700">
              ⏻
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-8 py-8">
          {permisos.cargarFacturas && (
            <div className="mb-6">
              <FileUpload onLoaded={handleLoaded} />
            </div>
          )}

          {vista === "facturas" &&
            (facturas.length > 0 ? (
              <FacturaTable
                facturas={facturas}
                onSelect={setSeleccionada}
                onContactar={handleContactoRapido}
                puedeEnviarMensajes={permisos.enviarMensajes}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                <p className="text-sm text-slate-400">Aún no hay facturas cargadas.</p>
              </div>
            ))}

          {vista === "dashboard" && (
            <Dashboard facturas={facturas} diasAlertaVencimiento={alertConfig.diasAntesVencimiento} />
          )}

          {vista === "clientes" && (
            <ClientesView
              clientes={clientes}
              onChange={setClientes}
              readOnly={!permisos.gestionarClientes}
              facturas={facturas}
              gestiones={gestiones}
              onVerFactura={setSeleccionada}
            />
          )}

          {vista === "calendario" && (
            <Calendario facturas={facturas} gestiones={gestiones} onVerFactura={setSeleccionada} />
          )}

          {vista === "configuracion" &&
            (!permisos.gestionarConfiguracion ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                <p className="text-sm text-slate-400">Solo el administrador puede modificar la configuración.</p>
              </div>
            ) : (
              <Configuracion
                alertConfig={alertConfig}
                onAlertConfigChange={setAlertConfig}
                templates={templates}
                onTemplatesChange={setTemplates}
              />
            ))}
        </div>
      </main>

      {seleccionada && (
        <FacturaDetalle
          factura={seleccionada}
          onClose={() => setSeleccionada(null)}
          cliente={clienteDe(seleccionada)}
          gestion={gestionDe(seleccionada)}
          templates={templates}
          logs={logsDe(seleccionada)}
          actor={usuario.nombre}
          readOnly={!permisos.gestionarCobranza}
          onUpdateGestion={handleUpdateGestion}
          onAddLog={handleAddLog}
        />
      )}

      {previewRapido && (
        <MessagePreviewModal
          factura={previewRapido.factura}
          cliente={clienteDe(previewRapido.factura)}
          template={previewRapido.template}
          onClose={() => setPreviewRapido(null)}
          onSend={() =>
            handleAddLog({
              id: crypto.randomUUID(),
              facturaId: facturaId(previewRapido.factura),
              timestamp: new Date().toISOString(),
              actor: usuario.nombre,
              accion: `Envió mensaje "${previewRapido.template.nombre}" por ${
                previewRapido.template.canal === "email" ? "email" : "WhatsApp"
              }`,
            })
          }
        />
      )}
    </div>
  );
}

export default App;
