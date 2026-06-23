import { useState } from "react";
import type { Cliente, GestionCobro, GestionEstado, LogEntry, MessageTemplate } from "../types";
import { GESTION_ESTADO_LABEL, facturaId, plazoDias, vencimientoEstimado } from "../types";
import type { Factura } from "../types";
import { formatCLP, formatRUT } from "../utils/formatters";
import { MessagePreviewModal } from "./MessagePreviewModal";
import { ConfirmarPagoModal } from "./ConfirmarPagoModal";

interface FacturaDetalleProps {
  factura: Factura;
  onClose: () => void;
  cliente: Cliente | undefined;
  gestion: GestionCobro | undefined;
  templates: MessageTemplate[];
  logs: LogEntry[];
  actor: string;
  readOnly: boolean;
  onUpdateGestion: (gestion: GestionCobro) => void;
  onAddLog: (log: LogEntry) => void;
}

const TIPO_DTE_LABEL: Record<string, string> = {
  "33": "Factura Electrónica",
};

function downloadXml(factura: Factura) {
  const blob = new Blob([factura.xmlOriginal], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DTE_${factura.tipoDTE}_${factura.folio}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

export function FacturaDetalle({
  factura,
  onClose,
  cliente,
  gestion,
  templates,
  logs,
  actor,
  readOnly,
  onUpdateGestion,
  onAddLog,
}: FacturaDetalleProps) {
  const [notas, setNotas] = useState(gestion?.notas ?? "");
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);
  const [mostrarConfirmarPago, setMostrarConfirmarPago] = useState(false);
  const [plazoInput, setPlazoInput] = useState(plazoDias(factura, gestion));
  const id = facturaId(factura);

  const handleEstadoChange = (estado: GestionEstado) => {
    if (estado === "pagado" && gestion?.estado !== "pagado") {
      setMostrarConfirmarPago(true);
      return;
    }
    onUpdateGestion({ ...gestion, facturaId: id, estado, notas });
    onAddLog({
      id: crypto.randomUUID(),
      facturaId: id,
      timestamp: new Date().toISOString(),
      actor,
      accion: `Cambió estado de gestión a "${GESTION_ESTADO_LABEL[estado]}"`,
    });
  };

  const handleConfirmarPago = (data: {
    comprobante?: string;
    comprobanteNombre?: string;
    numeroTransaccion?: string;
    fechaPago: string;
  }) => {
    onUpdateGestion({
      ...gestion,
      facturaId: id,
      estado: "pagado",
      notas,
      ...data,
    });
    const validacion = data.comprobante
      ? `comprobante "${data.comprobanteNombre}"`
      : `número de transacción "${data.numeroTransaccion}"`;
    onAddLog({
      id: crypto.randomUUID(),
      facturaId: id,
      timestamp: new Date().toISOString(),
      actor,
      accion: `Marcó como pagado (validado con ${validacion}, fecha de pago ${data.fechaPago})`,
    });
    setMostrarConfirmarPago(false);
  };

  const handlePlazoBlur = () => {
    if (plazoInput === plazoDias(factura, gestion)) return;
    onUpdateGestion({ ...gestion, facturaId: id, estado: gestion?.estado ?? "sin_contactar", notas, plazoDiasPago: plazoInput });
    onAddLog({
      id: crypto.randomUUID(),
      facturaId: id,
      timestamp: new Date().toISOString(),
      actor,
      accion: `Actualizó plazo de pago a ${plazoInput} días`,
    });
  };

  const handleNotasBlur = () => {
    if (notas === (gestion?.notas ?? "")) return;
    onUpdateGestion({ facturaId: id, estado: gestion?.estado ?? "sin_contactar", notas, fechaPago: gestion?.fechaPago });
    onAddLog({
      id: crypto.randomUUID(),
      facturaId: id,
      timestamp: new Date().toISOString(),
      actor,
      accion: "Actualizó notas de gestión",
    });
  };

  const handleEnviar = (template: MessageTemplate) => {
    onAddLog({
      id: crypto.randomUUID(),
      facturaId: id,
      timestamp: new Date().toISOString(),
      actor,
      accion: `Envió mensaje "${template.nombre}" por ${template.canal === "email" ? "email" : "WhatsApp"}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold">
              {TIPO_DTE_LABEL[factura.tipoDTE] ?? `DTE Tipo ${factura.tipoDTE}`} N° {factura.folio}
            </h2>
            <p className="text-sm text-gray-500">
              Emitida el {factura.fechaEmision} · Forma de pago: {factura.formaPago}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded border border-gray-200 p-3">
            <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">Emisor</h3>
            <p className="font-medium">{factura.emisor.nombre}</p>
            <p className="text-sm text-gray-600">{formatRUT(factura.emisor.rut)}</p>
            <p className="text-sm text-gray-600">{factura.emisor.giro}</p>
            <p className="text-sm text-gray-600">{factura.emisor.email}</p>
            <p className="text-sm text-gray-600">{factura.emisor.direccion}</p>
          </div>
          <div className="rounded border border-gray-200 p-3">
            <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">Receptor</h3>
            <p className="font-medium">{factura.receptor.nombre}</p>
            <p className="text-sm text-gray-600">{formatRUT(factura.receptor.rut)}</p>
            <p className="text-sm text-gray-600">{factura.receptor.giro}</p>
            <p className="text-sm text-gray-600">{factura.receptor.direccion}</p>
          </div>
        </div>

        <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">Detalle</h3>
        <div className="mb-4 overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Ítem</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Descripción</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500">Cantidad</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Unidad</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500">Precio Unit.</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {factura.items.map((item) => (
                <tr key={item.nroLinDet}>
                  <td className="px-3 py-2">{item.nombre}</td>
                  <td className="px-3 py-2 text-gray-600">{item.descripcion}</td>
                  <td className="px-3 py-2 text-right">{item.cantidad}</td>
                  <td className="px-3 py-2">{item.unidad}</td>
                  <td className="px-3 py-2 text-right">{formatCLP(item.precioUnit)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatCLP(item.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-4 ml-auto w-full max-w-xs space-y-1 rounded border border-gray-200 p-3 text-sm sm:ml-auto">
          <div className="flex justify-between">
            <span className="text-gray-500">Neto</span>
            <span>{formatCLP(factura.totales.neto)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">IVA ({factura.totales.tasa}%)</span>
            <span>{formatCLP(factura.totales.iva)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold">
            <span>Total</span>
            <span>{formatCLP(factura.totales.total)}</span>
          </div>
        </div>

        {factura.referencias.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">Referencias</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              {factura.referencias.map((ref, idx) => (
                <li key={idx}>
                  {ref.tipoDocRef} N° {ref.folioRef} · {ref.fechaRef}
                </li>
              ))}
            </ul>
          </div>
        )}

        {factura.cesion && (
          <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3">
            <h3 className="mb-1 text-xs font-semibold uppercase text-blue-700">Cesión</h3>
            <p className="text-sm text-blue-900">
              Cedida a <span className="font-medium">{factura.cesion.cesionario}</span> por{" "}
              {formatCLP(factura.cesion.monto)}
            </p>
            <p className="text-sm text-blue-900">Último vencimiento: {factura.cesion.vencimiento}</p>
          </div>
        )}

        <div className="mb-4 rounded border border-gray-200 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">Plazo y vencimiento</h3>
          {(() => {
            const venc = vencimientoEstimado(factura, gestion);
            const hoy = new Date();
            const fechaEmision = new Date(factura.fechaEmision);
            const fechaReferencia = gestion?.fechaPago ? new Date(gestion.fechaPago) : hoy;
            const diasTranscurridos = Math.max(
              0,
              Math.round((fechaReferencia.getTime() - fechaEmision.getTime()) / (1000 * 60 * 60 * 24)),
            );
            const diasHastaVencimiento = Math.round(
              (new Date(venc).getTime() - fechaReferencia.getTime()) / (1000 * 60 * 60 * 24),
            );
            const esCesionAutoritativa = !!factura.cesion?.vencimiento;
            return (
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-400">Forma de pago</p>
                  <p className="font-medium">{factura.formaPago}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Plazo (días)</label>
                  <input
                    type="number"
                    min={0}
                    value={plazoInput}
                    onChange={(e) => setPlazoInput(Number(e.target.value))}
                    onBlur={handlePlazoBlur}
                    disabled={readOnly || esCesionAutoritativa}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                  />
                  {esCesionAutoritativa && <p className="text-xs text-gray-400">Definido por cesión</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-400">Vencimiento {esCesionAutoritativa ? "(cesión)" : "estimado"}</p>
                  <p className="font-medium">{venc}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">
                    {gestion?.fechaPago ? "Días hasta el pago" : "Días transcurridos"}
                  </p>
                  <p className="font-medium">{diasTranscurridos}</p>
                </div>
                <div className="col-span-2 sm:col-span-4">
                  {gestion?.fechaPago ? (
                    <p className={`text-sm ${diasHastaVencimiento < 0 ? "text-red-600" : "text-green-600"}`}>
                      {diasHastaVencimiento < 0
                        ? `Se pagó ${Math.abs(diasHastaVencimiento)} días después del vencimiento.`
                        : `Se pagó ${diasHastaVencimiento} días antes del vencimiento.`}
                    </p>
                  ) : (
                    <p className={`text-sm ${diasHastaVencimiento < 0 ? "text-red-600" : "text-gray-600"}`}>
                      {diasHastaVencimiento < 0
                        ? `Vencida hace ${Math.abs(diasHastaVencimiento)} días.`
                        : `Vence en ${diasHastaVencimiento} días.`}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="mb-4 rounded border border-gray-200 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">Gestión de cobro</h3>

          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Estado</label>
          <select
            value={gestion?.estado ?? "sin_contactar"}
            onChange={(e) => handleEstadoChange(e.target.value as GestionEstado)}
            disabled={readOnly}
            className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
          >
            {Object.entries(GESTION_ESTADO_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Notas internas</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            onBlur={handleNotasBlur}
            disabled={readOnly}
            rows={3}
            className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
          />

          {gestion?.estado === "pagado" && (gestion.comprobante || gestion.numeroTransaccion) && (
            <div className="mb-3 rounded border border-green-200 bg-green-50 p-2 text-xs text-green-800">
              <p className="font-medium">Pago validado</p>
              {gestion.numeroTransaccion && <p>N° transacción: {gestion.numeroTransaccion}</p>}
              {gestion.comprobante && (
                <a href={gestion.comprobante} download={gestion.comprobanteNombre} className="text-blue-700 hover:underline">
                  Ver comprobante ({gestion.comprobanteNombre})
                </a>
              )}
            </div>
          )}

          {!cliente?.email && !cliente?.whatsapp && (
            <p className="mb-2 text-xs text-amber-600">
              Este cliente no tiene email ni WhatsApp registrado. Agrégalo en la sección Clientes.
            </p>
          )}

          <div className="mb-3 flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setPreviewTemplate(t)}
                disabled={readOnly}
                className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t.canal === "email" ? "✉️" : "💬"} {t.nombre}
              </button>
            ))}
          </div>

          {logs.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">Historial</h4>
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-gray-600">
                {logs
                  .slice()
                  .reverse()
                  .map((log) => (
                    <li key={log.id}>
                      {new Date(log.timestamp).toLocaleString("es-CL")} · {log.actor}: {log.accion}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={() => downloadXml(factura)}
          className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Descargar XML original
        </button>
      </div>

      {previewTemplate && (
        <MessagePreviewModal
          factura={factura}
          cliente={cliente}
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSend={() => handleEnviar(previewTemplate)}
        />
      )}

      {mostrarConfirmarPago && (
        <ConfirmarPagoModal onClose={() => setMostrarConfirmarPago(false)} onConfirm={handleConfirmarPago} />
      )}
    </div>
  );
}
