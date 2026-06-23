import { useMemo, useState } from "react";
import type { EstadoFactura, Factura } from "../types";
import { formatCLP, formatRUT } from "../utils/formatters";

interface FacturaTableProps {
  facturas: Factura[];
  onSelect: (factura: Factura) => void;
}

type SortKey = "folio" | "fechaEmision" | "emisor" | "receptor" | "neto" | "iva" | "total" | "estado";
type SortDir = "asc" | "desc";

const ESTADO_BADGE: Record<EstadoFactura, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  cedida: "bg-blue-100 text-blue-800",
  vencida: "bg-red-100 text-red-800",
};

const ESTADO_LABEL: Record<EstadoFactura, string> = {
  pendiente: "Pendiente",
  cedida: "Cedida",
  vencida: "Vencida",
};

function exportToCSV(facturas: Factura[]) {
  const headers = ["Folio", "Fecha", "Emisor RUT", "Emisor", "Receptor RUT", "Receptor", "Neto", "IVA", "Total", "Estado"];
  const rows = facturas.map((f) => [
    f.folio,
    f.fechaEmision,
    f.emisor.rut,
    f.emisor.nombre,
    f.receptor.rut,
    f.receptor.nombre,
    f.totales.neto,
    f.totales.iva,
    f.totales.total,
    ESTADO_LABEL[f.estado],
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "facturas.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function FacturaTable({ facturas, onSelect }: FacturaTableProps) {
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFactura | "todos">("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [montoMin, setMontoMin] = useState("");
  const [montoMax, setMontoMax] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fechaEmision");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return facturas.filter((f) => {
      if (estadoFiltro !== "todos" && f.estado !== estadoFiltro) return false;
      if (fechaDesde && f.fechaEmision < fechaDesde) return false;
      if (fechaHasta && f.fechaEmision > fechaHasta) return false;
      if (montoMin && f.totales.total < Number(montoMin)) return false;
      if (montoMax && f.totales.total > Number(montoMax)) return false;
      if (term) {
        const haystack = [
          f.folio,
          f.emisor.rut,
          f.emisor.nombre,
          f.receptor.rut,
          f.receptor.nombre,
          ...f.items.map((i) => i.descripcion + i.nombre),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [facturas, search, estadoFiltro, fechaDesde, fechaHasta, montoMin, montoMax]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "folio":
          return dir * a.folio.localeCompare(b.folio, undefined, { numeric: true });
        case "fechaEmision":
          return dir * a.fechaEmision.localeCompare(b.fechaEmision);
        case "emisor":
          return dir * a.emisor.nombre.localeCompare(b.emisor.nombre);
        case "receptor":
          return dir * a.receptor.nombre.localeCompare(b.receptor.nombre);
        case "neto":
          return dir * (a.totales.neto - b.totales.neto);
        case "iva":
          return dir * (a.totales.iva - b.totales.iva);
        case "total":
          return dir * (a.totales.total - b.totales.total);
        case "estado":
          return dir * a.estado.localeCompare(b.estado);
        default:
          return 0;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const Th = ({ label, sortable }: { label: string; sortable?: SortKey }) => (
    <th
      className={`px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500 ${
        sortable ? "cursor-pointer select-none hover:text-gray-700" : ""
      }`}
      onClick={sortable ? () => toggleSort(sortable) : undefined}
    >
      {label}
      {sortable === sortKey && (sortDir === "asc" ? " ▲" : " ▼")}
    </th>
  );

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <input
          type="text"
          placeholder="Buscar RUT, razón social, folio, ítem..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[240px] flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value as EstadoFactura | "todos")}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="cedida">Cedida</option>
          <option value="vencida">Vencida</option>
        </select>
        <label className="flex flex-col text-xs text-gray-500">
          Desde
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col text-xs text-gray-500">
          Hasta
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col text-xs text-gray-500">
          Monto mín.
          <input type="number" value={montoMin} onChange={(e) => setMontoMin(e.target.value)} className="w-28 rounded border border-gray-300 px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col text-xs text-gray-500">
          Monto máx.
          <input type="number" value={montoMax} onChange={(e) => setMontoMax(e.target.value)} className="w-28 rounded border border-gray-300 px-2 py-1.5 text-sm" />
        </label>
        <button
          onClick={() => exportToCSV(sorted)}
          className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Exportar CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th label="Folio" sortable="folio" />
              <Th label="Fecha" sortable="fechaEmision" />
              <Th label="Emisor" sortable="emisor" />
              <Th label="Receptor" sortable="receptor" />
              <Th label="Neto" sortable="neto" />
              <Th label="IVA" sortable="iva" />
              <Th label="Total" sortable="total" />
              <Th label="Estado" sortable="estado" />
              <Th label="Acciones" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((f) => (
              <tr key={`${f.emisor.rut}-${f.folio}`} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{f.folio}</td>
                <td className="px-3 py-2">{f.fechaEmision}</td>
                <td className="px-3 py-2">
                  <div>{f.emisor.nombre}</div>
                  <div className="text-xs text-gray-400">{formatRUT(f.emisor.rut)}</div>
                </td>
                <td className="px-3 py-2">
                  <div>{f.receptor.nombre}</div>
                  <div className="text-xs text-gray-400">{formatRUT(f.receptor.rut)}</div>
                </td>
                <td className="px-3 py-2">{formatCLP(f.totales.neto)}</td>
                <td className="px-3 py-2">{formatCLP(f.totales.iva)}</td>
                <td className="px-3 py-2 font-medium">{formatCLP(f.totales.total)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${ESTADO_BADGE[f.estado]}`}>
                    {ESTADO_LABEL[f.estado]}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => onSelect(f)} className="text-blue-600 hover:underline">
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-400">
                  No hay facturas que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
