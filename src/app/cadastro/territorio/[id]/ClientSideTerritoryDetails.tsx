'use client'

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { toast } from "react-hot-toast";
import { Block, BlockAddress, Territory } from "./type";
import { EyeIcon, SaveIcon, PencilIcon, TrashIcon, XIcon } from "lucide-react";
import { Button, Input, Label, Select, SelectValue, SelectItem, SelectContent, SelectTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { AddBlock } from "./ClientSideAddBlock";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
const axiosV1 = new AxiosAdapter(undefined, "v1");
const axiosV2 = new AxiosAdapter(undefined, "v2");

let filterTimeout: NodeJS.Timeout;
const debounce = (func: () => void, delay: number) => {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(func, delay);
}

export function ClientSideTerritoryDetails() {
    const [territory, setTerritory] = useState<Territory>({} as Territory);
    const [filter, setFilter] = useState<string>("");
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [selectedBlock, setSelectedBlock] = useState<string>();
    const { id } = useParams();

    const fetchBlocks = useCallback(async () => {
        try {
            const response = await axiosV2.get<Block[]>(`territories/${id}/blocks`);
            if (!response.data || response.status > 299) {
                throw new Error("Quadras não encontradas");
            }
            setBlocks(response.data);
            setSelectedBlock(response.data[0]?.id.toString());
        } catch (error) {
            toast.error("Erro ao buscar quadras");
            console.error(error);
        }
    }, [id]);
    useEffect(() => {
        fetchBlocks();
    }, [fetchBlocks]);

    const fetchTerritory = useCallback(async (filter?: string) => {
        try {
            const queries = filter ? `?round=1&filter=${filter}` : "?round=1";
            const response = await axiosV1.get<Territory>(`territories/${id}${queries}`);

            if (!response.data || response.status > 299) {
                throw new Error("Território não encontrado");
            }
            setTerritory(response.data);
        } catch (error) {
            toast.error("Erro ao buscar território");
            console.error(error);
        }
    }, [id]);
    useEffect(() => {
        fetchTerritory();
    }, [fetchTerritory]);

    useEffect(() => {
        debounce(() => {
            fetchTerritory(filter)
        }, 1000);
        return () => {
            clearTimeout(filterTimeout);
        }
    }, [filter, fetchTerritory]);

    const updateTerritoryName = (value: string) => {
        setTerritory((prev) => ({ ...prev, territoryName: value }));
    }

    const submitUpdate = async () => {
        try {
            // const response = await axios.put(`territories/${id}`, {
            //     territoryName: territory.territoryName
            // });
            // if (response.status > 299) {
            //     throw new Error("Erro ao atualizar território");
            // }
            // toast.success("Território atualizado com sucesso");
            toast.error("Não implementado")
        } catch (error) {
            toast.error("Erro ao atualizar território");
            console.error(error);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-slate-700">Território:</h1>
                <div className="grid grid-cols-12 gap-2">
                    <Label className="text-md text-slate-700 col-span-12">Nome do território</Label>
                    <Input type="text" placeholder="Nome do território" value={territory?.territoryName} onChange={(e) => updateTerritoryName(e.target.value)} className="col-span-11" />
                    <Button className="col-span-1" onClick={submitUpdate}><SaveIcon /></Button>
                </div>
            </div>
            <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-slate-700">Filtrar:</h1>
                <div className="grid grid-cols-12 gap-2">
                    <Label className="text-md text-slate-700 col-span-12">Pesquise o território</Label>
                    <Input type="text" placeholder="Pesquise o território" value={filter} onChange={(e) => setFilter(e.target.value)} className="col-span-6" />
                    <div className="col-span-6 flex justify-end">
                        <AddBlock />
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow-md">
                <Tabs value={selectedBlock} onValueChange={(value) => setSelectedBlock(value)}>
                    <TabsList className="gap-4 bg-white" >
                        {blocks.map((block) => (
                            <TabsTrigger
                                key={block.id}
                                value={block.id.toString()}
                                className="data-[state=active]:bg-primary data-[state=active]:text-white bg-slate-200 hover:bg-secondary"
                            >
                                {block.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="flex flex-col gap-2 mt-4">
                        <h1 className="text-2xl font-bold text-slate-700">Endereços:</h1>
                        {blocks.map((block) => (
                            <TabsContent key={block.id} value={block.id.toString()}>
                                {/* {block.addresses.map((address) => (
                                    <div key={address.id}>
                                        <span className="text-slate-700">{address.street}</span>
                                    </div>
                                ))} */}
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
                                                <TableCell>{address.zipCode}</TableCell>
                                                <TableCell>
                                                    <AddressDialog address={address} blockId={block.id} />
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
    );
}

const legendas = [
    { name: "Fundos" },
    { name: "Terreno" },
    { name: "Comércio" },
    { name: "Testemunha de Jeová" },
    { name: "Igreja" },
    { name: "Hospital" },
    { name: "Escola" },
    { name: "Residência" },
    { name: "Prédio" },
  ]
interface House {
    id: number;
    dontVisit: boolean;
    legend: string;
    number: string;
    street: string;
    observations: string | null;
    order: number;
}
interface AddressDialogProps {
    address: BlockAddress;
    blockId: number;
}
const AddressDialog = ({ address, blockId }: AddressDialogProps) => {
    const [opened, setOpened] = useState(false);
    const [houses, setHouses] = useState<House[]>([]);
    const [editingHouse, setEditingHouse] = useState<House>();
    const [deletingHouse, setDeletingHouse] = useState<House>();
    const { id } = useParams();

    const fetchHouses = useCallback(async () => {
        try {
            const url = `territories/${id}/edit?blockId=${blockId}&page=1&pageSize=1000`
            const response = await axiosV1.get<{ house: House[] }>(url);
            if (!response.data || response.status > 299) {
                throw new Error("Erro ao buscar casas");
            }
            setHouses(response.data.house);
        } catch (error) {
            console.error(error);
        }
    }, [address, blockId, id]);
    useEffect(() => {
        fetchHouses();
    }, [fetchHouses]);

    const handleEditHouse = (house: House) => {
        if (editingHouse?.id === house.id) {
            setHouses(prev => {
                const oldHouse = prev.find(h => h.id === editingHouse?.id);
                if (!oldHouse) return prev;
                const newHouse = { ...oldHouse, ...editingHouse };
                return prev.map(h => h.id === house.id ? newHouse : h);
            })
            setEditingHouse(undefined);
            return;
        }
        setEditingHouse(house);
    }

    return (
        <Dialog open={opened} onOpenChange={setOpened}>
            <DialogTrigger>
                <Button variant="outline" size="icon"><EyeIcon /></Button>
            </DialogTrigger>
            <DialogContent className="min-w-[40vw] max-w-[80vw] w-full lg:min-w-[800px] lg:max-w-[1000px] md:min-w-[600px] md:max-w-[80vw]">
                <DialogHeader>
                    <DialogTitle>{address.street}</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    <span>{address.zipCode}</span>
                </DialogDescription>
                <div className="overflow-y-auto max-h-[500px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>N° Casa</TableHead>
                                <TableHead>Legenda</TableHead>
                                <TableHead>Não Bater</TableHead>
                                <TableHead className="text-center">Editar</TableHead>
                                <TableHead className="text-center">Deletar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {houses.map((house) => (
                                <TableRow key={house.id}>
                                    <TableCell className="w-4/12">
                                        {editingHouse?.id === house.id ? (
                                            <Input  type="text" value={editingHouse.number} onChange={(e) => setEditingHouse({ ...editingHouse, number: e.target.value })} />
                                        ) : (
                                            house.number
                                        )}
                                    </TableCell>
                                    <TableCell className="w-3/12">
                                        {editingHouse?.id === house.id ? (
                                            <Select value={editingHouse.legend} onValueChange={(value) => setEditingHouse({ ...editingHouse, legend: value })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={editingHouse.legend} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {legendas.map((legend) => (
                                                        <SelectItem key={legend.name} value={legend.name}>{legend.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            house.legend
                                        )}
                                    </TableCell>
                                    <TableCell className="w-2/12">
                                        {editingHouse?.id === house.id ? (
                                            <Select value={editingHouse.dontVisit ? "true" : "false"} onValueChange={(value) => setEditingHouse({ ...editingHouse, dontVisit: value === "true" })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={house.dontVisit ? "Sim" : "Não"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="true">Sim</SelectItem>
                                                    <SelectItem value="false">Não</SelectItem>
                                                </SelectContent>

                                            </Select>
                                        ) :
                                            house.dontVisit ? "Sim" : "Não"
                                        }
                                    </TableCell>
                                    <TableCell className="w-3/12">
                                        <div className="flex gap-2 justify-center">

                                            {editingHouse && editingHouse.id !== house.id ? (
                                                <Button disabled variant="outline" size="icon" title={"Edição em andamento na casa " + house.number} className="cursor-not-allowed"><PencilIcon className="text-blue-500 opacity-90 animate-pulse" /></Button>
                                            ) : (
                                                <>
                                                    <Button variant="outline" size="icon" onClick={() => handleEditHouse(house)} title={editingHouse?.id === house.id ? "Salvar alteração" : "Editar casa"}>{editingHouse?.id === house.id ? <SaveIcon className="text-green-500" /> : <PencilIcon className="text-blue-500" />}</Button>
                                                    {editingHouse?.id === house.id && <Button variant="outline" size="icon" onClick={() => setEditingHouse(undefined)} title="Cancelar edição"><XIcon className="text-red-500" /></Button>}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="w-3/12">
                                        <div className="flex gap-2 justify-center">
                                            {/* <Button variant="outline" size="icon" title="Deletar casa"><TrashIcon className="text-red-500" /></Button> */}
                                            {deletingHouse && deletingHouse.id === house.id ? (
                                                <>
                                                    <Button variant="outline" size="icon" title={"Confirmar"}><SaveIcon className="text-green-500" /></Button>
                                                    <Button variant="outline" size="icon" title={"Cancelar"} onClick={() => setDeletingHouse(undefined)}><XIcon className="text-red-500" /></Button>
                                                </>
                                            ) : (
                                                <Button variant="outline" size="icon" title={"Deletar casa"} onClick={() => setDeletingHouse(house)}><TrashIcon className="text-red-500" /></Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}