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
import type { Factura } from "../types";
import { formatCLP } from "../utils/formatters";

interface DashboardProps {
  facturas: Factura[];
  diasAlertaVencimiento: number;
}

function diasHasta(fecha: string): number {
  const ms = new Date(fecha).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function Dashboard({ facturas, diasAlertaVencimiento }: DashboardProps) {
  const totalFacturado = useMemo(() => facturas.reduce((sum, f) => sum + f.totales.total, 0), [facturas]);
  const totalIVA = useMemo(() => facturas.reduce((sum, f) => sum + f.totales.iva, 0), [facturas]);

  const conteoPorEstado = useMemo(() => {
    const counts = { pendiente: 0, cedida: 0, vencida: 0 };
    for (const f of facturas) counts[f.estado]++;
    return counts;
  }, [facturas]);

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
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-gray-200 p-4">
          <p className="text-xs uppercase text-gray-500">Total facturado</p>
          <p className="mt-1 text-2xl font-semibold">{formatCLP(totalFacturado)}</p>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <p className="text-xs uppercase text-gray-500">IVA acumulado</p>
          <p className="mt-1 text-2xl font-semibold">{formatCLP(totalIVA)}</p>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <p className="text-xs uppercase text-gray-500">Facturas cargadas</p>
          <p className="mt-1 text-2xl font-semibold">{facturas.length}</p>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <p className="text-xs uppercase text-gray-500">Por estado</p>
          <p className="mt-1 text-sm">
            Pendientes: {conteoPorEstado.pendiente} · Cedidas: {conteoPorEstado.cedida} · Vencidas:{" "}
            {conteoPorEstado.vencida}
          </p>
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-800">
            Alertas de vencimiento ({alertas.length})
          </h3>
          <ul className="space-y-1 text-sm text-amber-900">
            {alertas.map(({ factura, dias }) => (
              <li key={`${factura.emisor.rut}-${factura.folio}`}>
                Folio {factura.folio} — {factura.receptor.nombre} —{" "}
                {dias < 0 ? `vencida hace ${Math.abs(dias)} días` : `vence en ${dias} días`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded border border-gray-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Top 5 receptores por monto</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topReceptores} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => formatCLP(v)} />
              <YAxis type="category" dataKey="nombre" width={150} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCLP(Number(v))} />
              <Bar dataKey="total" fill="#1f2937" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded border border-gray-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Facturación por fecha de emisión</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineaTiempo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatCLP(v)} width={90} />
              <Tooltip formatter={(v) => formatCLP(Number(v))} />
              <Line type="monotone" dataKey="total" stroke="#1f2937" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
