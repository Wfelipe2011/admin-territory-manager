"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapIcon, Upload, ImageIcon } from "lucide-react";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
const axiosv2 = new AxiosAdapter("v2");

interface TerritoryImageProps {
  imageUrl: string;
  name: string;
  territoryId: string | number;
  onImageUpload?: (
    territoryId: string | number,
    imageUrl: string
  ) => Promise<void> | void;
}

export function TerritoryImage({
  imageUrl,
  name,
  territoryId,
  onImageUpload,
}: TerritoryImageProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Criar URL de preview para a imagem selecionada
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosv2.postFile(
      `territories/${territoryId}/upload`,
      formData
    );
    if (response.status > 299) {
      throw new Error(response.message);
    }
    return response.data;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      await uploadImage(selectedFile);
      const imageUploaded = await uploadImage(selectedFile);
      if (onImageUpload) {
        await onImageUpload(territoryId, imageUploaded?.imageUrl);
      }

      // Limpar o estado após upload bem-sucedido
      setSelectedFile(null);
      setPreviewUrl(null);
      setOpen(false);
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MapIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mapa {name}</DialogTitle>
        </DialogHeader>

        <div className="py-4 flex flex-col items-center space-y-4">
          {/* Exibir imagem atual ou preview da nova imagem */}
          {previewUrl ? (
            <div className="relative w-full">
              <Image
                src={previewUrl || "/placeholder.svg"}
                alt={`Preview de ${name}`}
                className="max-h-[50vh] w-full object-contain"
                width={425}
                height={425}
              />
            </div>
          ) : imageUrl ? (
            <Image
              src={imageUrl || "/placeholder.svg"}
              loading="lazy"
              alt={name}
              className="max-h-[50vh] w-full object-contain"
              width={425}
              height={425}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] w-full border-2 border-dashed rounded-md border-gray-300 p-4">
              <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Nenhuma imagem disponível</p>
            </div>
          )}

          {/* Input para seleção de arquivo */}
          <div className="w-full">
            <Label htmlFor="image-upload" className="mb-2 block">
              Selecione uma imagem para upload
            </Label>
            <div className="flex gap-2">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="bg-primary hover:bg-primary/90"
          >
            {isUploading ? "Enviando..." : "Upload"}
            {!isUploading && <Upload className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
