// Genera XML sintéticos AEC/EnvioDTE del SII para probar la plataforma sin datos reales.
// Uso: node fixtures/generate.mjs

import { writeFileSync } from "fs";
import { join } from "path";

const HOY = new Date();
const fmt = (d) => d.toISOString().slice(0, 10);
const addDias = (d, n) => new Date(d.getTime() + n * 86400000);

let folioSeq = 100;
const nextFolio = () => String(folioSeq++);

function envioDTE({ folio, fechaEmision, emisor, receptor, items, formaPago = "2" }) {
  const neto = items.reduce((sum, i) => sum + i.cantidad * i.precioUnit, 0);
  const iva = Math.round(neto * 0.19);
  const total = neto + iva;

  const detalle = items
    .map(
      (i, idx) => `
    <Detalle>
      <NroLinDet>${idx + 1}</NroLinDet>
      <NmbItem>${i.nombre}</NmbItem>
      <DscItem>${i.descripcion}</DscItem>
      <QtyItem>${i.cantidad.toFixed(2)}</QtyItem>
      <UnmdItem>${i.unidad}</UnmdItem>
      <PrcItem>${i.precioUnit.toFixed(2)}</PrcItem>
      <MontoItem>${i.cantidad * i.precioUnit}</MontoItem>
    </Detalle>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<EnvioDTE xmlns="http://www.sii.cl/SiiDte" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0">
<SetDTE ID="SDTE${folio}">
  <Caratula version="1.0">
    <RutEmisor>${emisor.rut}</RutEmisor>
    <RutReceptor>${receptor.rut}</RutReceptor>
    <FchResol>2014-10-21</FchResol>
    <NroResol>99</NroResol>
    <TmstFirmaEnv>${fechaEmision}T10:00:00</TmstFirmaEnv>
  </Caratula>
<DTE version="1.0">
<Documento ID="MiPE${folio}">
    <Encabezado>
      <IdDoc>
        <TipoDTE>33</TipoDTE>
        <Folio>${folio}</Folio>
        <FchEmis>${fechaEmision}</FchEmis>
        <FmaPago>${formaPago}</FmaPago>
      </IdDoc>
      <Emisor>
        <RUTEmisor>${emisor.rut}</RUTEmisor>
        <RznSoc>${emisor.nombre}</RznSoc>
        <GiroEmis>${emisor.giro}</GiroEmis>
        <CorreoEmisor>${emisor.email}</CorreoEmisor>
        <DirOrigen>${emisor.direccion}</DirOrigen>
        <CmnaOrigen>${emisor.comuna}</CmnaOrigen>
        <CiudadOrigen>${emisor.ciudad}</CiudadOrigen>
      </Emisor>
      <Receptor>
        <RUTRecep>${receptor.rut}</RUTRecep>
        <RznSocRecep>${receptor.nombre}</RznSocRecep>
        <GiroRecep>${receptor.giro}</GiroRecep>
        <DirRecep>${receptor.direccion}</DirRecep>
        <CmnaRecep>${receptor.comuna}</CmnaRecep>
        <CiudadRecep>${receptor.ciudad}</CiudadRecep>
      </Receptor>
      <Totales>
        <MntNeto>${neto}</MntNeto>
        <TasaIVA>19.00</TasaIVA>
        <IVA>${iva}</IVA>
        <MntTotal>${total}</MntTotal>
      </Totales>
    </Encabezado>${detalle}
    <Referencia>
      <NroLinRef>1</NroLinRef>
      <TpoDocRef>HES</TpoDocRef>
      <FolioRef>${1000000000 + Number(folio)}</FolioRef>
      <FchRef>${fechaEmision}</FchRef>
    </Referencia>
    <TmstFirma>${fechaEmision}T10:00:00</TmstFirma>
  </Documento>
</DTE></SetDTE>
</EnvioDTE>
`;
}

function aec({ folio, fechaEmision, emisor, receptor, items, cesionario, vencimiento, formaPago = "2" }) {
  const envioInterno = envioDTE({ folio, fechaEmision, emisor, receptor, items, formaPago })
    .replace(/^<\?xml.*\?>\n/, "")
    .replace(/<\/?EnvioDTE[^>]*>/g, "")
    .replace(/<\/?SetDTE[^>]*>/g, "")
    .replace(/<Caratula[\s\S]*?<\/Caratula>/, "");

  const neto = items.reduce((sum, i) => sum + i.cantidad * i.precioUnit, 0);
  const iva = Math.round(neto * 0.19);
  const total = neto + iva;

  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<AEC xmlns="http://www.sii.cl/SiiDte" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0">
<DocumentoAEC ID="DAEC${folio}">
  <Caratula version="1.0">
    <RutCedente>${emisor.rut}</RutCedente>
    <RutCesionario>${cesionario.rut}</RutCesionario>
    <TmstFirmaEnvio>${fechaEmision}T12:00:00</TmstFirmaEnvio>
  </Caratula>
  <Cesiones>
<DTECedido version="1.0">
  <DocumentoDTECedido ID="MiPEDTE${folio}">
${envioInterno}
    <TmstFirma>${fechaEmision}T12:00:00</TmstFirma>
  </DocumentoDTECedido>
</DTECedido>
<Cesion version="1.0">
  <DocumentoCesion ID="MiPECSN${folio}">
    <SeqCesion>1</SeqCesion>
    <IdDTE>
      <TipoDTE>33</TipoDTE>
      <RUTEmisor>${emisor.rut}</RUTEmisor>
      <RUTReceptor>${receptor.rut}</RUTReceptor>
      <Folio>${folio}</Folio>
      <FchEmis>${fechaEmision}</FchEmis>
      <MntTotal>${total}</MntTotal>
    </IdDTE>
    <Cedente>
      <RUT>${emisor.rut}</RUT>
      <RazonSocial>${emisor.nombre}</RazonSocial>
      <Direccion>${emisor.direccion}</Direccion>
      <eMail>${emisor.email}</eMail>
    </Cedente>
    <Cesionario>
      <RUT>${cesionario.rut}</RUT>
      <RazonSocial>${cesionario.nombre}</RazonSocial>
      <Direccion>${cesionario.direccion}</Direccion>
      <eMail>${cesionario.email}</eMail>
    </Cesionario>
    <MontoCesion>${total}</MontoCesion>
    <UltimoVencimiento>${vencimiento}</UltimoVencimiento>
    <TmstCesion>${fechaEmision}T12:00:00</TmstCesion>
  </DocumentoCesion>
</Cesion>  </Cesiones>
</DocumentoAEC>
</AEC>
`;
}

const EMISOR = {
  rut: "76146382-9",
  nombre: "INGENIERIA GEORADAR CHILE SPA",
  giro: "SERVICIOS DE INGENIERIA Y PROSPECCION",
  email: "contacto@georadarchile.cl",
  direccion: "ARQ. GABRIEL OVALLE 4348",
  comuna: "NUNOA",
  ciudad: "SANTIAGO",
};

const RECEPTORES = [
  {
    rut: "77611649-1",
    nombre: "SOCIEDAD TRANSMISORA METROPOLITANA S.A.",
    giro: "TRANSMISION DE ENERGIA ELECTRICA",
    direccion: "BULNES 441",
    comuna: "OSORNO",
    ciudad: "OSORNO",
  },
  {
    rut: "76727040-2",
    nombre: "MINERA CENTINELA",
    giro: "EXTRACCION Y PROCESAMIENTO DE COBRE",
    direccion: "APOQUINDO 4001",
    comuna: "LAS CONDES",
    ciudad: "SANTIAGO",
  },
  {
    rut: "76616492-7",
    nombre: "SERVICIOS DE INGENIERIA DSP LIMITADA",
    giro: "CONSTRUCCION DE OBRAS DE INGENIERIA",
    direccion: "GENERAL DEL CANTO 10",
    comuna: "PROVIDENCIA",
    ciudad: "SANTIAGO",
  },
];

const CESIONARIOS = [
  { rut: "97004000-5", nombre: "Banco de Chile", direccion: "Huerfanos 740", email: "cesiones@bancochile.cl" },
  { rut: "96667560-8", nombre: "Tanner Servicios Financieros SA", direccion: "Huerfanos 863", email: "cesiones@tanner.cl" },
];

const fixtures = [
  // Pendiente, sin ceder
  aecOrEnvio("envio", {
    folio: nextFolio(),
    fechaEmision: fmt(addDias(HOY, -10)),
    emisor: EMISOR,
    receptor: RECEPTORES[1],
    items: [
      { nombre: "Levantamiento Geo Radar", descripcion: "Servicio de prospección subsuelo sector norte", cantidad: 1, unidad: "gl", precioUnit: 2450000 },
    ],
  }),
  // Pendiente, varios ítems
  aecOrEnvio("envio", {
    folio: nextFolio(),
    fechaEmision: fmt(addDias(HOY, -3)),
    emisor: EMISOR,
    receptor: RECEPTORES[2],
    items: [
      { nombre: "Estudio de subsuelo", descripcion: "Etapa 1 de 3, sector poniente", cantidad: 1, unidad: "gl", precioUnit: 1800000 },
      { nombre: "Informe técnico", descripcion: "Informe final con resultados georradar", cantidad: 2, unidad: "un", precioUnit: 350000 },
    ],
  }),
  // Cedida, vigente (vence en 20 días)
  aecOrEnvio("aec", {
    folio: nextFolio(),
    fechaEmision: fmt(addDias(HOY, -15)),
    emisor: EMISOR,
    receptor: RECEPTORES[0],
    items: [
      { nombre: "Informe Final GeoRadar", descripcion: "Servicios geo radar sector transmisión eléctrica", cantidad: 1, unidad: "gl", precioUnit: 1578418 },
    ],
    cesionario: CESIONARIOS[0],
    vencimiento: fmt(addDias(HOY, 20)),
  }),
  // Cedida, próxima a vencer (vence en 5 días -> debe disparar alerta)
  aecOrEnvio("aec", {
    folio: nextFolio(),
    fechaEmision: fmt(addDias(HOY, -25)),
    emisor: EMISOR,
    receptor: RECEPTORES[1],
    items: [
      { nombre: "Servicios de Geo Radar", descripcion: "10% inicio toma de datos en terreno", cantidad: 1, unidad: "gl", precioUnit: 3125844 },
    ],
    cesionario: CESIONARIOS[1],
    vencimiento: fmt(addDias(HOY, 5)),
  }),
  // Cedida, vencida (vencimiento ya pasó)
  aecOrEnvio("aec", {
    folio: nextFolio(),
    fechaEmision: fmt(addDias(HOY, -60)),
    emisor: EMISOR,
    receptor: RECEPTORES[2],
    items: [
      { nombre: "Topografía y catastro", descripcion: "Levantamiento planimétrico zona industrial", cantidad: 1, unidad: "gl", precioUnit: 980000 },
    ],
    cesionario: CESIONARIOS[0],
    vencimiento: fmt(addDias(HOY, -10)),
  }),
  // Pendiente, monto alto, receptor repetido (para probar top receptores)
  aecOrEnvio("envio", {
    folio: nextFolio(),
    fechaEmision: fmt(addDias(HOY, -1)),
    emisor: EMISOR,
    receptor: RECEPTORES[0],
    items: [
      { nombre: "Inspección de líneas de transmisión", descripcion: "Inspección con drone y georradar", cantidad: 1, unidad: "gl", precioUnit: 5200000 },
    ],
  }),
];

function aecOrEnvio(tipo, params) {
  return { tipo, xml: tipo === "aec" ? aec(params) : envioDTE(params), folio: params.folio };
}

for (const { tipo, xml, folio } of fixtures) {
  const filename = `${tipo === "aec" ? "AEC" : "DTE"}_FAKE_${folio}.xml`;
  writeFileSync(join(import.meta.dirname, filename), xml, "latin1");
  console.log("Generado:", filename);
}
