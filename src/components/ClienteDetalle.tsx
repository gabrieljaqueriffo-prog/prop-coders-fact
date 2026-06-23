import { useState } from "react";
import type { Cliente, Factura, GestionCobro } from "../types";
import { GESTION_ESTADO_LABEL, facturaId } from "../types";
import { formatCLP, formatRUT } from "../utils/formatters";
import { analizarRiesgoCliente, RIESGO_BADGE, RIESGO_LABEL } from "../utils/risk";

interface ClienteDetalleProps {
  cliente: Cliente;
  esNuevo: boolean;
  facturas: Factura[];
  gestiones: GestionCobro[];
  readOnly: boolean;
  onGuardar: (cliente: Cliente) => void;
  onClose: () => void;
  onVerFactura?: (factura: Factura) => void;
}

const ESTADO_FACTURA_BADGE: Record<Factura["estado"], string> = {
  pendiente: "bg-amber-100 text-amber-800",
  cedida: "bg-blue-100 text-blue-800",
  vencida: "bg-red-100 text-red-800",
};

const ESTADO_FACTURA_LABEL: Record<Factura["estado"], string> = {
  pendiente: "Pendiente",
  cedida: "Cedida",
  vencida: "Vencida",
};

function handleLogoFile(file: File, onLoaded: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") onLoaded(reader.result);
  };
  reader.readAsDataURL(file);
}

export function ClienteDetalle({
  cliente,
  esNuevo,
  facturas,
  gestiones,
  readOnly,
  onGuardar,
  onClose,
  onVerFactura,
}: ClienteDetalleProps) {
  const [form, setForm] = useState(cliente);

  const facturasCliente = facturas
    .filter((f) => f.receptor.rut === cliente.rut)
    .sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));
  const idsCliente = new Set(facturasCliente.map(facturaId));
  const gestionesCliente = gestiones.filter((g) => idsCliente.has(g.facturaId));
  const gestionPorFactura = new Map(gestionesCliente.map((g) => [g.facturaId, g]));
  const riesgo = analizarRiesgoCliente(facturasCliente, gestionesCliente);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rut.trim()) return;
    onGuardar(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50">
              {form.logo ? (
                <img src={form.logo} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400">Sin logo</span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{esNuevo ? "Nuevo cliente" : form.nombre || "Cliente"}</h2>
              {!esNuevo && <p className="text-sm text-gray-500">{formatRUT(form.rut)}</p>}
              {!readOnly && (
                <label className="mt-1 inline-block cursor-pointer text-xs text-blue-600 hover:underline">
                  {form.logo ? "Cambiar logo" : "Agregar logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoFile(file, (dataUrl) => setForm({ ...form, logo: dataUrl }));
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">RUT</label>
            <input
              value={form.rut}
              onChange={(e) => setForm({ ...form, rut: e.target.value })}
              disabled={!esNuevo || readOnly}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Nombre</label>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              disabled={readOnly}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              type="email"
              disabled={readOnly}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">WhatsApp</label>
            <input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="+56912345678"
              disabled={readOnly}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              disabled={readOnly}
              rows={2}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>
        </div>

        {!esNuevo && (
          <>
            <div className="mb-4 rounded border border-gray-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase text-gray-500">Análisis de riesgo de pago</h3>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${RIESGO_BADGE[riesgo.nivel]}`}>
                  {RIESGO_LABEL[riesgo.nivel]}
                </span>
              </div>
              <p className="mb-2 text-sm text-gray-600">{riesgo.mensaje}</p>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-400">Facturas</p>
                  <p className="font-medium">{riesgo.totalFacturas}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total facturado</p>
                  <p className="font-medium">{formatCLP(riesgo.totalFacturado)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Pagadas</p>
                  <p className="font-medium">{riesgo.pagadas}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Vencidas / en mora</p>
                  <p className="font-medium">
                    {riesgo.vencidas} / {riesgo.enMora}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Pagos a tiempo</p>
                  <p className="font-medium">{riesgo.pagosATiempo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Pagos atrasados</p>
                  <p className="font-medium">{riesgo.pagosAtrasados}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Atraso promedio</p>
                  <p className="font-medium">
                    {riesgo.diasPromedioAtraso !== null ? `${riesgo.diasPromedioAtraso} días` : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">Historial de facturación</h3>
              <div className="overflow-x-auto rounded border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Folio</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Fecha</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500">Total</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Estado</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Gestión</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Fecha pago</th>
                      {onVerFactura && <th className="px-3 py-2"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {facturasCliente.map((f) => {
                      const gestion = gestionPorFactura.get(facturaId(f));
                      return (
                        <tr key={facturaId(f)}>
                          <td className="px-3 py-2 font-medium">{f.folio}</td>
                          <td className="px-3 py-2">{f.fechaEmision}</td>
                          <td className="px-3 py-2 text-right">{formatCLP(f.totales.total)}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${ESTADO_FACTURA_BADGE[f.estado]}`}>
                              {ESTADO_FACTURA_LABEL[f.estado]}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {GESTION_ESTADO_LABEL[gestion?.estado ?? "sin_contactar"]}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{gestion?.fechaPago ?? "—"}</td>
                          {onVerFactura && (
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => onVerFactura(f)}
                                className="text-blue-600 hover:underline"
                              >
                                Ver
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {facturasCliente.length === 0 && (
                      <tr>
                        <td colSpan={onVerFactura ? 7 : 6} className="px-3 py-6 text-center text-gray-400">
                          Este cliente no tiene facturas registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!readOnly && (
          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
            <button type="button" onClick={onClose} className="rounded px-4 py-2 text-sm text-gray-500 hover:text-gray-800">
              Cancelar
            </button>
            <button type="submit" className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
              Guardar
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
