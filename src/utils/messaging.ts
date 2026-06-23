import type { Cliente, Factura, MessageTemplate } from "../types";
import { formatCLP } from "./formatters";

function vencimientoDe(factura: Factura): string {
  return factura.cesion?.vencimiento ?? "";
}

export function renderTemplate(template: string, factura: Factura, cliente: Cliente | undefined): string {
  return template
    .replace(/\{\{cliente\}\}/g, cliente?.nombre || factura.receptor.nombre)
    .replace(/\{\{folio\}\}/g, factura.folio)
    .replace(/\{\{monto\}\}/g, formatCLP(factura.totales.total))
    .replace(/\{\{vencimiento\}\}/g, vencimientoDe(factura) || "sin información");
}

export function buildMailtoLink(template: MessageTemplate, factura: Factura, cliente: Cliente | undefined): string {
  const destinatario = cliente?.email || "";
  const asunto = renderTemplate(template.asunto, factura, cliente);
  const cuerpo = renderTemplate(template.cuerpo, factura, cliente);
  const params = new URLSearchParams({ subject: asunto, body: cuerpo });
  return `mailto:${destinatario}?${params.toString()}`;
}

export function buildWhatsappLink(template: MessageTemplate, factura: Factura, cliente: Cliente | undefined): string {
  const telefono = (cliente?.whatsapp || "").replace(/[^0-9]/g, "");
  const mensaje = renderTemplate(template.cuerpo, factura, cliente);
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}
