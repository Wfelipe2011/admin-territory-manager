"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ForgotPassword() {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("");
    const { forgotPassword } = useAuth();

    const handleForgotPassword = async () => {
        if (!email) {
            toast.error("Por favor, insira seu e-mail.");
            return;
        }
        setLoading(true);
        try {
            await forgotPassword(email);
            toast.success("E-mail de recuperação enviado com sucesso!");
            router.push("/");
        } catch (error: any) {
            toast.error(error.message || "Erro ao solicitar recuperação de senha.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-white" onKeyDownCapture={(e) => e.key === "Enter" && handleForgotPassword()}>
            {/* Left Side - Logo and Dashboard Preview */}
            <div className="hidden md:flex justify-center items-center relative z-10 w-full min-h-screen md:w-1/3">
                <Image priority={true} src="/rectangle_2.png" alt="Laptop" width={400} height={300} className="absolute w-full h-full" />
                <Image priority={true} src="/rectangle_1.png" alt="Laptop" width={400} height={300} className="absolute w-full h-full" />
                <Image priority={true} src="/login.png" alt="Laptop" width={500} height={400} className="w-full scale-125 ml-10" />
            </div>

            {/* Right Side - Forgot Password Form */}
            <div className="relative z-10 w-full md:w-2/3 p-8">
                <div className="w-full max-w-md mx-auto space-y-6">
                    <Image priority={true} src="/logo.png" alt="Logo Território Digital" width={500} height={400} className="m-auto -mt-16 mb-8 w-[200px] bg-primary rounded-full" />

                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Recuperar Senha</h1>
                        <p className="text-gray-500">Insira seu e-mail para receber as instruções de recuperação.</p>
                    </div>

                    <div className="space-y-4">
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            placeholder="E-mail"
                            className="h-12 px-4 rounded-md border border-gray-200"
                        />
                    </div>

                    <div className="space-y-4">
                        <ButtonManage
                            loading={loading}
                            handleForgotPassword={handleForgotPassword}
                        />

                        <div className="flex justify-center">
                            <Link href="/login" className="flex items-center text-sm text-gray-500 hover:text-primary transition-colors">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar para o login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ButtonManageProps {
    loading: boolean;
    handleForgotPassword: () => void;
}

function ButtonManage({ loading, handleForgotPassword }: ButtonManageProps) {
    if (loading) {
        return (
            <Button disabled className="w-full h-12 bg-primary hover:bg-[#69a75d] text-white rounded-full font-medium">
                <Loader2 className="animate-spin mr-2" />
                Enviando...
            </Button>
        );
    }
    return (
        <Button onClick={handleForgotPassword} className="w-full h-12 bg-primary hover:bg-[#69a75d] text-white rounded-full font-medium">
            ENVIAR SOLICITAÇÃO
        </Button>
    );
}
