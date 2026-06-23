export const formatCLP = (n: number): string =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);

export const formatRUT = (rut: string): string => {
  const clean = rut.replace(/[^0-9kK]/g, "");
  if (clean.length < 2) return rut;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots}-${dv}`;
};

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat("es-CL").format(n);
