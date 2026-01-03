import { useState } from "react";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import toast from "react-hot-toast";

export interface RegisterUserPayload {
    name: string;
    email: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
}

export const useUserManagement = () => {
    const [isLoading, setIsLoading] = useState(false);
    const axios = new AxiosAdapter();

    const registerUser = async (payload: RegisterUserPayload) => {
        setIsLoading(true);
        const response = await axios.post("auth/admin/register", payload);

        if (response.status === 201 || response.status === 200) {
            toast.success("Usuário registrado com sucesso! Um e-mail de boas-vindas foi enviado para o endereço informado.");
            setIsLoading(false);
            return true;
        } else {
            toast.error(response.message || "Erro ao registrar usuário");
        }

        setIsLoading(false);
        return false;
    };

    const fetchUsers = async (): Promise<User[]> => {
        const response = await axios.get<User[]>("auth/admin/users");
        if (response.status === 200 && response.data) {
            return response.data;
        }
        return [];
    };

    return {
        registerUser,
        fetchUsers,
        isLoading,
    };
};
