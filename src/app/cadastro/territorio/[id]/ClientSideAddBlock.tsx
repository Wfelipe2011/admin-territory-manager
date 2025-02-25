'use client'

import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogTrigger, DialogClose, DialogFooter, Button, Input, Label, Separator, Datalist } from "@/components/ui";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "next/navigation";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import type { Block as BlockType } from "./type";
import type { Address as AddressType } from "./hooks";
import { formatZipCode } from "@/lib/formatZipCode";
const axiosV2 = new AxiosAdapter(undefined, "v2");

interface UpsertBlockDto {
    id?: number;
    name: string;
    addresses: UpsertAddressDto[];
}

interface UpsertAddressDto {
    id?: number;
    street: string;
    zipCode: string;
}

interface BlockFormProps {
    block?: BlockType;
    callBack: () => void;
    addresses: AddressType[];
}
interface Block {
    id: number | undefined;
    name: string;
}
interface Address {
    id: string;
    street: string;
    zip_code: string;
}
export function BlockForm({ block: initialBlock, callBack, addresses: existingAddresses }: BlockFormProps) {
    const { id } = useParams();
    const [open, setOpen] = useState(false);
    const [block, setBlock] = useState<Block>(initialBlock ?? {
        id: undefined,
        name: "",
    });
    const [addresses, setAddresses] = useState<Address[]>([]);
    const alreadyExistsAnGhostStreet = addresses.some((address) => address.street === "" || address.zip_code === "");

    useEffect(() => {
        if (initialBlock) {
            const block: Block = {
                id: initialBlock.id,
                name: initialBlock.name,
            }
            setBlock(block);
            const addresses: Address[] = initialBlock.addresses.map((address) => ({
                id: address.id.toString(),
                street: address.street,
                zip_code: address.zipCode,
            }));
            setAddresses(addresses);
        }
    }, [initialBlock]);

    useEffect(() => {
        return () => {
            setOpen(false)
        }
    }, [])

    const handleAddAddress = () => {
        if (alreadyExistsAnGhostStreet) {
            return;
        }

        const uuid = crypto.randomUUID();
        const address: Address = {
            id: "temp-" + uuid,
            street: "",
            zip_code: "",
        }
        setAddresses([...addresses, address]);
    }

    const removeAddress = (address: Address) => {
        setAddresses((prev) => prev.filter((item) => {
            return item.id !== address.id;
        }))
    }

    const updateAddress = (street: Address) => {
        setAddresses((prev) => prev.map((item) => {
            if (street.id === item.id) {
                return street;
            }
            return item;
        }))
    }

    const handleSubmit = async () => {
        const addressesToSave = addresses.map((address) => {
            if (address.id.startsWith("temp-")) {
                return {
                    ...address,
                    id: undefined,
                }
            }
            return address;
        });
        const body: UpsertBlockDto = {
            id: block.id ? Number(block.id) : undefined,
            name: block.name,
            addresses: addressesToSave.map((address) => ({
                id: address.id ? Number(address.id) : undefined,
                street: address.street,
                zipCode: address.zip_code?.replace(/\D/g, ''),
            })),
        }
        try {
            const response = await axiosV2.post(`territories/${id}/blocks`, body);
            if (!response.data || response.status > 299) {
                throw new Error("Erro ao cadastrar quadra");
            }
            toast.success("Quadra cadastrada com sucesso");
            console.log(response.data);
            setOpen(false);
            callBack();
        } catch (error) {
            toast.error("Erro ao cadastrar quadra");
            console.error(error);
        }

    }

    const canSubmit = (addresses?.length > 0 ? addresses.some((address) => address.street !== "" || address.zip_code !== "") : true) && block.name !== "";
    const options = existingAddresses.map((address) => ({
        value: address.name,
        label: address.name,
    }));
    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button>{block.id ? "Editar" : "Adicionar"} quadra</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{block.id ? "Editar" : "Cadastrar"} quadra</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <Label>
                            <span className="text-sm font-medium">Nome do quadra</span>
                            <Input type="text" placeholder="Digitar nome da quadra" list="street" value={block.name} onChange={(e) => setBlock({ ...block, name: e.target.value })} />
                        </Label>

                        <Separator className="border-b-2 border-b-gray-200" />

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center gap-2">
                                <h2 className="text-lg font-medium">Ruas:</h2>
                                <Button variant="outline" className="w-9 text-green-500" disabled={alreadyExistsAnGhostStreet} onClick={handleAddAddress}><PlusIcon /></Button>
                            </div>
                            {addresses.map((address) => {
                                return (
                                    <div className="grid grid-cols-10 gap-3" key={address.id}>
                                        <div className="col-span-6">
                                            <Datalist options={options} placeholder="Selecione uma rua" value={address.street} onChange={(e) => updateAddress({ ...address, street: e.target.value })} />
                                        </div>
                                        <Input type="text" placeholder="CEP" className="col-span-3" name="zip_code" value={formatZipCode(address.zip_code)} onChange={(e) => updateAddress({ ...address, [e.target.name]: e.target.value })} />
                                        <Button variant="outline" className="p-2 text-red-500 col-span-1" onClick={() => removeAddress(address)}><MinusIcon /></Button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button disabled={!canSubmit} title={!canSubmit ? "Preencha todos os campos" : ""} onClick={handleSubmit}>{block.id ? "Editar" : "Cadastrar"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
