export interface Item {
  nroLinDet: number;
  nombre: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnit: number;
  monto: number;
}

export interface Referencia {
  tipoDocRef: string;
  folioRef: string;
  fechaRef: string;
}

export interface Cesion {
  cesionario: string;
  monto: number;
  vencimiento: string;
}

export type EstadoFactura = "pendiente" | "cedida" | "vencida";

export interface Factura {
  folio: string;
  tipoDTE: string;
  fechaEmision: string;
  formaPago: "Contado" | "Crédito";
  emisor: {
    rut: string;
    nombre: string;
    giro: string;
    email: string;
    direccion: string;
  };
  receptor: {
    rut: string;
    nombre: string;
    giro: string;
    direccion: string;
  };
  items: Item[];
  referencias: Referencia[];
  totales: {
    neto: number;
    tasa: number;
    iva: number;
    total: number;
  };
  cesion?: Cesion;
  estado: EstadoFactura;
  xmlOriginal: string;
}

export const facturaId = (f: Pick<Factura, "emisor" | "folio">): string => `${f.emisor.rut}-${f.folio}`;

export type Role = "admin" | "viewer";

export interface Usuario {
  nombre: string;
  role: Role;
}

export type GestionEstado = "sin_contactar" | "contactado" | "promesa_pago" | "en_mora" | "pagado";

export const GESTION_ESTADO_LABEL: Record<GestionEstado, string> = {
  sin_contactar: "Sin contactar",
  contactado: "Contactado",
  promesa_pago: "Promesa de pago",
  en_mora: "En mora",
  pagado: "Pagado",
};

export interface GestionCobro {
  facturaId: string;
  estado: GestionEstado;
  notas: string;
}

export interface LogEntry {
  id: string;
  facturaId: string;
  timestamp: string;
  actor: string;
  accion: string;
}

export interface Cliente {
  rut: string;
  nombre: string;
  email: string;
  whatsapp: string;
  notas: string;
}

export interface MessageTemplate {
  id: string;
  nombre: string;
  canal: "email" | "whatsapp";
  asunto: string;
  cuerpo: string;
}

export interface AlertConfig {
  diasAntesVencimiento: number;
}
