import type { Cliente, Factura, MessageTemplate } from "../types";
import { buildMailtoLink, buildWhatsappLink, renderTemplate } from "../utils/messaging";

interface MessagePreviewModalProps {
  factura: Factura;
  cliente: Cliente | undefined;
  template: MessageTemplate;
  onClose: () => void;
  onSend: () => void;
}

export function MessagePreviewModal({ factura, cliente, template, onClose, onSend }: MessagePreviewModalProps) {
  const asunto = renderTemplate(template.asunto, factura, cliente);
  const cuerpo = renderTemplate(template.cuerpo, factura, cliente);
  const destinatario = template.canal === "email" ? cliente?.email : cliente?.whatsapp;
  const link =
    template.canal === "email" ? buildMailtoLink(template, factura, cliente) : buildWhatsappLink(template, factura, cliente);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold">
            Vista previa · {template.canal === "email" ? "Email" : "WhatsApp"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <p className="mb-3 text-sm text-gray-600">
          Para: <span className="font-medium">{destinatario || "(sin dato de contacto)"}</span>
        </p>

        {template.canal === "email" && (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Asunto</label>
            <p className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">{asunto}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Mensaje</label>
          <p className="whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">{cuerpo}</p>
        </div>

        {!destinatario && (
          <p className="mb-3 text-xs text-amber-600">
            Este cliente no tiene {template.canal === "email" ? "email" : "WhatsApp"} registrado. Puedes editarlo
            en la sección Clientes.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded px-4 py-2 text-sm text-gray-500 hover:text-gray-800">
            Cancelar
          </button>
          <a
            href={destinatario ? link : undefined}
            target={template.canal === "whatsapp" ? "_blank" : undefined}
            rel="noreferrer"
            onClick={() => {
              if (!destinatario) return;
              onSend();
              onClose();
            }}
            aria-disabled={!destinatario}
            className={`rounded px-4 py-2 text-sm font-medium text-white ${
              destinatario ? "bg-indigo-600 hover:bg-indigo-500" : "pointer-events-none bg-gray-300"
            }`}
          >
            {template.canal === "email" ? "Abrir en mi correo" : "Abrir en WhatsApp"}
          </a>
        </div>
      </div>
    </div>
  );
}
