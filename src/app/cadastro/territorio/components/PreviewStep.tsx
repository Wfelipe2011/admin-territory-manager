'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle } from 'lucide-react';

interface PreviewStepProps {
  data: any[];
  onBack: () => void;
  onConfirm: () => void;
}

export function PreviewStep({ data, onBack, onConfirm }: PreviewStepProps) {
  const isValid = (row: any) => {
    return row.tipoTerritorio && row.territorio && !isNaN(row.quadra) && row.logradouro;
  };

  const validRows = data.filter(isValid).length;
  const invalidRows = data.length - validRows;

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            {validRows} Válidos
          </Badge>
          {invalidRows > 0 && (
            <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5">
              {invalidRows} Inválidos
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {data.length} registros
        </div>
      </div>

      <ScrollArea className="flex-1 border rounded-md h-[400px]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Território</TableHead>
              <TableHead>Quadra</TableHead>
              <TableHead>Logradouro</TableHead>
              <TableHead>Nº</TableHead>
              <TableHead>Legenda</TableHead>
              <TableHead>Não Bater</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => {
              const rowValid = isValid(row);
              return (
                <TableRow key={index} className={!rowValid ? 'bg-destructive/5' : ''}>
                  <TableCell>
                    {rowValid ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell>{row.tipoTerritorio}</TableCell>
                  <TableCell>{row.territorio}</TableCell>
                  <TableCell>{row.quadra}</TableCell>
                  <TableCell>{row.logradouro}</TableCell>
                  <TableCell>{row.numero}</TableCell>
                  <TableCell>{row.legenda}</TableCell>
                  <TableCell>
                    {row.naoBater ? (
                      <Badge variant="secondary">Sim</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Voltar ao Mapeamento
        </Button>
        <Button onClick={onConfirm} disabled={validRows === 0}>
          Confirmar Importação ({validRows})
        </Button>
      </div>
    </div>
  );
}
