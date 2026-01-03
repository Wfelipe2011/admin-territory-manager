'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useImportTerritory } from './hooks/useImportTerritory';
import { UploadStep } from './components/UploadStep';
import { UnifiedImportView } from './components/UnifiedImportView';
import { ImportingStep } from './components/ImportingStep';

interface ImportTerritoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportTerritoryDialog({ open, onOpenChange, onSuccess }: ImportTerritoryDialogProps) {
  const importState = useImportTerritory();
  const { step, reset } = importState;

  const handleComplete = () => {
    if (step === 'success' && onSuccess) {
      onSuccess();
    }
    onOpenChange(false);
    // Reset state after a short delay to avoid flickering while modal closes
    setTimeout(reset, 300);
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset state when modal is closed manually
      setTimeout(reset, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Territórios</DialogTitle>
          <DialogDescription>
            Siga os passos para importar territórios de um arquivo Excel ou CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === 'upload' && <UploadStep onFileUpload={importState.onFileUpload} />}
          {step === 'mapping' && (
            <UnifiedImportView
              headers={importState.headers}
              mapping={importState.mapping}
              setMapping={importState.setMapping}
              normalization={importState.normalization}
              setNormalization={importState.setNormalization}
              mappedData={importState.mappedData}
              uniqueFileLegends={importState.uniqueFileLegends}
              sheetNames={importState.sheetNames}
              selectedSheet={importState.selectedSheet}
              onSheetChange={importState.onSheetChange}
              onConfirm={importState.submitImport}
              onBack={() => importState.setStep('upload')}
            />
          )}
          {(step === 'importing' || step === 'success' || step === 'error') && (
            <ImportingStep
              progress={importState.progress}
              onComplete={handleComplete}
              status={step === 'importing' ? 'importing' : step === 'success' ? 'success' : 'error'}
              error={importState.error}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
