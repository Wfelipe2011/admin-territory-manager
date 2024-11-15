'use client'

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-primary text-white">
        <nav className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-between items-center">
            <Link href="/login" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Território Digital Logo"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className="ml-2 text-xl font-semibold">Território Digital</span>
            </Link>
            <div className="flex gap-4">

              <ul className="hidden lg:flex items-center gap-6">
                <li><Link href="#home" className="text-sm font-medium hover:underline">Início</Link></li>
                <li><Link href="#desafios" className="text-sm font-medium hover:underline">Desafios</Link></li>
                <li><Link href="#solucoes" className="text-sm font-medium hover:underline">Soluções</Link></li>
                <li><Link href="#designacoes" className="text-sm font-medium hover:underline">Designações</Link></li>
                <li><Link href="#publicadores" className="text-sm font-medium hover:underline">Publicadores</Link></li>
                <li>
                </li>
              </ul>
              <Button variant="secondary" size="sm" className="bg-white text-primary font-semibold">
                <Link href="/login" className="flex items-center">
                  Acessar Sistema
                </Link>
              </Button>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section id="home" aria-labelledby="hero-heading" className="relative overflow-hidden">
          <div className="w-full mx-auto relative">
            <div className="w-full flex items-center">
              <div className="hidden md:flex justify-center items-center relative z-10 min-h-screen md:w-1/3">
                <Image src="/rectangle_2.png" alt="Laptop" width={600} height={300} className="absolute w-full h-full" />
                <Image src="/rectangle_1.png" alt="Laptop" width={600} height={300} className="absolute w-full h-full" />
                <Image src="/login.png" alt="Laptop" width={500} height={400} className="w-full scale-125 ml-10" />
              </div>
              <div className="flex flex-col items-center w-full md:w-2/3 p-4 md:p-16">
                <h1 id="hero-heading" className="text-4xl lg:text-5xl font-bold mb-6 text-primary">TERRITÓRIO DIGITAL</h1>
                <p className="text-lg mb-8 text-center md:p-16">
                  O Território Digital é uma solução inovadora e completa que visa ajudar na organização e gestão do território. Desenvolvido para otimizar o trabalho dos publicadores e coordenadores ajudando na designação digital do território.
                </p>
                <Button size="lg" variant="secondary" className="bg-primary text-white m-auto">
                  Entre em contato
                </Button>
              </div>

            </div>
          </div>
        </section>

        <section id="desafios" aria-labelledby="desafios-heading" className="py-16">

          <div className="max-w-7xl mx-auto px-4">
            <h2 id="solucoes-heading" className="text-3xl font-bold text-center mb-12">Desafios</h2>
            <div className="flex flex-col items-center">
              <ul className="space-y-4">
                {["Dificuldade para organizar território", "Falta de controle de designações", "Dificuldade em receber quadras", "Demora na revisão do território", "Dificuldade nas designações"].map((desafio, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>{desafio}</span>
                  </li>
                ))}
              </ul>

            </div>
          </div>
        </section>

        <section id="solucoes" aria-labelledby="solucoes-heading" className="py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 id="solucoes-heading" className="text-3xl font-bold text-center mb-12">Soluções</h2>
            <div className="flex flex-col md:flex-row items-center md:justify-between">
              <ul className="space-y-4">
                {["Atualização dos endereços", "Designar apenas os quadras livres", "Revisão de quadras conforme o prazo", "Histórico detalhado do território", "Localização dos quadras automatizada"].map((solucao, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>{solucao}</span>
                  </li>
                ))}
              </ul>
              <div className="hidden md:flex justify-center">
                <Image
                  src="/logo.png"
                  alt="Logo Território Digital"
                  width={300}
                  height={300}
                  className="w-64 h-64 bg-primary rounded-full"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="designacoes" aria-labelledby="designacoes-heading" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 id="designacoes-heading" className="text-3xl font-bold text-center mb-12">Designações</h2>
            <div className="flex justify-center">
              <div className="relative max-w-md">
                <Image
                  src="/funcoes.png"
                  alt="Captura de tela do aplicativo 1"
                  width={300}
                  height={600}
                  className="w-full"
                />
                <div className="absolute top-1/4 -left-32 hidden lg:block">
                  <div className="bg-white p-3 rounded-lg shadow-lg">
                    <p className="text-sm">Sugestão de designação em caso quadra</p>
                  </div>
                </div>
                <div className="absolute top-2/3 -right-32 hidden lg:block">
                  <div className="bg-white p-3 rounded-lg shadow-lg">
                    <p className="text-sm">Progresso da trabalho em cada quadra</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="publicadores" aria-labelledby="publicadores-heading" className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 id="publicadores-heading" className="text-3xl font-bold text-center mb-12">Publicadores</h2>
            <div className="flex flex-col lg:flex-row justify-center gap-16">
              <div className="relative">
                <Image
                  src="/publicador.png"
                  alt="Captura de tela do aplicativo 2"
                  width={250}
                  height={500}
                  className="w-full"
                />
                <div className="absolute top-1/4 -left-32 hidden lg:block">
                  <div className="bg-white p-3 rounded-lg shadow-lg">
                    <p className="text-sm">Visualize suas designações atuais</p>
                  </div>
                </div>
              </div>
              <div className="relative mt-8 lg:mt-0">
                <Image
                  src="/marcar_casa.png"
                  alt="Captura de tela do aplicativo 3"
                  width={250}
                  height={500}
                  className="w-full"
                />
                <div className="absolute top-1/4 -right-32 hidden lg:block">
                  <div className="bg-white p-3 rounded-lg shadow-lg">
                    <p className="text-sm">Acompanhe seu progresso</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Image
                src="/logo.png"
                alt="Território Digital Logo"
                width={40}
                height={40}
                className="w-10 h-10 scale-150"
              />
            </div>
            <nav>
              {/* <ul className="flex flex-wrap justify-center gap-6">
                <li><Link href="#" className="hover:underline">Política de Privacidade</Link></li>
                <li><Link href="#" className="hover:underline">Termos de Uso</Link></li>
                <li><Link href="#" className="hover:underline">Contato</Link></li>
              </ul> */}
            </nav>
          </div>
          <div className="mt-8 text-center">
            <p>&copy; 2024 Território Digital. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}