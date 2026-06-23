import type { Cesion, EstadoFactura, Factura, Item, Referencia } from "../types";

const NS = "http://www.sii.cl/SiiDte";

const get = (node: Document | Element, tag: string): string =>
  node.getElementsByTagNameNS(NS, tag)[0]?.textContent?.trim() ?? "";

const getAll = (node: Document | Element, tag: string): Element[] =>
  Array.from(node.getElementsByTagNameNS(NS, tag));

const toNumber = (s: string): number => {
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
};

const FORMA_PAGO: Record<string, "Contado" | "Crédito"> = {
  "1": "Contado",
  "2": "Crédito",
};

function parseItems(doc: Document): Item[] {
  return getAll(doc, "Detalle").map((det) => ({
    nroLinDet: toNumber(get(det, "NroLinDet")),
    nombre: get(det, "NmbItem"),
    descripcion: get(det, "DscItem"),
    cantidad: toNumber(get(det, "QtyItem")),
    unidad: get(det, "UnmdItem"),
    precioUnit: toNumber(get(det, "PrcItem")),
    monto: toNumber(get(det, "MontoItem")),
  }));
}

function parseReferencias(doc: Document): Referencia[] {
  return getAll(doc, "Referencia").map((ref) => ({
    tipoDocRef: get(ref, "TpoDocRef"),
    folioRef: get(ref, "FolioRef"),
    fechaRef: get(ref, "FchRef"),
  }));
}

function parseCesion(doc: Document): Cesion | undefined {
  const documentoCesion = getAll(doc, "DocumentoCesion")[0];
  if (!documentoCesion) return undefined;

  const montoCesionStr = get(documentoCesion, "MontoCesion");
  if (!montoCesionStr) return undefined;

  const cesionarioEl = getAll(documentoCesion, "Cesionario")[0];

  return {
    cesionario: cesionarioEl ? get(cesionarioEl, "RazonSocial") : "",
    monto: toNumber(montoCesionStr),
    vencimiento: get(documentoCesion, "UltimoVencimiento"),
  };
}

function calcularEstado(cesion: Cesion | undefined): EstadoFactura {
  if (cesion) {
    if (cesion.vencimiento) {
      const vencimiento = new Date(cesion.vencimiento);
      if (vencimiento.getTime() < Date.now()) return "vencida";
    }
    return "cedida";
  }
  return "pendiente";
}

export async function readXmlFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const declaration = new TextDecoder("ascii").decode(buffer.slice(0, 100));
  const match = declaration.match(/encoding=["']([^"']+)["']/i);
  const encoding = match ? match[1] : "utf-8";
  return new TextDecoder(encoding).decode(buffer);
}

export function parseAEC(xmlString: string): Factura {
  const doc = new DOMParser().parseFromString(xmlString, "application/xml");

  const parserError = doc.getElementsByTagName("parsererror")[0];
  if (parserError) {
    throw new Error("El archivo XML no es válido.");
  }

  const root = doc.documentElement;
  if (root.localName !== "AEC" && root.localName !== "DTE") {
    throw new Error("El XML no corresponde a un documento AEC/DTE del SII.");
  }

  const tasa = toNumber(get(doc, "TasaIVA"));
  const cesion = parseCesion(doc);

  const factura: Factura = {
    folio: get(doc, "Folio"),
    tipoDTE: get(doc, "TipoDTE"),
    fechaEmision: get(doc, "FchEmis"),
    formaPago: FORMA_PAGO[get(doc, "FmaPago")] ?? "Contado",
    emisor: {
      rut: get(doc, "RUTEmisor"),
      nombre: get(doc, "RznSoc"),
      giro: get(doc, "GiroEmis"),
      email: get(doc, "CorreoEmisor"),
      direccion: [get(doc, "DirOrigen"), get(doc, "CmnaOrigen"), get(doc, "CiudadOrigen")]
        .filter(Boolean)
        .join(", "),
    },
    receptor: {
      rut: get(doc, "RUTRecep"),
      nombre: get(doc, "RznSocRecep"),
      giro: get(doc, "GiroRecep"),
      direccion: [get(doc, "DirRecep"), get(doc, "CmnaRecep"), get(doc, "CiudadRecep")]
        .filter(Boolean)
        .join(", "),
    },
    items: parseItems(doc),
    referencias: parseReferencias(doc),
    totales: {
      neto: toNumber(get(doc, "MntNeto")),
      tasa,
      iva: toNumber(get(doc, "IVA")),
      total: toNumber(get(doc, "MntTotal")),
    },
    cesion,
    estado: calcularEstado(cesion),
    xmlOriginal: xmlString,
  };

  return factura;
}
