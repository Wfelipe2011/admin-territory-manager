import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogTrigger, DialogClose, DialogFooter, Button, Input, Label, Separator } from "@/components/ui";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

interface Block {
    id: string | undefined;
    name: string;
}
interface Address {
    id: string;
    street: string;
    zip_code: string;
}
export function AddBlock() {
    const [open, setOpen] = useState(false);
    const [block, setBlock] = useState<Block>({
        id: undefined,
        name: "",
    });
    const [addresses, setAddresses] = useState<Address[]>([]);
    const alreadyExistsAnGhostStreet = addresses.some((address) => address.street === "" || address.zip_code === "");

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

    const handleSubmit = () => {
        const addressesToSave = addresses.map((address) => {
            if (address.id.startsWith("temp-")) {
                return {
                    ...address,
                    id: undefined,
                }
            }
            return address;
        });
        const body = {
            block,
            ...(addressesToSave?.length > 0 ? { addresses: addressesToSave } : {}),
        }
        console.log(JSON.stringify(body, null, 2));

        setOpen(false);
    }

    const canSubmit = (addresses?.length > 0 ? addresses.some((address) => address.street !== "" || address.zip_code !== "") : true) && block.name !== "";
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
                                const formatZipCode = (value: string) => {
                                    const valueRaw = value.replace(/\D/g, '');
                                    return valueRaw.replace(/(\d{5})(\d{3})/, "$1-$2");
                                }

                                return (
                                    <div className="grid grid-cols-10 gap-3" key={address.id}>
                                        <Input type="text" placeholder="Digitar nome da rua" list="street" className="col-span-6" name="street" value={address.street} onChange={(e) => updateAddress({ ...address, [e.target.name]: e.target.value })} />
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
            {/* <datalist id='street'>
          <option value="Rua João Pessoa">12505707</option>
          <option value="Rua Nova João Pessoa">12505708</option>
          <option value="Rua Carlos Tomes">12606380</option>
        </datalist> */}
        </>
    )
}