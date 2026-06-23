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
