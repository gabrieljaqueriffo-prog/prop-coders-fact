import { useState } from "react";
import type { Role, Usuario } from "../types";
import { ROLE_LABEL } from "../types";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-900/40">
            S
          </div>
          <h1 className="text-xl font-bold text-white">Facturas SII</h1>
          <p className="mt-1 text-sm text-slate-400">Gestión de cobranza y facturación electrónica</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Nombre
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mb-5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="Tu nombre"
            autoFocus
          />

          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Rol</label>
          <div className="mb-6 flex gap-2">
            {(["admin", "administrativo", "viewer"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition ${
                  role === r
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
