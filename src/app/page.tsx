'use client';

import Link from 'next/link';
import { Ship, Package, MapPin, Shield, TrendingUp, CheckCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ship className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NavegaJá
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/rastreamento">
                <Button variant="ghost">
                  <Search className="mr-2 h-4 w-4" />
                  Rastrear Encomenda
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Entrar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              🚀 Navegação Fluvial na Amazônia
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Conectando Comunidades Através dos Rios
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Plataforma completa para gestão de transporte fluvial, reservas de passagens e
            rastreamento de encomendas na região amazônica.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8">
                <Ship className="mr-2 h-5 w-5" />
                Começar Agora
              </Button>
            </Link>
            <Link href="/rastreamento">
              <Button size="lg" variant="outline" className="text-lg px-8">
                <Package className="mr-2 h-5 w-5" />
                Rastrear Encomenda
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo que você precisa, em um só lugar</h2>
          <p className="text-xl text-gray-600">Gestão completa do transporte fluvial</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <Card className="border-2 hover:border-blue-300 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4">
                <Ship className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Gestão de Viagens</h3>
              <p className="text-gray-600">
                Cadastre e gerencie viagens fluviais com facilidade. Controle rotas, horários e disponibilidade de assentos.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border-2 hover:border-purple-300 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Rastreamento de Encomendas</h3>
              <p className="text-gray-600">
                Acompanhe suas encomendas em tempo real. Saiba exatamente onde está sua carga e quando chegará.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border-2 hover:border-green-300 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-full bg-green-100 w-12 h-12 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Reservas Online</h3>
              <p className="text-gray-600">
                Sistema completo de reservas com confirmação instantânea, pagamento online e emissão de bilhetes.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="border-2 hover:border-orange-300 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-full bg-orange-100 w-12 h-12 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Rotas Otimizadas</h3>
              <p className="text-gray-600">
                Cadastro e gestão de rotas fluviais com cálculo automático de distância e tempo estimado.
              </p>
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card className="border-2 hover:border-red-300 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-full bg-red-100 w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Segurança</h3>
              <p className="text-gray-600">
                Sistema de alertas SOS, contatos de emergência e checklists de segurança para todas as viagens.
              </p>
            </CardContent>
          </Card>

          {/* Feature 6 */}
          <Card className="border-2 hover:border-yellow-300 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-full bg-yellow-100 w-12 h-12 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Dashboard Analytics</h3>
              <p className="text-gray-600">
                Acompanhe métricas, receita, ocupação e performance em tempo real com gráficos interativos.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Rastreamento */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <Package className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Rastreie sua encomenda agora</h2>
            <p className="text-xl mb-8 text-blue-100">
              Digite o código de rastreamento e acompanhe sua encomenda em tempo real
            </p>
            <Link href="/rastreamento">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8">
                <Search className="mr-2 h-5 w-5" />
                Rastrear Agora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-gray-600">Viagens Realizadas</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-600 mb-2">1000+</div>
            <div className="text-gray-600">Passageiros Atendidos</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
            <div className="text-gray-600">Rotas Ativas</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-orange-600 mb-2">4.8★</div>
            <div className="text-gray-600">Avaliação Média</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Ship className="h-6 w-6" />
                <span className="text-xl font-bold">NavegaJá</span>
              </div>
              <p className="text-gray-400">
                Conectando comunidades ribeirinhas através da tecnologia.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Funcionalidades</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/rastreamento" className="hover:text-white">Rastreamento</Link></li>
                <li><Link href="/login" className="hover:text-white">Reservas</Link></li>
                <li><Link href="/login" className="hover:text-white">Gestão de Viagens</Link></li>
                <li><Link href="/login" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Sobre</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Carreiras</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 NavegaJá. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
