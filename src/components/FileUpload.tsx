import { useCallback, useRef, useState } from "react";
import { parseAEC, readXmlFile } from "../utils/xmlParser";
import type { Factura } from "../types";

interface FileUploadProps {
  onLoaded: (facturas: Factura[]) => void;
}

export function FileUpload({ onLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const xmlFiles = Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".xml"));
      if (xmlFiles.length === 0) {
        setError("Selecciona al menos un archivo .xml");
        return;
      }

      const facturas: Factura[] = [];
      const errores: string[] = [];

      for (const file of xmlFiles) {
        try {
          const xmlString = await readXmlFile(file);
          facturas.push(parseAEC(xmlString));
        } catch (err) {
          errores.push(`${file.name}: ${err instanceof Error ? err.message : "error desconocido"}`);
        }
      }

      if (facturas.length > 0) onLoaded(facturas);
      if (errores.length > 0) setError(errores.join(" | "));
    },
    [onLoaded],
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-white p-10 text-center  transition-colors ${
          isDragging ? "border-blue-600 bg-blue-50" : "border-slate-300 hover:border-blue-400"
        }`}
      >
        <p className="text-sm text-slate-600">
          Arrastra archivos XML aquí o <span className="font-medium text-blue-700">haz click para seleccionar</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">Soporta múltiples archivos AEC/DTE del SII</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xml"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
