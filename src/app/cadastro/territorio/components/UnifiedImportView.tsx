'use client';

import React, { useState } from 'react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Mapping, NormalizationRules } from '../hooks/useImportTerritory';

interface UnifiedImportViewProps {
    headers: string[];
    mapping: Partial<Mapping>;
    setMapping: (mapping: Partial<Mapping>) => void;
    normalization: NormalizationRules;
    setNormalization: (normalization: NormalizationRules) => void;
    mappedData: any[];
    uniqueFileLegends: string[];
    sheetNames: string[];
    selectedSheet: string;
    onSheetChange: (sheetName: string) => void;
    onConfirm: () => void;
    onBack: () => void;
}

const LEGENDA_OPTIONS = [
    { value: 'Residência', label: 'Residência' },
    { value: 'Comércio', label: 'Comércio' },
    { value: 'Terreno', label: 'Terreno' },
    { value: 'Fundos', label: 'Fundos' },
    { value: 'Testemunha de Jeová', label: 'Testemunha de Jeová' },
    { value: 'Igreja', label: 'Igreja' },
    { value: 'Escola', label: 'Escola' },
    { value: 'Hospital', label: 'Hospital' },
    { value: 'Apartamento', label: 'Apartamento' },
];

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

export function UnifiedImportView({
    headers,
    mapping,
    setMapping,
    normalization,
    setNormalization,
    mappedData,
    uniqueFileLegends,
    sheetNames,
    selectedSheet,
    onSheetChange,
    onConfirm,
    onBack,
}: UnifiedImportViewProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleMappingChange = (field: keyof Mapping, value: string) => {
        setMapping({ ...mapping, [field]: value === 'none' ? undefined : value });
    };

    const handleLegendMappingChange = (fileValue: string, systemValue: string) => {
        setNormalization({
            ...normalization,
            legendaMapping: {
                ...normalization.legendaMapping,
                [fileValue]: systemValue
            }
        });
    };

    const getRowErrors = (row: any) => {
        const errors = [];
        if (!row.TipoTerritorio) errors.push('Tipo ausente');
        if (!row.Território) errors.push('Território ausente');
        if (isNaN(row.Quadra)) errors.push('Quadra inválida');
        if (!row.Logradouro) errors.push('Logradouro ausente');
        return errors;
    };

    const isValid = (row: any) => getRowErrors(row).length === 0;

    const validRows = mappedData.filter(isValid).length;
    const invalidRows = mappedData.length - validRows;
    const isReady = FIELDS.filter(f => f.required).every(f => !!mapping[f.key]);

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Sheet Selection */}
            {sheetNames.length > 1 && (
                <div className="flex items-center space-x-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <Label className="text-sm font-medium text-amber-900 whitespace-nowrap">Planilha (Aba):</Label>
                    <Select value={selectedSheet} onValueChange={onSheetChange}>
                        <SelectTrigger className="h-8 bg-white border-amber-200 text-amber-900">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {sheetNames.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-amber-700">O arquivo possui múltiplas abas. Selecione a que contém os dados.</p>
                </div>
            )}

            {/* Mapping Controls */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold">Mapeamento de Colunas</Label>
                    <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-muted-foreground"
                        onClick={() => setMapping({})}
                    >
                        Limpar Mapeamento
                    </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-xl border shadow-sm">
                    {FIELDS.map((field) => (
                        <div key={field.key} className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center">
                                {field.label}
                                {field.required && <span className="text-destructive ml-0.5">*</span>}
                            </Label>
                            <Select
                                value={mapping[field.key] || 'none'}
                                onValueChange={(value) => handleMappingChange(field.key, value)}
                            >
                                <SelectTrigger className="h-8 text-xs bg-white">
                                    <SelectValue placeholder="Selecionar..." />
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
            </div>

            {/* Advanced Normalization */}
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground flex items-center space-x-1"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    <span>Configurações de Normalização</span>
                </Button>

                {showAdvanced && (
                    <div className="mt-2 p-3 bg-muted/20 rounded-lg border border-dashed space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                                Valores para "Não Bater" (Verdadeiro)
                            </Label>
                            <Input
                                className="h-8 text-xs"
                                placeholder="Sim, X, 1..."
                                value={normalization.naoBaterTrueValues.join(', ')}
                                onChange={(e) => setNormalization({
                                    ...normalization,
                                    naoBaterTrueValues: e.target.value.split(',').map(v => v.trim()).filter(v => v !== '')
                                })}
                            />
                        </div>

                        {uniqueFileLegends.length > 0 && (
                            <div className="space-y-3 pt-2 border-t border-dashed">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                                    Mapeamento de Legendas ({uniqueFileLegends.length} encontradas)
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                    {uniqueFileLegends.map((fileLegend) => (
                                        <div key={fileLegend} className="flex items-center justify-between space-x-2">
                                            <span className="text-xs truncate max-w-[120px]" title={fileLegend}>
                                                {fileLegend}
                                            </span>
                                            <Select
                                                value={normalization.legendaMapping[fileLegend] || 'Residência'}
                                                onValueChange={(val) => handleLegendMappingChange(fileLegend, val)}
                                            >
                                                <SelectTrigger className="h-7 text-[10px] w-[140px]">
                                                    <SelectValue placeholder="Mapear para..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {LEGENDA_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Preview Table */}
            <div className="flex-1 flex flex-col min-h-0 space-y-2">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-medium">Preview dos Dados</h3>
                    <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-[10px] h-5 text-green-600 border-green-200 bg-green-50">
                            {validRows} Válidos
                        </Badge>
                        {invalidRows > 0 && (
                            <Badge variant="outline" className="text-[10px] h-5 text-destructive border-destructive/20 bg-destructive/5">
                                {invalidRows} Inválidos
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex-1 border rounded-lg overflow-hidden bg-white">
                    <ScrollArea className="h-[350px]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[40px]"></TableHead>
                                    <TableHead className="text-xs">Tipo</TableHead>
                                    <TableHead className="text-xs">Território</TableHead>
                                    <TableHead className="text-xs">Quadra</TableHead>
                                    <TableHead className="text-xs">Logradouro</TableHead>
                                    <TableHead className="text-xs">Nº</TableHead>
                                    <TableHead className="text-xs">Legenda</TableHead>
                                    <TableHead className="text-xs">Não Bater</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mappedData.slice(0, 50).map((row, index) => {
                                    const errors = getRowErrors(row);
                                    const rowValid = errors.length === 0;
                                    return (
                                        <TableRow key={index} className={`h-8 ${!rowValid ? 'bg-destructive/5' : ''}`}>
                                            <TableCell className="py-1">
                                                {rowValid ? (
                                                    <Check className="w-3 h-3 text-green-500" />
                                                ) : (
                                                    <div className="group relative">
                                                        <AlertCircle className="w-3 h-3 text-destructive cursor-help" />
                                                        <div className="absolute left-6 top-0 hidden group-hover:block z-50 bg-destructive text-white text-[10px] p-1 rounded shadow-lg whitespace-nowrap">
                                                            {errors.join(', ')}
                                                        </div>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-1 text-xs">{row.TipoTerritorio || '-'}</TableCell>
                                            <TableCell className="py-1 text-xs">{row.Território || '-'}</TableCell>
                                            <TableCell className="py-1 text-xs">{row.Quadra || '-'}</TableCell>
                                            <TableCell className="py-1 text-xs">{row.Logradouro || '-'}</TableCell>
                                            <TableCell className="py-1 text-xs">{row.Numero || '-'}</TableCell>
                                            <TableCell className="py-1 text-xs">{row.Legenda || '-'}</TableCell>
                                            <TableCell className="py-1 text-xs">
                                                {row['Não Bater'] ? (
                                                    <Badge variant="secondary" className="text-[10px] px-1 h-4">Sim</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {mappedData.length > 50 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-4">
                                            Mostrando os primeiros 50 de {mappedData.length} registros...
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="ghost" onClick={onBack}>
                    Trocar Arquivo
                </Button>
                <div className="flex items-center space-x-3">
                    <p className="text-xs text-muted-foreground">
                        {validRows} registros prontos para importar
                    </p>
                    <Button onClick={onConfirm} disabled={!isReady || validRows === 0}>
                        Importar Agora
                    </Button>
                </div>
            </div>
        </div>
    );
}
