import { useState } from "react";
import type { Cliente } from "../types";

interface ClientesViewProps {
  clientes: Cliente[];
  onChange: (clientes: Cliente[]) => void;
  readOnly: boolean;
}

const VACIO: Cliente = { rut: "", nombre: "", email: "", whatsapp: "", notas: "" };

export function ClientesView({ clientes, onChange, readOnly }: ClientesViewProps) {
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const filtrados = clientes.filter((c) =>
    `${c.rut} ${c.nombre} ${c.email}`.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const handleGuardar = (cliente: Cliente) => {
    const existe = clientes.some((c) => c.rut === cliente.rut);
    if (existe) {
      onChange(clientes.map((c) => (c.rut === cliente.rut ? cliente : c)));
    } else {
      onChange([...clientes, cliente]);
    }
    setEditando(null);
  };

  const handleEliminar = (rut: string) => {
    onChange(clientes.filter((c) => c.rut !== rut));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por RUT, nombre o email..."
          className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
        {!readOnly && (
          <button
            onClick={() => setEditando(VACIO)}
            className="whitespace-nowrap rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Nuevo cliente
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">RUT</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Nombre</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Email</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">WhatsApp</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Notas</th>
              {!readOnly && <th className="px-3 py-2"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.map((c) => (
              <tr key={c.rut}>
                <td className="px-3 py-2">{c.rut}</td>
                <td className="px-3 py-2 font-medium">{c.nombre}</td>
                <td className="px-3 py-2 text-gray-600">{c.email}</td>
                <td className="px-3 py-2 text-gray-600">{c.whatsapp}</td>
                <td className="px-3 py-2 text-gray-600">{c.notas}</td>
                {!readOnly && (
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => setEditando(c)} className="mr-2 text-gray-500 hover:text-gray-800">
                      Editar
                    </button>
                    <button onClick={() => handleEliminar(c.rut)} className="text-red-500 hover:text-red-700">
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                  No hay clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editando && (
        <ClienteForm
          cliente={editando}
          editandoExistente={clientes.some((c) => c.rut === editando.rut)}
          onGuardar={handleGuardar}
          onCancelar={() => setEditando(null)}
        />
      )}
    </div>
  );
}

function ClienteForm({
  cliente,
  editandoExistente,
  onGuardar,
  onCancelar,
}: {
  cliente: Cliente;
  editandoExistente: boolean;
  onGuardar: (c: Cliente) => void;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState(cliente);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancelar}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.rut.trim()) return;
          onGuardar(form);
        }}
        className="w-full max-w-md space-y-3 rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="mb-2 text-lg font-semibold">{editandoExistente ? "Editar cliente" : "Nuevo cliente"}</h2>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">RUT</label>
          <input
            value={form.rut}
            onChange={(e) => setForm({ ...form, rut: e.target.value })}
            disabled={editandoExistente}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Nombre</label>
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Email</label>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">WhatsApp</label>
          <input
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            placeholder="+56912345678"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Notas</label>
          <textarea
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            rows={3}
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
