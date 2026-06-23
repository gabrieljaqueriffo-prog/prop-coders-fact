import { useState } from "react";

interface ConfirmarPagoModalProps {
  onClose: () => void;
  onConfirm: (data: { comprobante?: string; comprobanteNombre?: string; numeroTransaccion?: string; fechaPago: string }) => void;
}

function readFileAsDataUrl(file: File, onLoaded: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") onLoaded(reader.result);
  };
  reader.readAsDataURL(file);
}

export function ConfirmarPagoModal({ onClose, onConfirm }: ConfirmarPagoModalProps) {
  const [numeroTransaccion, setNumeroTransaccion] = useState("");
  const [comprobante, setComprobante] = useState<string | undefined>(undefined);
  const [comprobanteNombre, setComprobanteNombre] = useState<string | undefined>(undefined);
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().slice(0, 10));

  const valido = numeroTransaccion.trim().length > 0 || !!comprobante;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold">Confirmar pago</h2>
        <p className="mb-4 text-sm text-slate-500">
          Para dar validez al registro de pago, sube un comprobante (imagen o PDF) o ingresa el número de
          transacción.
        </p>

        <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Fecha de pago</label>
        <input
          type="date"
          value={fechaPago}
          onChange={(e) => setFechaPago(e.target.value)}
          className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Número de transacción</label>
        <input
          value={numeroTransaccion}
          onChange={(e) => setNumeroTransaccion(e.target.value)}
          placeholder="Ej: 123456789"
          className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Comprobante (imagen o PDF)</label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              readFileAsDataUrl(file, (dataUrl) => setComprobante(dataUrl));
              setComprobanteNombre(file.name);
            }
          }}
          className="mb-1 w-full text-sm"
        />
        {comprobanteNombre && <p className="mb-3 text-xs text-slate-500">Archivo: {comprobanteNombre}</p>}

        {!valido && (
          <p className="mb-3 text-xs text-amber-600">
            Debes ingresar un número de transacción o subir un comprobante para confirmar el pago.
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="rounded px-4 py-2 text-sm text-slate-500 hover:text-slate-800">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!valido}
            onClick={() =>
              onConfirm({
                comprobante,
                comprobanteNombre,
                numeroTransaccion: numeroTransaccion.trim() || undefined,
                fechaPago,
              })
            }
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );
}
