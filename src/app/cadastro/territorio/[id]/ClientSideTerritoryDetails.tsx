'use client'

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { toast } from "react-hot-toast";
import { BlockAddress, House } from "./type";
import { EyeIcon, SaveIcon, PencilIcon, TrashIcon, XIcon, PlusIcon } from "lucide-react";
import { Button, Input, Select, SelectValue, SelectItem, SelectContent, SelectTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { BlockForm } from "./ClientSideAddBlock";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAddresses, useBlocks, useTerritory } from "./hooks";
import { formatZipCode } from "@/lib/formatZipCode";
const axiosV1 = new AxiosAdapter(undefined, "v1");

export function ClientSideTerritoryDetails() {
    const { id } = useParams();
    const { territory } = useTerritory(Number(id));
    const { addresses, fetchAddresses } = useAddresses();
    const { blocks, selectedBlock, setSelectedBlock, fetchBlocks } = useBlocks(Number(id));

    const currentBlock = blocks.find((block) => block.id === Number(selectedBlock));
    const callBack = () => {
        fetchBlocks();
        fetchAddresses();
    }
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-slate-700">{territory.name}</h1>
                    <BlockForm callBack={callBack} addresses={addresses} />
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
                            <BlockForm block={currentBlock} callBack={callBack} addresses={addresses} />
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
                                                <TableCell>{formatZipCode(address.zipCode)}</TableCell>
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
interface AddressDialogProps {
    address: BlockAddress;
    blockId: number;
}
interface SubmitHouseBody {
    streetId: number;
    number: string;
    legend: string;
    dontVisit: boolean;
    territoryId: number;
    blockId: number;
}
const NEW_HOUSE: House = {
    id: 0,
    number: "",
    legend: "",
    dontVisit: false,
    order: 0,
    street: "",
    observations: ""
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

    const submitHouse = async (house: House) => {
        const body = {
            streetId: address.id,
            number: house.number,
            legend: house.legend,
            dontVisit: house.dontVisit,
            territoryId: Number(id),
            blockId: blockId
        }
        if (house.id === 0) {
            createHouse(body)
        } else {
            updateHouse(body, house.id)
        }
    }

    const createHouse = async (body: SubmitHouseBody) => {
        try {
            const response = await axiosV1.post(`houses`, body);
            if (!response.data || response.status > 299) {
                throw new Error("Erro ao criar casa");
            }
            const newHouseRaw = response.data;
            setHouses(prev => {
                const newHouse: House = {
                    id: newHouseRaw.id,
                    number: newHouseRaw.number,
                    legend: newHouseRaw.legend,
                    dontVisit: newHouseRaw.dontVisit,
                    order: newHouseRaw.order,
                    street: newHouseRaw?.street,
                    observations: newHouseRaw.observations
                }
                return [newHouse, ...prev];
            })
            toast.success("Casa criada com sucesso");
        } catch (error) {
            toast.error("Erro ao criar casa");
            console.error(error);
        }
    }

    const updateHouse = async (body: SubmitHouseBody, houseId: number) => {
        try {
            const response = await axiosV1.put(`houses/${houseId}`, body);
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
        if (house.id === editingHouse?.id) {
            setHouses(prev => {
                const isNewHouse = editingHouse?.id === 0;
                if (isNewHouse) {
                    return prev.filter(h => h.id !== 0);
                }
                const oldHouse = prev.find(h => h.id === editingHouse?.id);
                if (!oldHouse) return prev;
                const newHouse = { ...oldHouse, ...editingHouse };
                return prev.map(h => h.id === house.id ? newHouse : h);
            })
            submitHouse(editingHouse);
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

    const handleAddHouse = () => {
        const hasAnHouseWithoutId = houses.some((house) => house.id === 0);
        if (hasAnHouseWithoutId) {
            return;
        }
        setHouses((prev) => {
            return [NEW_HOUSE, ...prev];
        });
        setEditingHouse(NEW_HOUSE);
    }

    return (
        <Dialog open={opened} onOpenChange={setOpened}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon"><EyeIcon /></Button>
            </DialogTrigger>
            <DialogContent className="min-w-[40vw] max-w-[80vw] w-full lg:min-w-[800px] lg:max-w-[1000px] md:min-w-[600px] md:max-w-[80vw]">
                <DialogHeader>
                    <DialogTitle>{address.street}</DialogTitle>
                </DialogHeader>
                <DialogDescription className="flex justify-between items-center">
                    <span>Essa rua possui {houses.length} casa{houses.length > 1 ? "s" : ""}</span>
                    <Button disabled={houses?.some((house) => house?.id === 0)} onClick={handleAddHouse} variant="outline" className="flex items-center gap-2 bg-primary text-white hover:text-primary hover:border-primary shadow-md hover:shadow-sm">Adicionar casa<PlusIcon /></Button>
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
                                    draggable={editingHouse?.id === 0 ? false : true}
                                    onDragStart={(e) => editingHouse?.id === 0 ? {} : handleDragStart(e, house)}
                                    onDragOver={(e) => editingHouse?.id === 0 ? {} : handleDragOver(e, house)}
                                    onDragEnd={(e) => editingHouse?.id === 0 ? {} : handleDragEnd(e)}
                                    className={`hover:bg-gray-100 ${editingHouse?.id === house.id ? "h-20 bg-green-50" : ""}`}
                                >
                                    <TableCell className={`w-[40px] ${editingHouse?.id === 0 ? "" : "cursor-move"}`}>
                                        <svg className={`w-6 h-6 text-gray-500 ${editingHouse?.id === 0 ? "invisible" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" />
                                        </svg>
                                    </TableCell>
                                    <TableCell className="w-4/12">
                                        {editingHouse?.id === house.id ? (
                                            <Input className="bg-white" type="text" value={editingHouse.number} onChange={(e) => setEditingHouse({ ...editingHouse, number: e.target.value })} />
                                        ) : (
                                            <span>{house.number}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="w-3/12">
                                        {editingHouse?.id === house.id ? (
                                            <Select value={editingHouse.legend} onValueChange={(value) => setEditingHouse({ ...editingHouse, legend: value })}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder={editingHouse.legend} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {legendas.map((legend) => (
                                                        <SelectItem key={legend.name} value={legend.name}>{legend.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span>{house.legend}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="w-2/12">
                                        {editingHouse?.id === house.id ? (
                                            <Select value={editingHouse.dontVisit ? "true" : "false"} onValueChange={(value) => setEditingHouse({ ...editingHouse, dontVisit: value === "true" })}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder={house.dontVisit ? "Sim" : "Não"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="true">Sim</SelectItem>
                                                    <SelectItem value="false">Não</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span>{house.dontVisit ? "Sim" : "Não"}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="w-3/12">
                                        <div className="flex gap-2 justify-center">
                                            {editingHouse && editingHouse.id !== house.id ? (
                                                <Button disabled variant="outline" size="icon" title={"Edição em andamento na casa " + house.number} className="cursor-not-allowed"><PencilIcon className="text-blue-500 opacity-90 animate-pulse" /></Button>
                                            ) : (
                                                <>
                                                    <Button variant="outline" disabled={editingHouse && (!editingHouse?.number || !editingHouse?.legend)} size="icon" onClick={() => handleEditHouse(house)} title={editingHouse?.id === house.id ? "Salvar alteração" : "Editar casa"}>{editingHouse?.id === house.id ? <SaveIcon className="text-green-500" /> : <PencilIcon className="text-blue-500" />}</Button>
                                                    {editingHouse?.id === house.id && <Button variant="outline" size="icon" onClick={() => {
                                                        setEditingHouse(undefined);
                                                        setHouses(prev => prev.filter(h => h.id !== 0));
                                                    }} title="Cancelar edição"><XIcon className="text-red-500" /></Button>}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="w-3/12">
                                        <div className="flex gap-2 justify-center">
                                            {deletingHouse && deletingHouse.id === house.id && (
                                                <>
                                                    <Button variant="outline" size="icon" title={"Confirmar"}><SaveIcon className="text-green-500" /></Button>
                                                    <Button variant="outline" size="icon" title={"Cancelar"} onClick={() => setDeletingHouse(undefined)}><XIcon className="text-red-500" /></Button>
                                                </>
                                            )}
                                            <Button variant="outline" size="icon" title={"Deletar casa"} onClick={() => setDeletingHouse(house)} className={`${(deletingHouse && deletingHouse.id === house.id) || (editingHouse?.id === house.id && editingHouse?.id === 0) ? "hidden" : ""}`}>
                                                <TrashIcon className="text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog >
    )
}