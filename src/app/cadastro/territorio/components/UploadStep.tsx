'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadStepProps {
  onFileUpload: (file: File) => void;
}

export function UploadStep({ onFileUpload }: UploadStepProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const downloadTemplate = () => {
    // In a real app, this would download a pre-defined Excel file
    // For now, we can just log or provide a link if available
    window.open('/templates/territory_import_template.xlsx', '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      <div
        {...getRootProps()}
        className={`w-full max-w-md p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
      >
        <input {...getInputProps()} />
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <p className="text-lg font-medium text-center">
          {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo Excel ou CSV'}
        </p>
        <p className="text-sm text-muted-foreground text-center mt-2">
          ou clique para selecionar do seu computador
        </p>
        <p className="text-[10px] text-blue-500 font-medium mt-4 bg-blue-50 px-2 py-1 rounded border border-blue-100">
          Apenas a primeira aba da planilha será importada
        </p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Suporta .xlsx, .xls e .csv</span>
        </div>

        <Button variant="outline" onClick={downloadTemplate} className="flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Baixar Planilha Modelo</span>
        </Button>
      </div>
    </div>
  );
}
