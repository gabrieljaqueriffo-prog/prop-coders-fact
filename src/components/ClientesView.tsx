import { useState } from "react";
import type { Cliente, Factura, GestionCobro } from "../types";
import { ClienteDetalle } from "./ClienteDetalle";
import { analizarRiesgoCliente, RIESGO_BADGE, RIESGO_LABEL } from "../utils/risk";
import { facturaId } from "../types";

interface ClientesViewProps {
  clientes: Cliente[];
  onChange: (clientes: Cliente[]) => void;
  readOnly: boolean;
  facturas: Factura[];
  gestiones: GestionCobro[];
  onVerFactura?: (factura: Factura) => void;
}

const VACIO: Cliente = { rut: "", nombre: "", email: "", whatsapp: "", notas: "" };

export function ClientesView({ clientes, onChange, readOnly, facturas, gestiones, onVerFactura }: ClientesViewProps) {
  const [seleccionado, setSeleccionado] = useState<{ cliente: Cliente; esNuevo: boolean } | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const filtrados = clientes.filter((c) =>
    `${c.rut} ${c.nombre} ${c.email}`.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const handleGuardar = (cliente: Cliente) => {
    const existe = clientes.some((c) => c.rut === cliente.rut);
    onChange(existe ? clientes.map((c) => (c.rut === cliente.rut ? cliente : c)) : [...clientes, cliente]);
    setSeleccionado(null);
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
            onClick={() => setSeleccionado({ cliente: VACIO, esNuevo: true })}
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
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500"></th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">RUT</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Nombre</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Email</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">WhatsApp</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Riesgo</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.map((c) => {
              const facturasCliente = facturas.filter((f) => f.receptor.rut === c.rut);
              const idsCliente = new Set(facturasCliente.map(facturaId));
              const gestionesCliente = gestiones.filter((g) => idsCliente.has(g.facturaId));
              const riesgo = analizarRiesgoCliente(facturasCliente, gestionesCliente);
              return (
                <tr
                  key={c.rut}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSeleccionado({ cliente: c, esNuevo: false })}
                >
                  <td className="px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50">
                      {c.logo ? (
                        <img src={c.logo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">{c.rut}</td>
                  <td className="px-3 py-2 font-medium">{c.nombre}</td>
                  <td className="px-3 py-2 text-gray-600">{c.email}</td>
                  <td className="px-3 py-2 text-gray-600">{c.whatsapp}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${RIESGO_BADGE[riesgo.nivel]}`}>
                      {RIESGO_LABEL[riesgo.nivel]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    {!readOnly && (
                      <button onClick={() => handleEliminar(c.rut)} className="text-red-500 hover:text-red-700">
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                  No hay clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {seleccionado && (
        <ClienteDetalle
          cliente={seleccionado.cliente}
          esNuevo={seleccionado.esNuevo}
          facturas={facturas}
          gestiones={gestiones}
          readOnly={readOnly}
          onGuardar={handleGuardar}
          onClose={() => setSeleccionado(null)}
          onVerFactura={onVerFactura}
        />
      )}
    </div>
  );
}
