import { useState } from "react";
import type { Factura, GestionCobro } from "../types";
import { facturaId, vencimientoEstimado } from "../types";
import { formatCLP } from "../utils/formatters";

interface CalendarioProps {
  facturas: Factura[];
  gestiones: GestionCobro[];
  onVerFactura: (factura: Factura) => void;
}

type TipoEvento = "facturacion" | "vencimiento" | "pago";

interface Evento {
  tipo: TipoEvento;
  fecha: string;
  factura: Factura;
}

const TIPO_LABEL: Record<TipoEvento, string> = {
  facturacion: "Facturación",
  vencimiento: "Vencimiento",
  pago: "Pago",
};

const TIPO_COLOR: Record<TipoEvento, string> = {
  facturacion: "bg-blue-100 text-blue-800",
  vencimiento: "bg-amber-100 text-amber-800",
  pago: "bg-green-100 text-green-800",
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function buildEventos(facturas: Factura[], gestiones: GestionCobro[]): Evento[] {
  const gestionPorFactura = new Map(gestiones.map((g) => [g.facturaId, g]));
  const eventos: Evento[] = [];
  for (const factura of facturas) {
    const gestion = gestionPorFactura.get(facturaId(factura));
    eventos.push({ tipo: "facturacion", fecha: factura.fechaEmision, factura });
    eventos.push({ tipo: "vencimiento", fecha: vencimientoEstimado(factura, gestion), factura });
    if (gestion?.fechaPago) {
      eventos.push({ tipo: "pago", fecha: gestion.fechaPago, factura });
    }
  }
  return eventos;
}

export function Calendario({ facturas, gestiones, onVerFactura }: CalendarioProps) {
  const [cursor, setCursor] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const eventos = buildEventos(facturas, gestiones);
  const eventosPorDia = new Map<string, Evento[]>();
  for (const ev of eventos) {
    const lista = eventosPorDia.get(ev.fecha) ?? [];
    lista.push(ev);
    eventosPorDia.set(ev.fecha, lista);
  }

  const anio = cursor.getFullYear();
  const mes = cursor.getMonth();
  const primerDiaSemana = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const hoyStr = new Date().toISOString().slice(0, 10);

  const celdas: (string | null)[] = [];
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) {
    celdas.push(`${anio}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  const eventosDelDiaSeleccionado = diaSeleccionado ? eventosPorDia.get(diaSeleccionado) ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(anio, mes - 1, 1))}
          className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
        >
          ← Anterior
        </button>
        <h2 className="text-lg font-semibold">
          {MESES[mes]} {anio}
        </h2>
        <button
          onClick={() => setCursor(new Date(anio, mes + 1, 1))}
          className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
        >
          Siguiente →
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.keys(TIPO_LABEL) as TipoEvento[]).map((tipo) => (
          <span key={tipo} className={`rounded-full px-2 py-1 font-medium ${TIPO_COLOR[tipo]}`}>
            {TIPO_LABEL[tipo]}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-slate-500">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celdas.map((fecha, idx) => {
          if (!fecha) return <div key={idx} className="min-h-20 rounded border border-transparent" />;
          const eventosDia = eventosPorDia.get(fecha) ?? [];
          const esHoy = fecha === hoyStr;
          return (
            <button
              key={fecha}
              onClick={() => setDiaSeleccionado(fecha)}
              className={`min-h-20 rounded border p-1 text-left align-top ${
                esHoy ? "border-slate-800" : "border-slate-200"
              } hover:bg-slate-50`}
            >
              <p className={`mb-1 text-xs ${esHoy ? "font-bold text-slate-900" : "text-slate-500"}`}>
                {Number(fecha.slice(-2))}
              </p>
              <div className="flex flex-wrap gap-0.5">
                {eventosDia.slice(0, 4).map((ev, i) => (
                  <span key={i} className={`h-1.5 w-1.5 rounded-full ${TIPO_COLOR[ev.tipo].split(" ")[0]}`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {diaSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDiaSeleccionado(null)}>
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-semibold">{diaSeleccionado}</h3>
              <button onClick={() => setDiaSeleccionado(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            {eventosDelDiaSeleccionado.length === 0 ? (
              <p className="text-sm text-slate-400">Sin eventos este día.</p>
            ) : (
              <ul className="space-y-2">
                {eventosDelDiaSeleccionado.map((ev, i) => (
                  <li key={i} className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm">
                    <div>
                      <span className={`mr-2 rounded-full px-2 py-1 text-xs font-medium ${TIPO_COLOR[ev.tipo]}`}>
                        {TIPO_LABEL[ev.tipo]}
                      </span>
                      <span className="font-medium">{ev.factura.receptor.nombre}</span>
                      <span className="ml-1 text-slate-500">
                        · Folio {ev.factura.folio} · {formatCLP(ev.factura.totales.total)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onVerFactura(ev.factura);
                        setDiaSeleccionado(null);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Ver
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
