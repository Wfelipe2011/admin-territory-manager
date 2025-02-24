'use client'

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { toast } from "react-hot-toast";
import { Block, BlockAddress, Territory } from "./type";
import { EyeIcon, SaveIcon, PencilIcon, TrashIcon, XIcon } from "lucide-react";
import { Button, Input, Select, SelectValue, SelectItem, SelectContent, SelectTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { BlockForm } from "./ClientSideAddBlock";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
const axiosV1 = new AxiosAdapter(undefined, "v1");
const axiosV2 = new AxiosAdapter(undefined, "v2");

export function ClientSideTerritoryDetails() {
    const [territory, setTerritory] = useState<Territory>({} as Territory);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [selectedBlock, setSelectedBlock] = useState<string>();
    const { id } = useParams();

    const fetchBlocks = useCallback(async () => {
        try {
            const response = await axiosV2.get<Block[]>(`territories/${id}/blocks`);
            if (!response.data || response.status > 299) {
                throw new Error("Quadras não encontradas");
            }
            const blocks = response.data.sort((a, b) => a.name.localeCompare(b.name));
            setBlocks(blocks);
            if (!selectedBlock) {
                setSelectedBlock(blocks[0]?.id.toString());
            }
        } catch (error) {
            toast.error("Erro ao buscar quadras");
            console.error(error);
        }
    }, [id, selectedBlock]);
    useEffect(() => {
        fetchBlocks();
    }, [fetchBlocks]);

    const fetchTerritory = useCallback(async (filter?: string) => {
        try {
            const queries = filter ? `?filter=${filter}` : "";
            const response = await axiosV2.get<Territory>(`territories/${id}${queries}`);

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

    const currentBlock = blocks.find((block) => block.id === Number(selectedBlock));
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-slate-700">{territory.territoryName}</h1>
                    <BlockForm callBack={fetchBlocks} />
                </div>
            </div>
            <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow-md relative">
                <Tabs value={selectedBlock} onValueChange={(value) => setSelectedBlock(value)}>
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
                            <h1 className="text-2xl font-bold text-slate-700">Endereços:</h1>
                            <BlockForm block={currentBlock} callBack={fetchBlocks} />
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
    const [draggedItem, setDraggedItem] = useState<House | null>(null);
    const { id } = useParams();

    const fetchHouses = useCallback(async () => {
        try {
            const url = `territories/${id}/edit?blockId=${blockId}&page=1&pageSize=1000`
            const response = await axiosV1.get<{ house: House[] }>(url);
            if (!response.data || response.status > 299) {
                throw new Error("Erro ao buscar casas");
            }
            const houses = response.data.house.sort((a, b) => a.order - b.order);
            setHouses(houses);
        } catch (error) {
            console.error(error);
        }
    }, [blockId, id]);

    useEffect(() => {
        fetchHouses();
    }, [fetchHouses]);

    const updateHouse = async (house: House) => {
        try {
            const body = {
                streetId: address.id,
                number: house.number,
                legend: house.legend,
                dontVisit: house.dontVisit,
                territoryId: Number(id),
                blockId: blockId
            }
            const response = await axiosV1.put(`houses/${house.id}`, body);
            if (!response.data || response.status > 299) {
                throw new Error("Erro ao atualizar casa");
            }
            toast.success("Casa atualizada com sucesso");
        } catch (error) {
            toast.error("Erro ao atualizar casa");
            console.error(error);
        }
    }

    const handleEditHouse = (house: House) => {
        if (editingHouse?.id === house.id) {
            setHouses(prev => {
                const oldHouse = prev.find(h => h.id === editingHouse?.id);
                if (!oldHouse) return prev;
                const newHouse = { ...oldHouse, ...editingHouse };
                return prev.map(h => h.id === house.id ? newHouse : h);
            })
            updateHouse(editingHouse);
            setEditingHouse(undefined);
            return;
        }
        setEditingHouse(house);
    }

    const saveNewOrder = async () => {
        try {
            const response = await axiosV1.post(`houses/order`, {
                houses: houses.map((house, index) => ({
                    id: house.id,
                    order: index + 1
                }))
            })
            if (!response.data || response.status > 299) {
                throw new Error("Erro ao salvar nova ordem");
            }
            toast.success("Ordem salva com sucesso");
        } catch (error) {
            console.error(error);
        }
    }

    const handleDragStart = (e: React.DragEvent, house: House) => {
        setDraggedItem(house);
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragOver = (e: React.DragEvent, targetHouse: House) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.id === targetHouse.id) return;

        const draggedIndex = houses.findIndex(h => h.id === draggedItem.id);
        const targetIndex = houses.findIndex(h => h.id === targetHouse.id);

        if (draggedIndex === targetIndex) return;

        const newHouses = [...houses];
        const [removed] = newHouses.splice(draggedIndex, 1);
        newHouses.splice(targetIndex, 0, removed);

        setHouses(newHouses.map((house, index) => ({
            ...house,
            order: index + 1
        })));
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedItem(null);
        e.currentTarget.classList.remove('opacity-50');
        saveNewOrder();
    };

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
                    <span>Adicionar opção de cadastrar nova casa</span> <br />
                    <span>{address.zipCode}</span>
                </DialogDescription>
                <div className="overflow-y-auto max-h-[500px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]"></TableHead>
                                <TableHead>N° Casa</TableHead>
                                <TableHead>Legenda</TableHead>
                                <TableHead>Não Bater</TableHead>
                                <TableHead className="text-center">Editar</TableHead>
                                <TableHead className="text-center">Deletar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {houses.map((house) => (
                                <TableRow
                                    key={house.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, house)}
                                    onDragOver={(e) => handleDragOver(e, house)}
                                    onDragEnd={handleDragEnd}
                                    className="hover:bg-gray-100"
                                >
                                    <TableCell className="w-[40px] cursor-move">
                                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" />
                                        </svg>
                                    </TableCell>
                                    <TableCell className="w-4/12">
                                        {editingHouse?.id === house.id ? (
                                            <Input type="text" value={editingHouse.number} onChange={(e) => setEditingHouse({ ...editingHouse, number: e.target.value })} />
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