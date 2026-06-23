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

type Vista = "facturas" | "dashboard" | "clientes" | "configuracion";

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

  const NAV_ITEMS: { id: Vista; label: string }[] = [
    { id: "facturas", label: "Facturas" },
    { id: "dashboard", label: "Dashboard" },
    { id: "clientes", label: "Clientes" },
    { id: "configuracion", label: "Configuración" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Facturas Electrónicas SII</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {usuario.nombre} · {ROLE_LABEL[usuario.role]}
          </span>
          {facturas.length > 0 && permisos.limpiarFacturas && (
            <button onClick={handleClear} className="text-sm text-gray-500 hover:text-red-600">
              Limpiar todo
            </button>
          )}
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">
            Salir
          </button>
        </div>
      </header>

      {permisos.cargarFacturas && (
        <div className="mb-6">
          <FileUpload onLoaded={handleLoaded} />
        </div>
      )}

      <nav className="mb-4 flex gap-4 border-b border-gray-200">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setVista(item.id)}
            className={`border-b-2 px-1 py-2 text-sm font-medium ${
              vista === item.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {vista === "facturas" &&
        (facturas.length > 0 ? (
          <FacturaTable
            facturas={facturas}
            onSelect={setSeleccionada}
            onContactar={handleContactoRapido}
            puedeEnviarMensajes={permisos.enviarMensajes}
          />
        ) : (
          <p className="py-12 text-center text-sm text-gray-400">Aún no hay facturas cargadas.</p>
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

      {vista === "configuracion" &&
        (!permisos.gestionarConfiguracion ? (
          <p className="py-12 text-center text-sm text-gray-400">
            Solo el administrador puede modificar la configuración.
          </p>
        ) : (
          <Configuracion
            alertConfig={alertConfig}
            onAlertConfigChange={setAlertConfig}
            templates={templates}
            onTemplatesChange={setTemplates}
          />
        ))}

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
