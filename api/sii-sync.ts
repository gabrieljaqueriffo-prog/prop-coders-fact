// Vercel serverless function. Runs server-side only — the SII clave never
// reaches the browser's persistent storage and is never written to logs,
// disk, or a database here. It exists only in this function's memory for
// the duration of a single request and is discarded when the request ends.

interface SiiSyncRequest {
  rut: string;
  clave: string;
}

interface SiiSyncResponse {
  ok: boolean;
  pendiente: boolean;
  mensaje: string;
  facturas: never[];
}

// Placeholder: the SII does not expose a public API for this. A real
// implementation requires server-side browser automation (e.g. Puppeteer)
// against the SII's authenticated web portal using the taxpayer's RUT and
// Clave Tributaria, run inside this function (or a job it triggers) so the
// credential never leaves the server boundary. That automation is not
// implemented here — wire it in at the point marked below.
async function syncWithSii(_credenciales: SiiSyncRequest): Promise<SiiSyncResponse> {
  // TODO: replace with real SII portal automation. Do not log or persist
  // _credenciales.clave anywhere — use it only to authenticate this one
  // synchronization run, then let it go out of scope.
  return {
    ok: true,
    pendiente: true,
    mensaje:
      "Sincronización con SII aún no implementada: este endpoint ya maneja la credencial de forma segura " +
      "(solo en memoria, nunca persistida), pero falta conectar la automatización real contra el portal del SII.",
    facturas: [],
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  let body: SiiSyncRequest;
  try {
    body = (await req.json()) as SiiSyncRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
  }

  if (!body.rut?.trim() || !body.clave?.trim()) {
    return new Response(JSON.stringify({ error: "RUT y clave son requeridos" }), { status: 400 });
  }

  const resultado = await syncWithSii(body);
  // body.clave is never referenced again past this point and is dropped
  // when this function call returns.
  return new Response(JSON.stringify(resultado), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export const config = {
  runtime: "edge",
};
