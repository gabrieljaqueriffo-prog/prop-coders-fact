import type { Factura, GestionCobro } from "../types";

export type RiesgoNivel = "bajo" | "medio" | "alto" | "sin_datos";

export const RIESGO_LABEL: Record<RiesgoNivel, string> = {
  bajo: "Riesgo bajo",
  medio: "Riesgo medio",
  alto: "Riesgo alto",
  sin_datos: "Sin datos suficientes",
};

export const RIESGO_BADGE: Record<RiesgoNivel, string> = {
  bajo: "bg-green-100 text-green-800",
  medio: "bg-amber-100 text-amber-800",
  alto: "bg-red-100 text-red-800",
  sin_datos: "bg-gray-100 text-gray-600",
};

export interface AnalisisRiesgoCliente {
  nivel: RiesgoNivel;
  totalFacturas: number;
  totalFacturado: number;
  pagadas: number;
  vencidas: number;
  enMora: number;
  pagosATiempo: number;
  pagosAtrasados: number;
  diasPromedioAtraso: number | null;
  mensaje: string;
}

function diasDeAtraso(factura: Factura, fechaPago: string): number {
  const vencimiento = factura.cesion?.vencimiento;
  if (!vencimiento) return 0;
  const ms = new Date(fechaPago).getTime() - new Date(vencimiento).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function analizarRiesgoCliente(
  facturasCliente: Factura[],
  gestionesCliente: GestionCobro[],
): AnalisisRiesgoCliente {
  const gestionPorFactura = new Map(gestionesCliente.map((g) => [g.facturaId, g]));
  const totalFacturas = facturasCliente.length;
  const totalFacturado = facturasCliente.reduce((sum, f) => sum + f.totales.total, 0);

  let pagadas = 0;
  let vencidas = 0;
  let enMora = 0;
  let pagosATiempo = 0;
  let pagosAtrasados = 0;
  const atrasos: number[] = [];

  for (const factura of facturasCliente) {
    const gestion = gestionPorFactura.get(`${factura.emisor.rut}-${factura.folio}`);
    if (factura.estado === "vencida") vencidas++;
    if (gestion?.estado === "en_mora") enMora++;
    if (gestion?.estado === "pagado") {
      pagadas++;
      if (gestion.fechaPago) {
        const dias = diasDeAtraso(factura, gestion.fechaPago);
        atrasos.push(dias);
        if (dias > 0) pagosAtrasados++;
        else pagosATiempo++;
      }
    }
  }

  const diasPromedioAtraso = atrasos.length > 0 ? Math.round(atrasos.reduce((a, b) => a + b, 0) / atrasos.length) : null;

  if (totalFacturas === 0) {
    return {
      nivel: "sin_datos",
      totalFacturas,
      totalFacturado,
      pagadas,
      vencidas,
      enMora,
      pagosATiempo,
      pagosAtrasados,
      diasPromedioAtraso,
      mensaje: "Este cliente aún no tiene facturas asociadas.",
    };
  }

  const proporcionProblema = (vencidas + enMora) / totalFacturas;
  const proporcionAtraso = pagadas > 0 ? pagosAtrasados / pagadas : 0;

  let nivel: RiesgoNivel;
  let mensaje: string;
  if (proporcionProblema >= 0.4 || (diasPromedioAtraso !== null && diasPromedioAtraso > 30)) {
    nivel = "alto";
    mensaje = "Historial con vencimientos o mora frecuentes y/o atrasos prolongados de pago.";
  } else if (proporcionProblema > 0 || proporcionAtraso > 0.3) {
    nivel = "medio";
    mensaje = "Algunas facturas vencidas, en mora o pagadas con atraso. Mantener seguimiento.";
  } else if (pagadas > 0) {
    nivel = "bajo";
    mensaje = "Buen historial de pago, sin atrasos significativos.";
  } else {
    nivel = "sin_datos";
    mensaje = "Aún no hay pagos registrados para evaluar el comportamiento de pago.";
  }

  return {
    nivel,
    totalFacturas,
    totalFacturado,
    pagadas,
    vencidas,
    enMora,
    pagosATiempo,
    pagosAtrasados,
    diasPromedioAtraso,
    mensaje,
  };
}
