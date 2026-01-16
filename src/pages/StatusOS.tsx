import { useState, useRef, useEffect } from 'react';
import { useStatusOS, type ChatMessage } from '@/hooks/useStatusOS';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Car, 
  Wrench, 
  ClipboardList, 
  MessageCircle, 
  Send, 
  Loader2,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';

const statusColors: Record<string, string> = {
  aguardando_diagnostico: 'bg-yellow-500',
  em_conserto: 'bg-blue-500',
  aguardando_peca: 'bg-orange-500',
  concluido: 'bg-green-500',
  entregue: 'bg-emerald-600',
};

const statusIcons: Record<string, React.ReactNode> = {
  aguardando_diagnostico: <Clock className="h-4 w-4" />,
  em_conserto: <Wrench className="h-4 w-4" />,
  aguardando_peca: <AlertCircle className="h-4 w-4" />,
  concluido: <CheckCircle2 className="h-4 w-4" />,
  entregue: <CheckCircle2 className="h-4 w-4" />,
};

const orcamentoStatusColors: Record<string, string> = {
  aguardando: 'bg-yellow-500',
  aprovado: 'bg-green-500',
  reprovado: 'bg-red-500',
};

export default function StatusOS() {
  const { os, isLoading, error, messages, isChatLoading, consultarOS, enviarPergunta, limpar } = useStatusOS();
  const [numeroOS, setNumeroOS] = useState('');
  const [pergunta, setPergunta] = useState('');
  const [activeTab, setActiveTab] = useState('diagnostico');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(numeroOS, 10);
    if (num > 0) {
      consultarOS(num);
    }
  };

  const handleEnviarPergunta = (e: React.FormEvent) => {
    e.preventDefault();
    if (pergunta.trim()) {
      enviarPergunta(pergunta);
      setPergunta('');
    }
  };

  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const formatDateShort = (date: string) => 
    new Date(date).toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Auto Elétrica</span>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-4xl mx-auto">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Consultar Ordem de Serviço</CardTitle>
            <CardDescription>
              Digite o número da OS para acompanhar o status do seu veículo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConsultar} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Número da OS (ex: 1001)"
                  value={numeroOS}
                  onChange={(e) => setNumeroOS(e.target.value)}
                  className="pl-10"
                  min="1"
                />
              </div>
              <Button type="submit" disabled={isLoading || !numeroOS}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Consultar'
                )}
              </Button>
            </form>
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* OS Details */}
        {os && (
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">OS #{os.numero_os}</h2>
                      <Badge className={`${statusColors[os.status_key]} text-white flex items-center gap-1`}>
                        {statusIcons[os.status_key]}
                        {os.status}
                      </Badge>
                    </div>
                    {os.veiculo && (
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        {os.veiculo.modelo} {os.veiculo.ano} - {os.veiculo.placa}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Entrada</p>
                    <p className="font-medium">{formatDateShort(os.data_entrada)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="diagnostico" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Diagnóstico</span>
                </TabsTrigger>
                <TabsTrigger value="orcamento" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Orçamento</span>
                </TabsTrigger>
                <TabsTrigger value="relatorios" className="flex items-center gap-1">
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">Relatórios</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Assistente</span>
                </TabsTrigger>
              </TabsList>

              {/* Diagnóstico Tab */}
              <TabsContent value="diagnostico">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Defeito Relatado pelo Cliente
                      </h4>
                      <p className="text-foreground bg-muted p-3 rounded-lg">
                        {os.diagnostico.defeito_relatado || 'Não informado'}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Diagnóstico Técnico
                      </h4>
                      <p className="text-foreground bg-muted p-3 rounded-lg">
                        {os.diagnostico.defeito_identificado || 'Aguardando diagnóstico...'}
                      </p>
                    </div>
                    {os.diagnostico.observacoes_tecnicas && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Observações Técnicas
                          </h4>
                          <p className="text-foreground bg-muted p-3 rounded-lg">
                            {os.diagnostico.observacoes_tecnicas}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Orçamento Tab */}
              <TabsContent value="orcamento">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {/* Status do Orçamento */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status do Orçamento</span>
                      <Badge className={`${orcamentoStatusColors[os.orcamento.status_key || ''] || 'bg-gray-500'} text-white`}>
                        {os.orcamento.status}
                      </Badge>
                    </div>

                    <Separator />

                    {/* Serviços */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Serviços</h4>
                      {os.servicos.length > 0 ? (
                        <div className="space-y-2">
                          {os.servicos.map((s, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="text-sm">{s.descricao}</span>
                              <span className="font-medium">{formatCurrency(s.valor)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum serviço registrado</p>
                      )}
                    </div>

                    {/* Peças */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Peças</h4>
                      {os.pecas.length > 0 ? (
                        <div className="space-y-2">
                          {os.pecas.map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="text-sm">{p.nome} ({p.quantidade}x)</span>
                              <span className="font-medium">{formatCurrency(p.valor_total)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma peça registrada</p>
                      )}
                    </div>

                    <Separator />

                    {/* Totais */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Mão de Obra</span>
                        <span>{formatCurrency(os.totais.mao_obra)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Peças</span>
                        <span>{formatCurrency(os.totais.pecas)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(os.totais.total)}</span>
                      </div>
                    </div>

                    {os.orcamento.observacoes && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Observações</h4>
                          <p className="text-sm">{os.orcamento.observacoes}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Relatórios Tab */}
              <TabsContent value="relatorios">
                <Card>
                  <CardContent className="pt-6">
                    {os.relatorios.length > 0 ? (
                      <div className="space-y-4">
                        {os.relatorios.map((r, i) => (
                          <div key={i} className="border-l-2 border-primary pl-4 pb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(r.data)}</span>
                              <span>•</span>
                              <span>{r.funcionario}</span>
                            </div>
                            <p className="text-foreground">{r.descricao}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum relatório de atendimento registrado ainda</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat">
                <Card className="h-[500px] flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Assistente Virtual
                    </CardTitle>
                    <CardDescription>
                      Tire suas dúvidas sobre o andamento do serviço
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col overflow-hidden">
                    <ScrollArea className="flex-1 pr-4">
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-muted rounded-lg px-4 py-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>
                    <form onSubmit={handleEnviarPergunta} className="flex gap-2 mt-4 pt-4 border-t">
                      <Input
                        placeholder="Digite sua pergunta..."
                        value={pergunta}
                        onChange={(e) => setPergunta(e.target.value)}
                        disabled={isChatLoading}
                      />
                      <Button type="submit" size="icon" disabled={isChatLoading || !pergunta.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Footer info */}
            <p className="text-center text-sm text-muted-foreground">
              Última atualização: {formatDate(os.ultima_atualizacao)}
            </p>

            <div className="text-center">
              <Button variant="outline" onClick={() => { limpar(); setNumeroOS(''); }}>
                Consultar outra OS
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!os && !isLoading && !error && (
          <Card className="text-center py-12">
            <CardContent>
              <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Acompanhe seu veículo</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Digite o número da Ordem de Serviço que você recebeu na oficina para consultar 
                o status, diagnóstico, orçamento e relatórios do seu veículo.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Auto Elétrica © {new Date().getFullYear()} - Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}
