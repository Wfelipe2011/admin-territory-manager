'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface ImportingStepProps {
  progress: number;
  onComplete: () => void;
  status: 'importing' | 'success' | 'error';
  error?: string | null;
}

export function ImportingStep({ progress, onComplete, status, error }: ImportingStepProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12">
      {status === 'importing' && (
        <>
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">Importando territórios...</h3>
            <p className="text-sm text-muted-foreground">Isso pode levar alguns instantes.</p>
          </div>
          <div className="w-full max-w-md space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-right text-muted-foreground">{progress}%</p>
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">Importação concluída!</h3>
            <p className="text-sm text-muted-foreground">Os territórios foram importados com sucesso.</p>
          </div>
          <Button onClick={onComplete}>Fechar</Button>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="bg-destructive/10 p-4 rounded-full">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-destructive">Erro na importação</h3>
            <p className="text-sm text-muted-foreground">{error || 'Ocorreu um erro inesperado.'}</p>
          </div>
          <Button variant="outline" onClick={onComplete}>Fechar</Button>
        </>
      )}
    </div>
  );
}
