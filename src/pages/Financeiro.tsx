import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { DollarSign, TrendingUp, TrendingDown, Pencil, Trash2 } from 'lucide-react';
import type { Entrada, Saida, FormaPagamento, StatusPagamento, TipoDespesa } from '@/types';

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
    entradas, saidas, ordensServico, clientes, veiculos,
    addEntrada, updateEntrada, deleteEntrada,
    addSaida, updateSaida, deleteSaida
  } = useStore();

  const [activeTab, setActiveTab] = useState('entradas');
  const [isEntradaDialogOpen, setIsEntradaDialogOpen] = useState(false);
  const [isSaidaDialogOpen, setIsSaidaDialogOpen] = useState(false);
  const [editingEntrada, setEditingEntrada] = useState<Entrada | null>(null);
  const [editingSaida, setEditingSaida] = useState<Saida | null>(null);

  const [entradaForm, setEntradaForm] = useState({
    osId: '',
    valor: 0,
    formaPagamento: 'pix' as FormaPagamento,
    data: new Date().toISOString().split('T')[0],
    status: 'recebido' as StatusPagamento,
  });

  const [saidaForm, setSaidaForm] = useState({
    tipo: 'outros' as TipoDespesa,
    valor: 0,
    formaPagamento: 'pix' as FormaPagamento,
    data: new Date().toISOString().split('T')[0],
    observacao: '',
  });

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('pt-BR');

  const getOSInfo = (osId: string) => {
    const os = ordensServico.find(o => o.id === osId);
    if (!os) return 'N/A';
    const cliente = clientes.find(c => c.id === os.clienteId);
    const veiculo = veiculos.find(v => v.id === os.veiculoId);
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

  const handleOpenEntradaDialog = (entrada?: Entrada) => {
    if (entrada) {
      setEditingEntrada(entrada);
      setEntradaForm({
        osId: entrada.osId,
        valor: entrada.valor,
        formaPagamento: entrada.formaPagamento,
        data: new Date(entrada.data).toISOString().split('T')[0],
        status: entrada.status,
      });
    } else {
      setEditingEntrada(null);
      setEntradaForm({
        osId: '',
        valor: 0,
        formaPagamento: 'pix',
        data: new Date().toISOString().split('T')[0],
        status: 'recebido',
      });
    }
    setIsEntradaDialogOpen(true);
  };

  const handleOpenSaidaDialog = (saida?: Saida) => {
    if (saida) {
      setEditingSaida(saida);
      setSaidaForm({
        tipo: saida.tipo,
        valor: saida.valor,
        formaPagamento: saida.formaPagamento,
        data: new Date(saida.data).toISOString().split('T')[0],
        observacao: saida.observacao,
      });
    } else {
      setEditingSaida(null);
      setSaidaForm({
        tipo: 'outros',
        valor: 0,
        formaPagamento: 'pix',
        data: new Date().toISOString().split('T')[0],
        observacao: '',
      });
    }
    setIsSaidaDialogOpen(true);
  };

  const handleSubmitEntrada = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      osId: entradaForm.osId,
      valor: entradaForm.valor,
      formaPagamento: entradaForm.formaPagamento,
      data: new Date(entradaForm.data),
      status: entradaForm.status,
    };
    if (editingEntrada) {
      updateEntrada(editingEntrada.id, data);
    } else {
      addEntrada({ id: crypto.randomUUID(), ...data, createdAt: new Date() });
    }
    setIsEntradaDialogOpen(false);
  };

  const handleSubmitSaida = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      tipo: saidaForm.tipo,
      valor: saidaForm.valor,
      formaPagamento: saidaForm.formaPagamento,
      data: new Date(saidaForm.data),
      observacao: saidaForm.observacao,
    };
    if (editingSaida) {
      updateSaida(editingSaida.id, data);
    } else {
      addSaida({ id: crypto.randomUUID(), ...data, createdAt: new Date() });
    }
    setIsSaidaDialogOpen(false);
  };

  const handleDeleteEntrada = (id: string) => {
    if (confirm('Excluir esta entrada?')) deleteEntrada(id);
  };

  const handleDeleteSaida = (id: string) => {
    if (confirm('Excluir esta saída?')) deleteSaida(id);
  };

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
                          <td className="py-3 px-2 text-sm">{getOSInfo(e.osId)}</td>
                          <td className="py-3 px-2 text-sm capitalize">{e.formaPagamento}</td>
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
                          <td className="py-3 px-2 text-sm capitalize">{s.formaPagamento}</td>
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
              <Select value={entradaForm.osId} onValueChange={(v) => setEntradaForm({ ...entradaForm, osId: v })}>
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
                <Select value={entradaForm.formaPagamento} onValueChange={(v) => setEntradaForm({ ...entradaForm, formaPagamento: v as FormaPagamento })}>
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
              <Select value={saidaForm.formaPagamento} onValueChange={(v) => setSaidaForm({ ...saidaForm, formaPagamento: v as FormaPagamento })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {formasPagamento.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                value={saidaForm.observacao}
                onChange={(e) => setSaidaForm({ ...saidaForm, observacao: e.target.value })}
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
