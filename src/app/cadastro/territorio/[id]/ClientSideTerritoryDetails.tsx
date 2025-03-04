"use client";

import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { BlockForm } from "./ClientSideBlockForm";
import { useAddresses, useBlocks, useTerritory } from "./hooks";
import { formatZipCode } from "@/lib/formatZipCode";
import { DeleteBlock } from "./ClientSideDeleteBlock";
import { AddressDialog } from "./ClientSideAddressDialog";
import { useCallback } from "react";
import { MODE, RootModeScreen } from "@/components/RootModeScreen";
import { TerritoryImage } from "../TerritoryImage";
import { PageTitle } from "@/components/ui/PageTitle";

export function ClientSideTerritoryDetails() {
  const { id } = useParams();
  const {
    territory,
    fetchTerritory,
    updateImageUrl,
    mode: modeTerritory,
  } = useTerritory(Number(id));
  const { addresses, fetchAddresses, mode: modeAddress } = useAddresses();
  const {
    blocks,
    selectedBlock,
    setSelectedBlock,
    fetchBlocks,
    mode: modeBlocks,
  } = useBlocks(Number(id));
  const currentBlock = blocks.find(
    (block) => block.id === Number(selectedBlock)
  );

  const callBack = useCallback(() => {
    Promise.all([fetchTerritory(), fetchBlocks(), fetchAddresses()]);
  }, [fetchTerritory, fetchBlocks, fetchAddresses]);

  const modes = [modeTerritory, modeAddress, modeBlocks];
  const mode = modes.some((m) => m === MODE.LOADING)
    ? MODE.LOADING
    : MODE.SCREEN;
  return (
    <RootModeScreen mode={mode}>
      <PageTitle title="Edição Quadra, Rua e Casas" />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-700">
              {territory.name}
            </h1>
            <div className="flex items-center gap-2">
              <span>Mapa: </span>
              <TerritoryImage
                imageUrl={territory?.imageUrl}
                name={territory?.name}
                territoryId={String(id)}
                onImageUpload={(_, imageUrl) => updateImageUrl(imageUrl)}
              />
            </div>
            <BlockForm callBack={callBack} addresses={addresses} />
          </div>
        </div>
        <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow-md relative">
          <Tabs
            value={selectedBlock}
            onValueChange={(value) => setSelectedBlock(value)}
          >
            <div className="flex items-start overflow-x-auto h-14">
              <TabsList className="gap-4 bg-white">
                {blocks.map((block) => (
                  <TabsTrigger
                    key={block.id}
                    value={block.id.toString()}
                    className="data-[state=active]:bg-primary data-[state=active]:text-white bg-slate-200 hover:bg-secondary shadow-sm drop-shadow-sm rounded-md"
                  >
                    {block.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-700">
                  Endereços:
                </h1>
                <div className="flex gap-2">
                  {currentBlock && (
                    <DeleteBlock block={currentBlock} callBack={callBack} />
                  )}
                  {currentBlock && (
                    <BlockForm
                      block={currentBlock}
                      callBack={callBack}
                      addresses={addresses}
                    />
                  )}
                </div>
              </div>
              {blocks.map((block) => (
                <TabsContent key={block.id} value={block.id.toString()}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rua</TableHead>
                        <TableHead>CEP</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {block.addresses.map((address) => (
                        <TableRow key={address.id}>
                          <TableCell>{address.street}</TableCell>
                          <TableCell>
                            {formatZipCode(address.zipCode)}
                          </TableCell>
                          <TableCell>
                            <AddressDialog
                              address={address}
                              blockId={block.id}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </div>
    </RootModeScreen>
  );
}
