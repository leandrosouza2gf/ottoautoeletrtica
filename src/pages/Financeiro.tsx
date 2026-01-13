import { useState, useMemo } from 'react';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { useOrdensServico } from '@/hooks/useOrdensServico';
import { useClientes } from '@/hooks/useClientes';
import { useVeiculos } from '@/hooks/useVeiculos';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, TrendingUp, TrendingDown, Pencil, Trash2, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type FormaPagamento = Database['public']['Enums']['forma_pagamento'];
type StatusPagamento = Database['public']['Enums']['status_pagamento'];
type TipoDespesa = Database['public']['Enums']['tipo_despesa'];

const formasPagamento: { value: FormaPagamento; label: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'boleto', label: 'Boleto' },
];

const tiposDespesa: { value: TipoDespesa; label: string }[] = [
  { value: 'compra_peca', label: 'Compra de Peça' },
  { value: 'comissao', label: 'Comissão' },
  { value: 'fixo', label: 'Despesa Fixa' },
  { value: 'outros', label: 'Outros' },
];

export default function Financeiro() {
  const { 
    entradas, saidas, isLoading,
    addEntrada, updateEntrada, deleteEntrada,
    addSaida, updateSaida, deleteSaida
  } = useFinanceiro();
  
  const { ordensServico } = useOrdensServico();
  const { clientes } = useClientes();
  const { veiculos } = useVeiculos();

  const [activeTab, setActiveTab] = useState('entradas');
  const [isEntradaDialogOpen, setIsEntradaDialogOpen] = useState(false);
  const [isSaidaDialogOpen, setIsSaidaDialogOpen] = useState(false);
  const [editingEntrada, setEditingEntrada] = useState<typeof entradas[0] | null>(null);
  const [editingSaida, setEditingSaida] = useState<typeof saidas[0] | null>(null);

  const [entradaForm, setEntradaForm] = useState({
    os_id: '',
    valor: 0,
    forma_pagamento: 'pix' as FormaPagamento,
    data: new Date().toISOString().split('T')[0],
    status: 'recebido' as StatusPagamento,
  });

  const [saidaForm, setSaidaForm] = useState({
    tipo: 'outros' as TipoDespesa,
    valor: 0,
    forma_pagamento: 'pix' as FormaPagamento,
    data: new Date().toISOString().split('T')[0],
    observacao: '',
  });

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const getOSInfo = (osId: string | null) => {
    if (!osId) return 'N/A';
    const os = ordensServico.find(o => o.id === osId);
    if (!os) return 'N/A';
    const cliente = clientes.find(c => c.id === os.cliente_id);
    const veiculo = veiculos.find(v => v.id === os.veiculo_id);
    return `#${osId.slice(0, 6)} - ${cliente?.nome || 'N/A'} - ${veiculo?.placa || 'N/A'}`;
  };

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalEntradas = entradas
      .filter(e => {
        const d = new Date(e.data);
        return e.status === 'recebido' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, e) => acc + e.valor, 0);

    const totalSaidas = saidas
      .filter(s => {
        const d = new Date(s.data);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, s) => acc + s.valor, 0);

    const entradasPendentes = entradas
      .filter(e => e.status === 'pendente')
      .reduce((acc, e) => acc + e.valor, 0);

    return { totalEntradas, totalSaidas, saldo: totalEntradas - totalSaidas, entradasPendentes };
  }, [entradas, saidas]);

  const handleOpenEntradaDialog = (entrada?: typeof entradas[0]) => {
    if (entrada) {
      setEditingEntrada(entrada);
      setEntradaForm({
        os_id: entrada.os_id || '',
        valor: entrada.valor,
        forma_pagamento: entrada.forma_pagamento,
        data: entrada.data,
        status: entrada.status,
      });
    } else {
      setEditingEntrada(null);
      setEntradaForm({
        os_id: '',
        valor: 0,
        forma_pagamento: 'pix',
        data: new Date().toISOString().split('T')[0],
        status: 'recebido',
      });
    }
    setIsEntradaDialogOpen(true);
  };

  const handleOpenSaidaDialog = (saida?: typeof saidas[0]) => {
    if (saida) {
      setEditingSaida(saida);
      setSaidaForm({
        tipo: saida.tipo,
        valor: saida.valor,
        forma_pagamento: saida.forma_pagamento,
        data: saida.data,
        observacao: saida.observacao || '',
      });
    } else {
      setEditingSaida(null);
      setSaidaForm({
        tipo: 'outros',
        valor: 0,
        forma_pagamento: 'pix',
        data: new Date().toISOString().split('T')[0],
        observacao: '',
      });
    }
    setIsSaidaDialogOpen(true);
  };

  const handleSubmitEntrada = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      os_id: entradaForm.os_id || null,
      valor: entradaForm.valor,
      forma_pagamento: entradaForm.forma_pagamento,
      data: entradaForm.data,
      status: entradaForm.status,
    };
    if (editingEntrada) {
      updateEntrada({ id: editingEntrada.id, ...data });
    } else {
      addEntrada(data);
    }
    setIsEntradaDialogOpen(false);
  };

  const handleSubmitSaida = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      tipo: saidaForm.tipo,
      valor: saidaForm.valor,
      forma_pagamento: saidaForm.forma_pagamento,
      data: saidaForm.data,
      observacao: saidaForm.observacao,
    };
    if (editingSaida) {
      updateSaida({ id: editingSaida.id, ...data });
    } else {
      addSaida(data);
    }
    setIsSaidaDialogOpen(false);
  };

  const handleDeleteEntrada = (id: string) => {
    if (confirm('Excluir esta entrada?')) deleteEntrada(id);
  };

  const handleDeleteSaida = (id: string) => {
    if (confirm('Excluir esta saída?')) deleteSaida(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Controle de entradas e saídas"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Entradas (Mês)</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalEntradas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saídas (Mês)</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalSaidas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo (Mês)</p>
                <p className={`text-lg font-bold ${stats.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.saldo)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.entradasPendentes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="entradas">Entradas</TabsTrigger>
                <TabsTrigger value="saidas">Saídas</TabsTrigger>
              </TabsList>
              {activeTab === 'entradas' ? (
                <Button onClick={() => handleOpenEntradaDialog()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Nova Entrada
                </Button>
              ) : (
                <Button onClick={() => handleOpenSaidaDialog()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Nova Saída
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <TabsContent value="entradas" className="mt-0">
              {entradas.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="Nenhuma entrada registrada"
                  description="Registre os recebimentos das OS"
                  actionLabel="Nova Entrada"
                  onAction={() => handleOpenEntradaDialog()}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Data</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">OS</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Forma Pgto</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Valor</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entradas.map((e) => (
                        <tr key={e.id} className="border-b last:border-0">
                          <td className="py-3 px-2 text-sm">{formatDate(e.data)}</td>
                          <td className="py-3 px-2 text-sm">{getOSInfo(e.os_id)}</td>
                          <td className="py-3 px-2 text-sm capitalize">{e.forma_pagamento}</td>
                          <td className="py-3 px-2"><StatusBadge status={e.status} type="pagamento" /></td>
                          <td className="py-3 px-2 text-right font-medium text-green-600">{formatCurrency(e.valor)}</td>
                          <td className="py-3 px-2 text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEntradaDialog(e)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteEntrada(e.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="saidas" className="mt-0">
              {saidas.length === 0 ? (
                <EmptyState
                  icon={TrendingDown}
                  title="Nenhuma saída registrada"
                  description="Registre as despesas da oficina"
                  actionLabel="Nova Saída"
                  onAction={() => handleOpenSaidaDialog()}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Data</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Tipo</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Observação</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Forma Pgto</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Valor</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saidas.map((s) => (
                        <tr key={s.id} className="border-b last:border-0">
                          <td className="py-3 px-2 text-sm">{formatDate(s.data)}</td>
                          <td className="py-3 px-2 text-sm">{tiposDespesa.find(t => t.value === s.tipo)?.label}</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">{s.observacao || '-'}</td>
                          <td className="py-3 px-2 text-sm capitalize">{s.forma_pagamento}</td>
                          <td className="py-3 px-2 text-right font-medium text-red-600">{formatCurrency(s.valor)}</td>
                          <td className="py-3 px-2 text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenSaidaDialog(s)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteSaida(s.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Entrada Dialog */}
      <Dialog open={isEntradaDialogOpen} onOpenChange={setIsEntradaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntrada ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEntrada} className="space-y-4">
            <div className="space-y-2">
              <Label>OS Vinculada</Label>
              <Select value={entradaForm.os_id} onValueChange={(v) => setEntradaForm({ ...entradaForm, os_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a OS" /></SelectTrigger>
                <SelectContent>
                  {ordensServico.map((os) => (
                    <SelectItem key={os.id} value={os.id}>{getOSInfo(os.id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entradaForm.valor || ''}
                  onChange={(e) => setEntradaForm({ ...entradaForm, valor: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={entradaForm.data}
                  onChange={(e) => setEntradaForm({ ...entradaForm, data: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={entradaForm.forma_pagamento} onValueChange={(v) => setEntradaForm({ ...entradaForm, forma_pagamento: v as FormaPagamento })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {formasPagamento.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={entradaForm.status} onValueChange={(v) => setEntradaForm({ ...entradaForm, status: v as StatusPagamento })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsEntradaDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                {editingEntrada ? 'Salvar' : 'Registrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Saida Dialog */}
      <Dialog open={isSaidaDialogOpen} onOpenChange={setIsSaidaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSaida ? 'Editar Saída' : 'Nova Saída'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitSaida} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Despesa *</Label>
              <Select value={saidaForm.tipo} onValueChange={(v) => setSaidaForm({ ...saidaForm, tipo: v as TipoDespesa })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tiposDespesa.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={saidaForm.valor || ''}
                  onChange={(e) => setSaidaForm({ ...saidaForm, valor: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={saidaForm.data}
                  onChange={(e) => setSaidaForm({ ...saidaForm, data: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={saidaForm.forma_pagamento} onValueChange={(v) => setSaidaForm({ ...saidaForm, forma_pagamento: v as FormaPagamento })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {formasPagamento.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Input
                value={saidaForm.observacao}
                onChange={(e) => setSaidaForm({ ...saidaForm, observacao: e.target.value })}
                placeholder="Descrição da despesa..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsSaidaDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                {editingSaida ? 'Salvar' : 'Registrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
