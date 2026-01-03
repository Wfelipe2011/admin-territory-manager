"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, User as UserIcon } from "lucide-react";
import { PageTitle } from "@/components/ui/PageTitle";
import { MODE, RootModeScreen } from "@/components/RootModeScreen";
import { useUserManagement, User } from "./hooks/useUserManagement";
import { UserRegistrationDialog } from "./components/UserRegistrationDialog";
import { useAuth } from "@/context/AuthContext";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "@/types/auth";

export default function UsuariosPage() {
    const [mode, setMode] = useState(MODE.LOADING);
    const [users, setUsers] = useState<User[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { fetchUsers } = useUserManagement();
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (user?.token) {
            try {
                const decoded = jwtDecode<DecodedToken>(user.token);
                if (decoded.roles.includes("admin")) {
                    setIsAdmin(true);
                    loadUsers();
                } else {
                    setMode(MODE.SCREEN); // Will show "not authorized" or similar if I add it, but for now just empty screen or redirect
                }
            } catch (error) {
                console.error("Error decoding token", error);
                setMode(MODE.SCREEN);
            }
        } else {
            setMode(MODE.SCREEN);
        }
    }, [user]);

    const loadUsers = async () => {
        setMode(MODE.LOADING);
        try {
            const data = await fetchUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users", error);
        } finally {
            setMode(MODE.SCREEN);
        }
    };

    if (!isAdmin && mode === MODE.SCREEN) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
                <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
            </div>
        );
    }

    return (
        <RootModeScreen mode={mode}>
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <PageTitle title="Gestão de Usuários" />
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Usuário
                    </Button>
                </div>

                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Ícone</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>E-mail</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length > 0 ? (
                                users.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell>
                                            <div className="bg-primary/10 p-2 rounded-full w-fit">
                                                <UserIcon className="h-4 w-4 text-primary" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{u.name}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                                        Nenhum usuário encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <UserRegistrationDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSuccess={loadUsers}
                />
            </div>
        </RootModeScreen>
    );
}
