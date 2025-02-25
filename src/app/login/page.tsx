"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }
    return login(email, password);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      {/* Left Side - Logo and Dashboard Preview */}
      <div className="hidden md:flex justify-center items-center relative z-10 w-full min-h-screen md:w-1/3">
        <Image src="/rectangle_2.png" alt="Laptop" width={400} height={300} className="absolute w-full h-full" />
        <Image src="/rectangle_1.png" alt="Laptop" width={400} height={300} className="absolute w-full h-full" />
        <Image src="/login.png" alt="Laptop" width={500} height={400} className="w-full scale-125 ml-10" />
      </div>

      {/* Right Side - Login Form */}
      <div className="relative z-10 w-full md:w-2/3 p-8">
        <div className="w-full max-w-md mx-auto space-y-6">
          <Image src="/logo.png" alt="Logo Território Digital" width={500} height={400} className="m-auto -mt-16 mb-8 w-[200px] bg-primary rounded-full" />
          <div className="space-y-4">
            <Input value={email} onSelect={(e) => setEmail(e.target.value)} type="email" placeholder="E-mail" className="h-12 px-4 rounded-md border border-gray-200" />
            <Input value={password} onSelect={(e) => setPassword(e.target.value)} type="password" placeholder="Senha" className="h-12 px-4 rounded-md border border-gray-200" />
          </div>
          <Button onClick={handleLogin} className="w-full h-12 bg-primary hover:bg-[#69a75d] text-white rounded-full font-medium">
            ENTRAR
          </Button>
        </div>
      </div>
    </div>
  );
}
