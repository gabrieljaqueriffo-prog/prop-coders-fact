import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Factura, GestionCobro, GestionEstado } from "../types";
import { GESTION_ESTADO_LABEL, facturaId } from "../types";
import { formatCLP } from "../utils/formatters";

interface DashboardProps {
  facturas: Factura[];
  gestiones: GestionCobro[];
  diasAlertaVencimiento: number;
}

function diasHasta(fecha: string): number {
  const ms = new Date(fecha).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function Dashboard({ facturas, gestiones, diasAlertaVencimiento }: DashboardProps) {
  const totalFacturado = useMemo(() => facturas.reduce((sum, f) => sum + f.totales.total, 0), [facturas]);
  const totalIVA = useMemo(() => facturas.reduce((sum, f) => sum + f.totales.iva, 0), [facturas]);

  const conteoPorEstado = useMemo(() => {
    const counts = { pendiente: 0, cedida: 0, vencida: 0 };
    for (const f of facturas) counts[f.estado]++;
    return counts;
  }, [facturas]);

  const conteoPorGestion = useMemo(() => {
    const counts: Record<GestionEstado, number> = {
      sin_contactar: 0,
      contactado: 0,
      promesa_pago: 0,
      en_mora: 0,
      pagado: 0,
    };
    for (const f of facturas) {
      const id = facturaId(f);
      const estado = gestiones.find((g) => g.facturaId === id)?.estado ?? "sin_contactar";
      counts[estado]++;
    }
    return counts;
  }, [facturas, gestiones]);

  const topReceptores = useMemo(() => {
    const totals = new Map<string, number>();
    for (const f of facturas) {
      totals.set(f.receptor.nombre, (totals.get(f.receptor.nombre) ?? 0) + f.totales.total);
    }
    return Array.from(totals.entries())
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [facturas]);

  const lineaTiempo = useMemo(() => {
    const totals = new Map<string, number>();
    for (const f of facturas) {
      totals.set(f.fechaEmision, (totals.get(f.fechaEmision) ?? 0) + f.totales.total);
    }
    return Array.from(totals.entries())
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [facturas]);

  const alertas = useMemo(() => {
    return facturas
      .filter((f) => f.cesion?.vencimiento)
      .map((f) => ({ factura: f, dias: diasHasta(f.cesion!.vencimiento) }))
      .filter((a) => a.dias < diasAlertaVencimiento)
      .sort((a, b) => a.dias - b.dias);
  }, [facturas, diasAlertaVencimiento]);

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-slate-300 bg-white px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total facturado</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{formatCLP(totalFacturado)}</p>
        </div>
        <div className="rounded border border-slate-300 bg-white px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">IVA acumulado</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{formatCLP(totalIVA)}</p>
        </div>
        <div className="rounded border border-slate-300 bg-white px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Facturas cargadas</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{facturas.length}</p>
        </div>
        <div className="rounded border border-slate-300 bg-white px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Estado SII / cesión</p>
          <p className="mt-1 text-[13px] text-slate-600">
            <span className="font-semibold text-slate-900">{conteoPorEstado.pendiente}</span> pendientes ·{" "}
            <span className="font-semibold text-slate-900">{conteoPorEstado.cedida}</span> cedidas ·{" "}
            <span className="font-semibold text-slate-900">{conteoPorEstado.vencida}</span> vencidas
          </p>
        </div>
      </div>

      <div className="rounded border border-slate-300 bg-white px-3 py-2.5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Estado de cobranza (gestión interna)
        </p>
        <p className="text-[13px] text-slate-600">
          {Object.entries(GESTION_ESTADO_LABEL).map(([key, label], idx) => (
            <span key={key}>
              {idx > 0 && " · "}
              <span className="font-semibold text-slate-900">{conteoPorGestion[key as GestionEstado]}</span> {label}
            </span>
          ))}
        </p>
      </div>

      {alertas.length > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2.5">
          <h3 className="mb-1 text-[12px] font-semibold uppercase text-amber-800">
            Alertas de vencimiento ({alertas.length})
          </h3>
          <ul className="space-y-0.5 text-[13px] text-amber-900">
            {alertas.map(({ factura, dias }) => (
              <li key={`${factura.emisor.rut}-${factura.folio}`}>
                Folio {factura.folio} — {factura.receptor.nombre} —{" "}
                {dias < 0 ? `vencida hace ${Math.abs(dias)} días` : `vence en ${dias} días`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded border border-slate-300 bg-white p-3">
          <h3 className="mb-2 text-[12px] font-semibold uppercase text-slate-500">Top 5 receptores por monto</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topReceptores} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={(v) => formatCLP(v)} tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis type="category" dataKey="nombre" width={140} tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip formatter={(v) => formatCLP(Number(v))} />
              <Bar dataKey="total" fill="#2563eb" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded border border-slate-300 bg-white p-3">
          <h3 className="mb-2 text-[12px] font-semibold uppercase text-slate-500">Facturación por fecha de emisión</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={lineaTiempo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tickFormatter={(v) => formatCLP(v)} width={80} tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip formatter={(v) => formatCLP(Number(v))} />
              <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
