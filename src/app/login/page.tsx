"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Login({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }
    setLoading(true);
    await login(email, password);
  };

  useEffect(() => {
    searchParams.then(({ error }) => {
      if (error) {
        const errorMessages: Record<string, string> = {
          missing: "Seu login expirou. Faça login novamente!",
          expired: "Sua sessão expirou! Entre novamente.",
          invalid: "Houve um problema com sua autenticação. Tente novamente!",
        };

        toast.error(errorMessages[error as string] || "Erro desconhecido");
        router.replace("/login"); // Remove o erro da URL após exibir o toast
        console.error(error, errorMessages[error as string]);
      }
    })
  }, [router, searchParams]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white" onKeyDownCapture={(e) => e.key === "Enter" && handleLogin()}>
      {/* Left Side - Logo and Dashboard Preview */}
      <div className="hidden md:flex justify-center items-center relative z-10 w-full min-h-screen md:w-1/3">
        <Image priority={true} src="/rectangle_2.png" alt="Laptop" width={400} height={300} className="absolute w-full h-full" />
        <Image priority={true} src="/rectangle_1.png" alt="Laptop" width={400} height={300} className="absolute w-full h-full" />
        <Image priority={true} src="/login.png" alt="Laptop" width={500} height={400} className="w-full scale-125 ml-10" />
      </div>

      {/* Right Side - Login Form */}
      <div className="relative z-10 w-full md:w-2/3 p-8">
        <div className="w-full max-w-md mx-auto space-y-6">
          <Image priority={true} src="/logo.png" alt="Logo Território Digital" width={500} height={400} className="m-auto -mt-16 mb-8 w-[200px] bg-primary rounded-full" />
          <div className="space-y-4">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="E-mail" className="h-12 px-4 rounded-md border border-gray-200" />
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Senha" className="h-12 px-4 rounded-md border border-gray-200" />
          </div>
          <ButtonManage
            loading={loading}
            handleLogin={handleLogin}
          />
        </div>
      </div>
    </div>
  );
}

interface ButtonManageProps {
  loading: boolean;
  handleLogin: () => void;
}

function ButtonManage({ loading, handleLogin }: ButtonManageProps) {
  if (loading) {
    return (
      <Button disabled className="w-full h-12 bg-primary hover:bg-[#69a75d] text-white rounded-full font-medium">
        <Loader2 className="animate-spin" />
        Entrando...
      </Button>
    );
  }
  return (
    <Button onClick={handleLogin} className="w-full h-12 bg-primary hover:bg-[#69a75d] text-white rounded-full font-medium">
      ENTRAR
    </Button>
  );
}