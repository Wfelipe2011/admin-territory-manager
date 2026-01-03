import { useState, useCallback, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { AxiosAdapter } from '@/infra/AxiosAdapter';
import { parseCookies } from 'nookies';

export type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'success' | 'error';

export interface Mapping {
  tipoTerritorio: string;
  territorio: string;
  quadra: string;
  logradouro: string;
  numero: string;
  legenda?: string;
  ordem?: string;
  naoBater?: string;
}

export interface NormalizationRules {
  naoBaterTrueValues: string[];
  legendaMapping: Record<string, string>;
}

const DEFAULT_NORMALIZATION: NormalizationRules = {
  naoBaterTrueValues: ['Sim', 'S', '1', 'X', 'x', 'true', 'True'],
  legendaMapping: {
    'Comércio': 'Comércio',
    'Comercio': 'Comércio',
    'Terreno': 'Terreno',
    'Fundos': 'Fundos',
    'Testemunha de Jeová': 'Testemunha de Jeová',
    'TJ': 'Testemunha de Jeová',
    'Igreja': 'Igreja',
    'Escola': 'Escola',
    'Hospital': 'Hospital',
    'Apartamento': 'Apartamento',
    'Apto': 'Apartamento',
    'Residência': 'Residência',
    'Residencia': 'Residência',
  },
};

const FIELDS: { key: keyof Mapping; label: string; required: boolean }[] = [
  { key: 'tipoTerritorio', label: 'Tipo de Território', required: true },
  { key: 'territorio', label: 'Território', required: true },
  { key: 'quadra', label: 'Quadra', required: true },
  { key: 'logradouro', label: 'Logradouro', required: true },
  { key: 'numero', label: 'Número', required: true },
  { key: 'legenda', label: 'Legenda', required: false },
  { key: 'ordem', label: 'Ordem', required: false },
  { key: 'naoBater', label: 'Não Bater', required: false },
];

export const useImportTerritory = () => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<Mapping>>({});
  const [normalization, setNormalization] = useState<NormalizationRules>(DEFAULT_NORMALIZATION);
  const [rawData, setRawData] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uniqueFileLegends = useMemo(() => {
    const legendaHeader = mapping.legenda;
    if (!legendaHeader) return [];
    const index = headers.indexOf(legendaHeader);
    if (index === -1) return [];

    const legends = new Set<string>();
    rawData.forEach(row => {
      const val = String(row[index] || '').trim();
      if (val) legends.add(val);
    });
    return Array.from(legends).sort();
  }, [rawData, headers, mapping.legenda]);

  const parseSheetData = useCallback((wb: XLSX.WorkBook, sheetName: string) => {
    try {
      const ws = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (json.length > 0) {
        const headersFound = json[0].map(h => String(h));
        setHeaders(headersFound);
        setRawData(json.slice(1));

        // Auto-mapping
        const newMapping: Partial<Mapping> = {};
        FIELDS.forEach(field => {
          const match = headersFound.find(h =>
            h.toLowerCase() === field.label.toLowerCase() ||
            h.toLowerCase() === field.key.toLowerCase() ||
            (field.key === 'tipoTerritorio' && h.toLowerCase().includes('tipo')) ||
            (field.key === 'territorio' && h.toLowerCase() === 'território') ||
            (field.key === 'naoBater' && h.toLowerCase().includes('bater'))
          );
          if (match) {
            newMapping[field.key] = match;
          }
        });
        setMapping(newMapping);

        // Auto-suggest legend mappings
        const legendaHeader = newMapping.legenda;
        if (legendaHeader) {
          const lIndex = headersFound.indexOf(legendaHeader);
          const suggestedLegends: Record<string, string> = { ...DEFAULT_NORMALIZATION.legendaMapping };
          json.slice(1).forEach(row => {
            const val = String(row[lIndex] || '').trim();
            if (val && !suggestedLegends[val]) {
              const match = Object.entries(DEFAULT_NORMALIZATION.legendaMapping).find(([k]) =>
                k.toLowerCase() === val.toLowerCase() || val.toLowerCase().includes(k.toLowerCase())
              );
              if (match) {
                suggestedLegends[val] = match[1];
              }
            }
          });
          setNormalization(prev => ({ ...prev, legendaMapping: suggestedLegends }));
        }
      } else {
        setError('A aba selecionada está vazia.');
      }
    } catch (err) {
      setError('Erro ao ler os dados da aba.');
      console.error(err);
    }
  }, []);

  const onFileUpload = useCallback((file: File) => {
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);

        const firstSheet = wb.SheetNames[0];
        setSelectedSheet(firstSheet);
        parseSheetData(wb, firstSheet);
        setStep('mapping');
      } catch (err) {
        setError('Erro ao ler o arquivo Excel.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  }, [parseSheetData]);

  const onSheetChange = useCallback((sheetName: string) => {
    if (!workbook) return;
    setSelectedSheet(sheetName);
    parseSheetData(workbook, sheetName);
  }, [workbook, parseSheetData]);

  const mappedData = useMemo(() => {
    return rawData
      .filter(row => row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')) // Filter empty rows
      .map((row) => {
        const item: any = {};

        const getValue = (field: keyof Mapping) => {
          const headerName = mapping[field];
          if (!headerName) return undefined;
          const index = headers.indexOf(headerName);
          return index !== -1 ? row[index] : undefined;
        };

        item.TipoTerritorio = String(getValue('tipoTerritorio') || '');
        item.Território = String(getValue('territorio') || '');
        item.Quadra = Number(getValue('quadra'));
        item.Logradouro = String(getValue('logradouro') || '');
        item.Numero = String(getValue('numero') || '');

        const legendaRaw = String(getValue('legenda') || '').trim();
        item.Legenda = normalization.legendaMapping[legendaRaw] ?? (legendaRaw || 'Residência');

        item.Ordem = Number(getValue('ordem')) || undefined;

        const naoBaterRaw = String(getValue('naoBater') || '');
        item['Não Bater'] = normalization.naoBaterTrueValues.includes(naoBaterRaw);

        return item;
      });
  }, [rawData, headers, mapping, normalization]);

  const submitImport = useCallback(async () => {
    setStep('importing');
    setProgress(0);
    setError(null);

    // Fake progress interval
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      const api = new AxiosAdapter();
      const validData = mappedData.filter(row => row.TipoTerritorio && row.Território && !isNaN(row.Quadra) && row.Logradouro);

      const response = await api.post('territories/bulk', { rows: validData });

      clearInterval(interval);
      setProgress(100);

      if (response.status >= 200 && response.status < 300) {
        setStep('success');
      } else {
        setError(response.message || 'Erro ao importar territórios.');
        setStep('error');
      }
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || 'Erro na conexão com o servidor.');
      setStep('error');
    }
  }, [mappedData]);

  return {
    step,
    setStep,
    file,
    sheetNames,
    selectedSheet,
    onSheetChange,
    onFileUpload,
    headers,
    mapping,
    setMapping,
    normalization,
    setNormalization,
    mappedData,
    uniqueFileLegends,
    progress,
    setProgress,
    error,
    setError,
    submitImport,
    reset: () => {
      setStep('upload');
      setFile(null);
      setWorkbook(null);
      setSheetNames([]);
      setSelectedSheet('');
      setHeaders([]);
      setMapping({});
      setNormalization(DEFAULT_NORMALIZATION);
      setRawData([]);
      setProgress(0);
      setError(null);
    },
  };
};
