import { useState } from "react";
import type { AlertConfig, MessageTemplate } from "../types";

interface ConfiguracionProps {
  alertConfig: AlertConfig;
  onAlertConfigChange: (config: AlertConfig) => void;
  templates: MessageTemplate[];
  onTemplatesChange: (templates: MessageTemplate[]) => void;
}

export function Configuracion({
  alertConfig,
  onAlertConfigChange,
  templates,
  onTemplatesChange,
}: ConfiguracionProps) {
  const [editando, setEditando] = useState<MessageTemplate | null>(null);

  const handleGuardarTemplate = (template: MessageTemplate) => {
    const existe = templates.some((t) => t.id === template.id);
    onTemplatesChange(
      existe ? templates.map((t) => (t.id === template.id ? template : t)) : [...templates, template],
    );
    setEditando(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded border border-gray-200 p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Alertas de vencimiento</h3>
        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
          Días antes del vencimiento para alertar
        </label>
        <input
          type="number"
          min={1}
          value={alertConfig.diasAntesVencimiento}
          onChange={(e) =>
            onAlertConfigChange({ ...alertConfig, diasAntesVencimiento: Number(e.target.value) || 1 })
          }
          className="w-32 rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded border border-gray-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Plantillas de mensaje</h3>
          <button
            onClick={() =>
              setEditando({ id: crypto.randomUUID(), nombre: "", canal: "email", asunto: "", cuerpo: "" })
            }
            className="rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
          >
            Nueva plantilla
          </button>
        </div>
        <ul className="divide-y divide-gray-100">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{t.nombre}</p>
                <p className="text-xs text-gray-500">{t.canal === "email" ? "Email" : "WhatsApp"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditando(t)} className="text-gray-500 hover:text-gray-800">
                  Editar
                </button>
                <button
                  onClick={() => onTemplatesChange(templates.filter((x) => x.id !== t.id))}
                  className="text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-gray-400">
          Variables disponibles: {"{{cliente}}"}, {"{{folio}}"}, {"{{monto}}"}, {"{{vencimiento}}"}
        </p>
      </div>

      {editando && (
        <TemplateForm template={editando} onGuardar={handleGuardarTemplate} onCancelar={() => setEditando(null)} />
      )}
    </div>
  );
}

function TemplateForm({
  template,
  onGuardar,
  onCancelar,
}: {
  template: MessageTemplate;
  onGuardar: (t: MessageTemplate) => void;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState(template);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancelar}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.nombre.trim()) return;
          onGuardar(form);
        }}
        className="w-full max-w-md space-y-3 rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="mb-2 text-lg font-semibold">Plantilla de mensaje</h2>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Nombre</label>
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Canal</label>
          <select
            value={form.canal}
            onChange={(e) => setForm({ ...form, canal: e.target.value as "email" | "whatsapp" })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
        {form.canal === "email" && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Asunto</label>
            <input
              value={form.asunto}
              onChange={(e) => setForm({ ...form, asunto: e.target.value })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Cuerpo</label>
          <textarea
            value={form.cuerpo}
            onChange={(e) => setForm({ ...form, cuerpo: e.target.value })}
            rows={5}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancelar} className="rounded px-4 py-2 text-sm text-gray-500 hover:text-gray-800">
            Cancelar
          </button>
          <button type="submit" className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
