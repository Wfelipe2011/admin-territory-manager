"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import toast from "react-hot-toast";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [loading, setLoading] = useState<boolean>(false);
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const { resetPassword } = useAuth();

    const handleResetPassword = async () => {
        if (!token) {
            toast.error("Token de recuperação inválido ou ausente.");
            return;
        }

        if (!password || !confirmPassword) {
            toast.error("Por favor, preencha todos os campos.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }

        if (password.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setLoading(true);
        try {
            await resetPassword(password, token);
            toast.success("Senha redefinida com sucesso!");
            router.push("/login");
        } catch (error: any) {
            toast.error(error.message || "Erro ao redefinir senha.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-white" onKeyDownCapture={(e) => e.key === "Enter" && handleResetPassword()}>
            {/* Left Side - Logo and Dashboard Preview */}
            <div className="hidden md:flex justify-center items-center relative z-10 w-full min-h-screen md:w-1/3">
                <Image priority={true} src="/rectangle_2.png" alt="Laptop" width={400} height={300} className="absolute w-full h-full" />
                <Image priority={true} src="/rectangle_1.png" alt="Laptop" width={400} height={300} className="absolute w-full h-full" />
                <Image priority={true} src="/login.png" alt="Laptop" width={500} height={400} className="w-full scale-125 ml-10" />
            </div>

            {/* Right Side - Reset Password Form */}
            <div className="relative z-10 w-full md:w-2/3 p-8">
                <div className="w-full max-w-md mx-auto space-y-6">
                    <Image priority={true} src="/logo.png" alt="Logo Território Digital" width={500} height={400} className="m-auto -mt-16 mb-8 w-[200px] bg-primary rounded-full" />

                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Redefinir Senha</h1>
                        <p className="text-gray-500">Crie uma nova senha para sua conta.</p>
                    </div>

                    <div className="space-y-4">
                        <Input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            placeholder="Nova Senha"
                            className="h-12 px-4 rounded-md border border-gray-200"
                        />
                        <Input
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            type="password"
                            placeholder="Confirmar Nova Senha"
                            className="h-12 px-4 rounded-md border border-gray-200"
                        />
                    </div>

                    <ButtonManage
                        loading={loading}
                        handleResetPassword={handleResetPassword}
                    />
                </div>
            </div>
        </div>
    );
}

interface ButtonManageProps {
    loading: boolean;
    handleResetPassword: () => void;
}

function ButtonManage({ loading, handleResetPassword }: ButtonManageProps) {
    if (loading) {
        return (
            <Button disabled className="w-full h-12 bg-primary hover:bg-[#69a75d] text-white rounded-full font-medium">
                <Loader2 className="animate-spin mr-2" />
                Redefinindo...
            </Button>
        );
    }
    return (
        <Button onClick={handleResetPassword} className="w-full h-12 bg-primary hover:bg-[#69a75d] text-white rounded-full font-medium">
            REDEFINIR SENHA
        </Button>
    );
}

export default function ResetPassword() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
