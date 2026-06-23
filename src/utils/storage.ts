import type {
  AlertConfig,
  Cliente,
  Factura,
  GestionCobro,
  LogEntry,
  MessageTemplate,
  Usuario,
} from "../types";

const KEYS = {
  facturas: "sii.facturas",
  clientes: "sii.clientes",
  gestiones: "sii.gestiones",
  logs: "sii.logs",
  templates: "sii.templates",
  alertConfig: "sii.alertConfig",
  usuario: "sii.usuario",
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  loadFacturas: (): Factura[] => load(KEYS.facturas, []),
  saveFacturas: (v: Factura[]) => save(KEYS.facturas, v),

  loadClientes: (): Cliente[] => load(KEYS.clientes, []),
  saveClientes: (v: Cliente[]) => save(KEYS.clientes, v),

  loadGestiones: (): GestionCobro[] => load(KEYS.gestiones, []),
  saveGestiones: (v: GestionCobro[]) => save(KEYS.gestiones, v),

  loadLogs: (): LogEntry[] => load(KEYS.logs, []),
  saveLogs: (v: LogEntry[]) => save(KEYS.logs, v),

  loadTemplates: (): MessageTemplate[] => load(KEYS.templates, DEFAULT_TEMPLATES),
  saveTemplates: (v: MessageTemplate[]) => save(KEYS.templates, v),

  loadAlertConfig: (): AlertConfig => load(KEYS.alertConfig, { diasAntesVencimiento: 7 }),
  saveAlertConfig: (v: AlertConfig) => save(KEYS.alertConfig, v),

  loadUsuario: (): Usuario | null => load(KEYS.usuario, null),
  saveUsuario: (v: Usuario | null) => save(KEYS.usuario, v),

  clearAll: () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "recordatorio-email",
    nombre: "Recordatorio de pago (email)",
    canal: "email",
    asunto: "Recordatorio: Factura {{folio}} próxima a vencer",
    cuerpo:
      "Hola {{cliente}},\n\nLe recordamos que la factura N° {{folio}} por un monto de {{monto}} vence el {{vencimiento}}.\n\nQuedamos atentos a su pago.\n\nSaludos.",
  },
  {
    id: "recordatorio-whatsapp",
    nombre: "Recordatorio de pago (WhatsApp)",
    canal: "whatsapp",
    asunto: "",
    cuerpo: "Hola {{cliente}}, le recordamos que la factura N° {{folio}} por {{monto}} vence el {{vencimiento}}. Saludos.",
  },
  {
    id: "mora-email",
    nombre: "Aviso de mora (email)",
    canal: "email",
    asunto: "Factura {{folio}} se encuentra vencida",
    cuerpo:
      "Hola {{cliente}},\n\nLa factura N° {{folio}} por {{monto}} se encuentra vencida desde el {{vencimiento}}. Por favor regularizar a la brevedad.\n\nSaludos.",
  },
];
