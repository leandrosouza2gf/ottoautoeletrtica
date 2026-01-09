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
import { FileText, Search, Eye, Plus, Trash2 } from 'lucide-react';
import type { OrdemServico, StatusOS, ServicoOS, PecaOS } from '@/types';

const statusOptions: { value: StatusOS; label: string }[] = [
  { value: 'aguardando_diagnostico', label: 'Aguardando Diagnóstico' },
  { value: 'em_conserto', label: 'Em Conserto' },
  { value: 'aguardando_peca', label: 'Aguardando Peça' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'entregue', label: 'Entregue' },
];

export default function OrdensServico() {
  const { 
    ordensServico, clientes, veiculos, colaboradores, pecas,
    addOS, updateOS, deleteOS 
  } = useStore();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOS | 'todos'>('todos');
  
  const [formData, setFormData] = useState({
    clienteId: '',
    veiculoId: '',
    defeitoRelatado: '',
  });

  // OS Details state
  const [detailsTab, setDetailsTab] = useState('info');
  const [novoServico, setNovoServico] = useState({ descricao: '', valorMaoObra: 0 });
  const [novaPeca, setNovaPeca] = useState({ pecaId: '', quantidade: 1, valorUnitario: 0 });

  const filteredOS = useMemo(() => {
    return ordensServico.filter((os) => {
      const cliente = clientes.find((c) => c.id === os.clienteId);
      const veiculo = veiculos.find((v) => v.id === os.veiculoId);
      
      const matchesSearch = 
        os.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        veiculo?.placa.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || os.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [ordensServico, clientes, veiculos, searchTerm, statusFilter]);

  const clienteVeiculos = useMemo(() => {
    return veiculos.filter((v) => v.clienteId === formData.clienteId);
  }, [veiculos, formData.clienteId]);

  const getClienteNome = (clienteId: string) => clientes.find((c) => c.id === clienteId)?.nome || 'N/A';
  const getVeiculoInfo = (veiculoId: string) => {
    const v = veiculos.find((v) => v.id === veiculoId);
    return v ? `${v.modelo} - ${v.placa}` : 'N/A';
  };
  const getColaboradorNome = (id: string) => colaboradores.find((c) => c.id === id)?.nome || 'N/A';
  const getPecaNome = (id: string) => pecas.find((p) => p.id === id)?.nome || 'N/A';

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('pt-BR');

  const handleCreateOS = (e: React.FormEvent) => {
    e.preventDefault();
    const newOS: OrdemServico = {
      id: crypto.randomUUID(),
      clienteId: formData.clienteId,
      veiculoId: formData.veiculoId,
      dataEntrada: new Date(),
      defeitoRelatado: formData.defeitoRelatado,
      status: 'aguardando_diagnostico',
      defeitoIdentificado: '',
      tecnicoId: '',
      observacoesTecnicas: '',
      servicos: [],
      pecas: [],
      createdAt: new Date(),
    };
    addOS(newOS);
    setIsCreateDialogOpen(false);
    setFormData({ clienteId: '', veiculoId: '', defeitoRelatado: '' });
  };

  const handleUpdateStatus = (osId: string, status: StatusOS) => {
    updateOS(osId, { status });
    if (selectedOS?.id === osId) {
      setSelectedOS({ ...selectedOS, status });
    }
  };

  const handleUpdateDiagnostico = (field: string, value: string) => {
    if (!selectedOS) return;
    const updated = { ...selectedOS, [field]: value };
    updateOS(selectedOS.id, { [field]: value });
    setSelectedOS(updated);
  };

  const handleAddServico = () => {
    if (!selectedOS || !novoServico.descricao) return;
    const servico: ServicoOS = {
      id: crypto.randomUUID(),
      descricao: novoServico.descricao,
      valorMaoObra: novoServico.valorMaoObra,
      data: new Date(),
    };
    const updated = { ...selectedOS, servicos: [...selectedOS.servicos, servico] };
    updateOS(selectedOS.id, { servicos: updated.servicos });
    setSelectedOS(updated);
    setNovoServico({ descricao: '', valorMaoObra: 0 });
  };

  const handleRemoveServico = (servicoId: string) => {
    if (!selectedOS) return;
    const updated = { ...selectedOS, servicos: selectedOS.servicos.filter(s => s.id !== servicoId) };
    updateOS(selectedOS.id, { servicos: updated.servicos });
    setSelectedOS(updated);
  };

  const handleAddPeca = () => {
    if (!selectedOS || !novaPeca.pecaId) return;
    const peca: PecaOS = {
      id: crypto.randomUUID(),
      pecaId: novaPeca.pecaId,
      quantidade: novaPeca.quantidade,
      valorUnitario: novaPeca.valorUnitario,
    };
    const updated = { ...selectedOS, pecas: [...selectedOS.pecas, peca] };
    updateOS(selectedOS.id, { pecas: updated.pecas });
    setSelectedOS(updated);
    setNovaPeca({ pecaId: '', quantidade: 1, valorUnitario: 0 });
  };

  const handleRemovePeca = (pecaOSId: string) => {
    if (!selectedOS) return;
    const updated = { ...selectedOS, pecas: selectedOS.pecas.filter(p => p.id !== pecaOSId) };
    updateOS(selectedOS.id, { pecas: updated.pecas });
    setSelectedOS(updated);
  };

  const calcularTotais = (os: OrdemServico) => {
    const totalPecas = os.pecas.reduce((acc, p) => acc + (p.quantidade * p.valorUnitario), 0);
    const totalMaoObra = os.servicos.reduce((acc, s) => acc + s.valorMaoObra, 0);
    return { totalPecas, totalMaoObra, total: totalPecas + totalMaoObra };
  };

  const handleDeleteOS = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta OS?')) {
      deleteOS(id);
      if (selectedOS?.id === id) setSelectedOS(null);
    }
  };

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
            const totais = calcularTotais(os);
            return (
              <Card key={os.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Nº OS</p>
                        <p className="font-bold">#{os.id.slice(0, 8)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cliente</p>
                        <p className="font-medium">{getClienteNome(os.clienteId)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Veículo</p>
                        <p className="font-medium">{getVeiculoInfo(os.veiculoId)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Data Entrada</p>
                        <p className="font-medium">{formatDate(os.dataEntrada)}</p>
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteOS(os.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                value={formData.clienteId} 
                onValueChange={(v) => setFormData({ ...formData, clienteId: v, veiculoId: '' })}
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
                value={formData.veiculoId} 
                onValueChange={(v) => setFormData({ ...formData, veiculoId: v })}
                disabled={!formData.clienteId}
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
                value={formData.defeitoRelatado}
                onChange={(e) => setFormData({ ...formData, defeitoRelatado: e.target.value })}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOS && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>OS #{selectedOS.id.slice(0, 8)}</span>
                  <StatusBadge status={selectedOS.status} />
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><span className="text-muted-foreground">Cliente:</span> {getClienteNome(selectedOS.clienteId)}</div>
                <div><span className="text-muted-foreground">Veículo:</span> {getVeiculoInfo(selectedOS.veiculoId)}</div>
                <div><span className="text-muted-foreground">Data Entrada:</span> {formatDate(selectedOS.dataEntrada)}</div>
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
                <p className="text-sm">{selectedOS.defeitoRelatado}</p>
              </div>

              <Tabs value={detailsTab} onValueChange={setDetailsTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Diagnóstico</TabsTrigger>
                  <TabsTrigger value="servicos">Serviços</TabsTrigger>
                  <TabsTrigger value="pecas">Peças</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Técnico Responsável</Label>
                    <Select 
                      value={selectedOS.tecnicoId} 
                      onValueChange={(v) => handleUpdateDiagnostico('tecnicoId', v)}
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
                      value={selectedOS.defeitoIdentificado}
                      onChange={(e) => handleUpdateDiagnostico('defeitoIdentificado', e.target.value)}
                      placeholder="Descreva o defeito encontrado..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações Técnicas</Label>
                    <Textarea
                      value={selectedOS.observacoesTecnicas}
                      onChange={(e) => handleUpdateDiagnostico('observacoesTecnicas', e.target.value)}
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
                        value={novoServico.valorMaoObra || ''}
                        onChange={(e) => setNovoServico({ ...novoServico, valorMaoObra: parseFloat(e.target.value) || 0 })}
                        className="w-28"
                      />
                      <Button type="button" size="sm" onClick={handleAddServico}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                  
                  {selectedOS.servicos.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum serviço registrado</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedOS.servicos.map((s) => (
                        <div key={s.id} className="flex items-center justify-between bg-muted rounded-lg p-3">
                          <div>
                            <p className="font-medium">{s.descricao}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(s.data)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{formatCurrency(s.valorMaoObra)}</span>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveServico(s.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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
                    <CardContent className="flex gap-2 flex-wrap">
                      <Select value={novaPeca.pecaId} onValueChange={(v) => {
                        const peca = pecas.find(p => p.id === v);
                        setNovaPeca({ ...novaPeca, pecaId: v, valorUnitario: peca?.valorCusto || 0 });
                      }}>
                        <SelectTrigger className="flex-1 min-w-[150px]"><SelectValue placeholder="Selecione a peça" /></SelectTrigger>
                        <SelectContent>
                          {pecas.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Qtd"
                        min="1"
                        value={novaPeca.quantidade}
                        onChange={(e) => setNovaPeca({ ...novaPeca, quantidade: parseInt(e.target.value) || 1 })}
                        className="w-20"
                      />
                      <Input
                        type="number"
                        placeholder="Valor Unit."
                        value={novaPeca.valorUnitario || ''}
                        onChange={(e) => setNovaPeca({ ...novaPeca, valorUnitario: parseFloat(e.target.value) || 0 })}
                        className="w-28"
                      />
                      <Button type="button" size="sm" onClick={handleAddPeca}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  {selectedOS.pecas.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma peça registrada</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedOS.pecas.map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-muted rounded-lg p-3">
                          <div>
                            <p className="font-medium">{getPecaNome(p.pecaId)}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.quantidade}x {formatCurrency(p.valorUnitario)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{formatCurrency(p.quantidade * p.valorUnitario)}</span>
                            <Button variant="ghost" size="sm" onClick={() => handleRemovePeca(p.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Totals */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Total Peças:</span>
                  <span>{formatCurrency(calcularTotais(selectedOS).totalPecas)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Total Mão de Obra:</span>
                  <span>{formatCurrency(calcularTotais(selectedOS).totalMaoObra)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL DA OS:</span>
                  <span className="text-primary">{formatCurrency(calcularTotais(selectedOS).total)}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
