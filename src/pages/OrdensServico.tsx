import { useState, useMemo } from 'react';
import { useOrdensServico } from '@/hooks/useOrdensServico';
import { useClientes } from '@/hooks/useClientes';
import { useVeiculos } from '@/hooks/useVeiculos';
import { useColaboradores } from '@/hooks/useColaboradores';
import { usePecas } from '@/hooks/usePecas';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Search, Eye, Plus, Trash2, Loader2, ClipboardList, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type StatusOS = Database['public']['Enums']['status_os'];

const statusOptions: { value: StatusOS; label: string }[] = [
  { value: 'aguardando_diagnostico', label: 'Aguardando Diagnóstico' },
  { value: 'em_conserto', label: 'Em Conserto' },
  { value: 'aguardando_peca', label: 'Aguardando Peça' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'entregue', label: 'Entregue' },
];

const orcamentoStatusOptions = [
  { value: 'aguardando', label: 'Aguardando Aprovação' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
];

const orcamentoStatusColors: Record<string, string> = {
  aguardando: 'bg-yellow-500',
  aprovado: 'bg-green-500',
  reprovado: 'bg-red-500',
};

export default function OrdensServico() {
  const { isAdmin } = useAuth();
  const { 
    ordensServico, isLoading,
    addOS, updateOS, deleteOS,
    addServico, deleteServico,
    addPecaOS, deletePecaOS,
    addOrcamento, updateOrcamento,
    addRelatorio, deleteRelatorio
  } = useOrdensServico();
  const { clientes } = useClientes();
  const { veiculos } = useVeiculos();
  const { colaboradores } = useColaboradores();
  const { pecas } = usePecas();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOS, setSelectedOS] = useState<typeof ordensServico[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOS | 'todos'>('todos');
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    veiculo_id: '',
    defeito_relatado: '',
  });

  // OS Details state
  const [detailsTab, setDetailsTab] = useState('info');
  const [novoServico, setNovoServico] = useState({ descricao: '', valor_mao_obra: 0 });
  const [novaPeca, setNovaPeca] = useState({ peca_id: '', quantidade: 1, valor_unitario: 0 });
  const [novoRelatorio, setNovoRelatorio] = useState({ descricao: '', funcionario_id: '' });
  const [orcamentoForm, setOrcamentoForm] = useState({ observacoes: '' });

  const filteredOS = useMemo(() => {
    return ordensServico.filter((os) => {
      const cliente = clientes.find((c) => c.id === os.cliente_id);
      const veiculo = veiculos.find((v) => v.id === os.veiculo_id);
      
      const matchesSearch = 
        os.numero_os?.toString().includes(searchTerm) ||
        os.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        veiculo?.placa.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || os.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [ordensServico, clientes, veiculos, searchTerm, statusFilter]);

  const clienteVeiculos = useMemo(() => {
    return veiculos.filter((v) => v.cliente_id === formData.cliente_id);
  }, [veiculos, formData.cliente_id]);

  const getClienteNome = (clienteId: string) => clientes.find((c) => c.id === clienteId)?.nome || 'N/A';
  const getVeiculoInfo = (veiculoId: string) => {
    const v = veiculos.find((v) => v.id === veiculoId);
    return v ? `${v.modelo} - ${v.placa}` : 'N/A';
  };
  const getColaboradorNome = (id: string | null) => colaboradores.find((c) => c.id === id)?.nome || 'N/A';
  const getPecaNome = (id: string | null) => pecas.find((p) => p.id === id)?.nome || 'N/A';

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');
  const formatDateTime = (date: string) => new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const getOSServicos = (osId: string) => ordensServico.find(o => o.id === osId)?.servicos || [];
  const getOSPecas = (osId: string) => ordensServico.find(o => o.id === osId)?.pecas || [];
  const getOSOrcamento = (osId: string) => ordensServico.find(o => o.id === osId)?.orcamento || null;
  const getOSRelatorios = (osId: string) => ordensServico.find(o => o.id === osId)?.relatorios || [];

  const handleCreateOS = (e: React.FormEvent) => {
    e.preventDefault();
    addOS({
      cliente_id: formData.cliente_id,
      veiculo_id: formData.veiculo_id,
      defeito_relatado: formData.defeito_relatado,
    });
    setIsCreateDialogOpen(false);
    setFormData({ cliente_id: '', veiculo_id: '', defeito_relatado: '' });
  };

  const handleUpdateStatus = (osId: string, status: StatusOS) => {
    updateOS({ id: osId, status });
    if (selectedOS?.id === osId) {
      setSelectedOS({ ...selectedOS, status });
    }
  };

  const handleUpdateDiagnostico = (field: string, value: string) => {
    if (!selectedOS) return;
    updateOS({ id: selectedOS.id, [field]: value });
    setSelectedOS({ ...selectedOS, [field]: value });
  };

  const handleAddServico = () => {
    if (!selectedOS || !novoServico.descricao) return;
    addServico({
      ordem_servico_id: selectedOS.id,
      descricao: novoServico.descricao,
      valor_mao_obra: novoServico.valor_mao_obra,
    });
    setNovoServico({ descricao: '', valor_mao_obra: 0 });
  };

  const handleRemoveServico = (servicoId: string) => {
    deleteServico(servicoId);
  };

  const handleAddPeca = () => {
    if (!selectedOS || !novaPeca.peca_id) return;
    addPecaOS({
      ordem_servico_id: selectedOS.id,
      peca_id: novaPeca.peca_id,
      quantidade: novaPeca.quantidade,
      valor_unitario: novaPeca.valor_unitario,
    });
    setNovaPeca({ peca_id: '', quantidade: 1, valor_unitario: 0 });
  };

  const handleRemovePeca = (pecaOSId: string) => {
    deletePecaOS(pecaOSId);
  };

  const handleAddRelatorio = () => {
    if (!selectedOS || !novoRelatorio.descricao) return;
    addRelatorio({
      ordem_servico_id: selectedOS.id,
      funcionario_id: novoRelatorio.funcionario_id || null,
      descricao: novoRelatorio.descricao,
    });
    setNovoRelatorio({ descricao: '', funcionario_id: '' });
  };

  const handleRemoveRelatorio = (relatorioId: string) => {
    deleteRelatorio(relatorioId);
  };

  const calcularTotais = (osId: string) => {
    const osServicos = getOSServicos(osId);
    const osPecas = getOSPecas(osId);
    const totalPecas = osPecas.reduce((acc, p) => acc + (p.quantidade * p.valor_unitario), 0);
    const totalMaoObra = osServicos.reduce((acc, s) => acc + s.valor_mao_obra, 0);
    return { totalPecas, totalMaoObra, total: totalPecas + totalMaoObra };
  };

  const handleCreateOrcamento = () => {
    if (!selectedOS) return;
    const totais = calcularTotais(selectedOS.id);
    addOrcamento({
      ordem_servico_id: selectedOS.id,
      valor_total: totais.total,
      observacoes: orcamentoForm.observacoes,
    });
    setOrcamentoForm({ observacoes: '' });
  };

  const handleUpdateOrcamentoStatus = (status: string) => {
    const orcamento = selectedOS ? getOSOrcamento(selectedOS.id) : null;
    if (!orcamento) return;
    updateOrcamento({ id: orcamento.id, status });
  };

  const handleDeleteOS = (id: string) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir OS');
      return;
    }
    if (confirm('Tem certeza que deseja excluir esta OS?')) {
      deleteOS(id);
      if (selectedOS?.id === id) setSelectedOS(null);
    }
  };

  const copyNumeroOS = (numeroOS: number) => {
    navigator.clipboard.writeText(numeroOS.toString());
    toast.success(`OS #${numeroOS} copiado!`);
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
        title="Ordens de Serviço"
        description="Gerencie as ordens de serviço da oficina"
        actionLabel="Nova OS"
        onAction={() => setIsCreateDialogOpen(true)}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº OS, cliente ou placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusOS | 'todos')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filteredOS.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={FileText}
              title="Nenhuma OS encontrada"
              description="Crie uma nova ordem de serviço"
              actionLabel="Nova OS"
              onAction={() => setIsCreateDialogOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOS.map((os) => {
            const totais = calcularTotais(os.id);
            return (
              <Card key={os.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Nº OS</p>
                        <div className="flex items-center gap-1">
                          <p className="font-bold text-lg">#{os.numero_os}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyNumeroOS(os.numero_os)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cliente</p>
                        <p className="font-medium">{getClienteNome(os.cliente_id)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Veículo</p>
                        <p className="font-medium">{getVeiculoInfo(os.veiculo_id)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Data Entrada</p>
                        <p className="font-medium">{formatDate(os.data_entrada)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valor Total</p>
                        <p className="font-bold text-primary">{formatCurrency(totais.total)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={os.status} />
                      <Button variant="outline" size="sm" onClick={() => setSelectedOS(os)}>
                        <Eye className="h-4 w-4 mr-1" /> Ver
                      </Button>
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteOS(os.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOS} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select 
                value={formData.cliente_id} 
                onValueChange={(v) => setFormData({ ...formData, cliente_id: v, veiculo_id: '' })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Veículo *</Label>
              <Select 
                value={formData.veiculo_id} 
                onValueChange={(v) => setFormData({ ...formData, veiculo_id: v })}
                disabled={!formData.cliente_id}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o veículo" /></SelectTrigger>
                <SelectContent>
                  {clienteVeiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.modelo} - {v.placa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Defeito Relatado pelo Cliente *</Label>
              <Textarea
                value={formData.defeito_relatado}
                onChange={(e) => setFormData({ ...formData, defeito_relatado: e.target.value })}
                placeholder="Descreva o problema informado pelo cliente..."
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Criar OS</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* OS Details Dialog */}
      <Dialog open={!!selectedOS} onOpenChange={(open) => !open && setSelectedOS(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOS && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>OS #{selectedOS.numero_os}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyNumeroOS(selectedOS.numero_os)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <StatusBadge status={selectedOS.status} />
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><span className="text-muted-foreground">Cliente:</span> {getClienteNome(selectedOS.cliente_id)}</div>
                <div><span className="text-muted-foreground">Veículo:</span> {getVeiculoInfo(selectedOS.veiculo_id)}</div>
                <div><span className="text-muted-foreground">Data Entrada:</span> {formatDate(selectedOS.data_entrada)}</div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={selectedOS.status} onValueChange={(v) => handleUpdateStatus(selectedOS.id, v as StatusOS)}>
                    <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-3 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Defeito Relatado</p>
                <p className="text-sm">{selectedOS.defeito_relatado}</p>
              </div>

              <Tabs value={detailsTab} onValueChange={setDetailsTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="info">Diagnóstico</TabsTrigger>
                  <TabsTrigger value="servicos">Serviços</TabsTrigger>
                  <TabsTrigger value="pecas">Peças</TabsTrigger>
                  <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
                  <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Técnico Responsável</Label>
                    <Select 
                      value={selectedOS.tecnico_id || ''} 
                      onValueChange={(v) => handleUpdateDiagnostico('tecnico_id', v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione o técnico" /></SelectTrigger>
                      <SelectContent>
                        {colaboradores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Defeito Identificado</Label>
                    <Textarea
                      value={selectedOS.defeito_identificado || ''}
                      onChange={(e) => handleUpdateDiagnostico('defeito_identificado', e.target.value)}
                      placeholder="Descreva o defeito encontrado..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações Técnicas</Label>
                    <Textarea
                      value={selectedOS.observacoes_tecnicas || ''}
                      onChange={(e) => handleUpdateDiagnostico('observacoes_tecnicas', e.target.value)}
                      placeholder="Observações adicionais..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="servicos" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Adicionar Serviço</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Input
                        placeholder="Descrição do serviço"
                        value={novoServico.descricao}
                        onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Valor"
                        value={novoServico.valor_mao_obra || ''}
                        onChange={(e) => setNovoServico({ ...novoServico, valor_mao_obra: parseFloat(e.target.value) || 0 })}
                        className="w-28"
                      />
                      <Button type="button" size="sm" onClick={handleAddServico}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                  
                  {getOSServicos(selectedOS.id).length > 0 && (
                    <div className="space-y-2">
                      {getOSServicos(selectedOS.id).map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{s.descricao}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(s.data)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">{formatCurrency(s.valor_mao_obra)}</span>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveServico(s.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pecas" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Adicionar Peça</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Select value={novaPeca.peca_id} onValueChange={(v) => {
                        const peca = pecas.find(p => p.id === v);
                        setNovaPeca({ ...novaPeca, peca_id: v, valor_unitario: peca?.valor_custo || 0 });
                      }}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione a peça" /></SelectTrigger>
                        <SelectContent>
                          {pecas.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Qtd"
                        value={novaPeca.quantidade || ''}
                        onChange={(e) => setNovaPeca({ ...novaPeca, quantidade: parseInt(e.target.value) || 1 })}
                        className="w-20"
                        min={1}
                      />
                      <Input
                        type="number"
                        placeholder="Valor Unit."
                        value={novaPeca.valor_unitario || ''}
                        onChange={(e) => setNovaPeca({ ...novaPeca, valor_unitario: parseFloat(e.target.value) || 0 })}
                        className="w-28"
                      />
                      <Button type="button" size="sm" onClick={handleAddPeca}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  {getOSPecas(selectedOS.id).length > 0 && (
                    <div className="space-y-2">
                      {getOSPecas(selectedOS.id).map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{getPecaNome(p.peca_id)}</p>
                            <p className="text-xs text-muted-foreground">{p.quantidade}x {formatCurrency(p.valor_unitario)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">{formatCurrency(p.quantidade * p.valor_unitario)}</span>
                            <Button variant="ghost" size="sm" onClick={() => handleRemovePeca(p.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="orcamento" className="space-y-4 mt-4">
                  {(() => {
                    const orcamento = getOSOrcamento(selectedOS.id);
                    const totais = calcularTotais(selectedOS.id);
                    
                    return (
                      <>
                        {/* Resumo de valores */}
                        <Card>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-xs text-muted-foreground">Peças</p>
                                <p className="font-bold">{formatCurrency(totais.totalPecas)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Mão de Obra</p>
                                <p className="font-bold">{formatCurrency(totais.totalMaoObra)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="text-xl font-bold text-primary">{formatCurrency(totais.total)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {orcamento ? (
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm flex items-center justify-between">
                                <span>Orçamento Formalizado</span>
                                <Badge className={`${orcamentoStatusColors[orcamento.status]} text-white`}>
                                  {orcamentoStatusOptions.find(o => o.value === orcamento.status)?.label}
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Valor Total:</span>
                                <span className="text-xl font-bold">{formatCurrency(orcamento.valor_total)}</span>
                              </div>
                              {orcamento.observacoes && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Observações:</p>
                                  <p className="text-sm bg-muted p-2 rounded">{orcamento.observacoes}</p>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Label className="text-sm">Alterar Status:</Label>
                                <Select value={orcamento.status} onValueChange={handleUpdateOrcamentoStatus}>
                                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {orcamentoStatusOptions.map((o) => (
                                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Formalizar Orçamento</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <Label>Observações do Orçamento</Label>
                                <Textarea
                                  value={orcamentoForm.observacoes}
                                  onChange={(e) => setOrcamentoForm({ observacoes: e.target.value })}
                                  placeholder="Condições, prazos, garantias..."
                                />
                              </div>
                              <Button onClick={handleCreateOrcamento} className="w-full">
                                Criar Orçamento ({formatCurrency(totais.total)})
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    );
                  })()}
                </TabsContent>

                <TabsContent value="relatorios" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Adicionar Relatório de Atendimento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Select 
                          value={novoRelatorio.funcionario_id} 
                          onValueChange={(v) => setNovoRelatorio({ ...novoRelatorio, funcionario_id: v })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Funcionário" />
                          </SelectTrigger>
                          <SelectContent>
                            {colaboradores.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        value={novoRelatorio.descricao}
                        onChange={(e) => setNovoRelatorio({ ...novoRelatorio, descricao: e.target.value })}
                        placeholder="Descreva o serviço executado, peças substituídas, observações..."
                      />
                      <Button onClick={handleAddRelatorio} disabled={!novoRelatorio.descricao}>
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Relatório
                      </Button>
                    </CardContent>
                  </Card>

                  {getOSRelatorios(selectedOS.id).length > 0 ? (
                    <div className="space-y-3">
                      {getOSRelatorios(selectedOS.id).map((r) => (
                        <div key={r.id} className="border-l-2 border-primary pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ClipboardList className="h-3 w-3" />
                              <span>{formatDateTime(r.data)}</span>
                              <span>•</span>
                              <span>{getColaboradorNome(r.funcionario_id)}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveRelatorio(r.id)} className="text-destructive h-6">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm">{r.descricao}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum relatório registrado</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Totals */}
              <div className="mt-6 pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Peças</p>
                    <p className="font-bold">{formatCurrency(calcularTotais(selectedOS.id).totalPecas)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mão de Obra</p>
                    <p className="font-bold">{formatCurrency(calcularTotais(selectedOS.id).totalMaoObra)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total OS</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(calcularTotais(selectedOS.id).total)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
