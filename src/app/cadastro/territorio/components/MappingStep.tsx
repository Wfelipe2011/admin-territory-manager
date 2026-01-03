'use client';

import React, { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mapping, NormalizationRules } from '../hooks/useImportTerritory';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MappingStepProps {
  headers: string[];
  mapping: Partial<Mapping>;
  setMapping: (mapping: Partial<Mapping>) => void;
  normalization: NormalizationRules;
  setNormalization: (normalization: NormalizationRules) => void;
  onNext: () => void;
  sheets: string[];
  selectedSheet: string;
  onSheetChange: (sheet: string) => void;
}

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

export function MappingStep({
  headers,
  mapping,
  setMapping,
  normalization,
  setNormalization,
  onNext,
  sheets,
  selectedSheet,
  onSheetChange,
}: MappingStepProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Auto-mapping logic
  useEffect(() => {
    const newMapping = { ...mapping };
    let changed = false;

    FIELDS.forEach(field => {
      if (!newMapping[field.key]) {
        const match = headers.find(h =>
          h.toLowerCase() === field.label.toLowerCase() ||
          h.toLowerCase() === field.key.toLowerCase() ||
          (field.key === 'tipoTerritorio' && h.toLowerCase().includes('tipo')) ||
          (field.key === 'territorio' && h.toLowerCase() === 'território') ||
          (field.key === 'naoBater' && h.toLowerCase().includes('bater'))
        );
        if (match) {
          newMapping[field.key] = match;
          changed = true;
        }
      }
    });

    if (changed) {
      setMapping(newMapping);
    }
  }, [headers]);

  const handleMappingChange = (field: keyof Mapping, value: string) => {
    setMapping({ ...mapping, [field]: value === 'none' ? undefined : value });
  };

  const isReady = FIELDS.filter(f => f.required).every(f => !!mapping[f.key]);

  return (
    <div className="space-y-6">
      {sheets.length > 1 && (
        <div className="space-y-2 pb-4 border-b">
          <Label>Selecione a Planilha (Sheet)</Label>
          <Select value={selectedSheet} onValueChange={onSheetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a planilha" />
            </SelectTrigger>
            <SelectContent>
              {sheets.map((sheet) => (
                <SelectItem key={sheet} value={sheet}>
                  {sheet}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label className="flex items-center">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={mapping[field.key] || 'none'}
              onValueChange={(value) => handleMappingChange(field.key, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a coluna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {headers.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 text-muted-foreground"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>Configurações de Normalização</span>
        </Button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 p-4 bg-muted/30 rounded-lg border">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Valores para "Não Bater" (Verdadeiro)
              </Label>
              <Input
                placeholder="Sim, X, 1 (separados por vírgula)"
                value={normalization.naoBaterTrueValues.join(', ')}
                onChange={(e) => setNormalization({
                  ...normalization,
                  naoBaterTrueValues: e.target.value.split(',').map(v => v.trim()).filter(v => v !== '')
                })}
              />
              <p className="text-[10px] text-muted-foreground">
                Qualquer valor na coluna mapeada que coincida com estes será tratado como "Não Bater: Sim".
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onNext} disabled={!isReady}>
          Visualizar Dados
        </Button>
      </div>
    </div>
  );
}
