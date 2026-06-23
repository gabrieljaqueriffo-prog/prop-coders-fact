import { useState } from "react";
import type { Role, Usuario } from "../types";

interface LoginProps {
  onLogin: (usuario: Usuario) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [nombre, setNombre] = useState("");
  const [role, setRole] = useState<Role>("viewer");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onLogin({ nombre: nombre.trim(), role });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-gray-900">Facturas Electrónicas SII</h1>
        <p className="mb-4 text-sm text-gray-500">Ingresa tu nombre y rol para continuar.</p>

        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          placeholder="Tu nombre"
          autoFocus
        />

        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Rol</label>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setRole("admin")}
            className={`flex-1 rounded border px-3 py-2 text-sm font-medium ${
              role === "admin" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-600"
            }`}
          >
            Administrador
          </button>
          <button
            type="button"
            onClick={() => setRole("viewer")}
            className={`flex-1 rounded border px-3 py-2 text-sm font-medium ${
              role === "viewer" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-600"
            }`}
          >
            Visualizador
          </button>
        </div>

        <button
          type="submit"
          className="w-full rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
