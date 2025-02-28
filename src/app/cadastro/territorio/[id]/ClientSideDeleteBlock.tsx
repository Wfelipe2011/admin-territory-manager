import { useState } from "react";
import { useParams } from "next/navigation";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Button, DialogDescription } from "@/components/ui";
import { Block } from "./type";
import { toast } from "react-hot-toast";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
const axiosV2 = new AxiosAdapter("v2");

interface DeleteBlockProps {
    block: Block;
    callBack: () => void;
}
export function DeleteBlock({ block, callBack }: DeleteBlockProps) {
    const { id } = useParams();
    const [open, setOpen] = useState(false);

    const handleSubmit = async () => {
        try {
            await axiosV2.delete(`territories/${id}/blocks/${block.id}`);
            toast.success("Quadra deletada com sucesso");
            setOpen(false);
            callBack();
        } catch (error) {
            toast.error("Erro ao deletar quadra");
            console.error(error);
        }
    }
    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="bg-red-500 text-white hover:bg-red-600 hover:text-white">Deletar</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deletar</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        <p>Tem certeza que deseja deletar <span className="font-bold">{block.name}</span>?</p>
                    </DialogDescription>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleSubmit}>Deletar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}