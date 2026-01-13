import { useState, useMemo } from 'react';
import { useComissoes } from '@/hooks/useComissoes';
import { useOrdensServico } from '@/hooks/useOrdensServico';
import { useColaboradores } from '@/hooks/useColaboradores';
import { useClientes } from '@/hooks/useClientes';
import { useVeiculos } from '@/hooks/useVeiculos';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Percent, Pencil, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type StatusComissao = Database['public']['Enums']['status_comissao'];

export default function Comissoes() {
  const { comissoes, isLoading: isLoadingComissoes, addComissao, updateComissao, deleteComissao } = useComissoes();
  const { ordensServico } = useOrdensServico();
  const { colaboradores } = useColaboradores();
  const { clientes } = useClientes();
  const { veiculos } = useVeiculos();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComissao, setEditingComissao] = useState<typeof comissoes[0] | null>(null);
  const [colaboradorFilter, setColaboradorFilter] = useState<string>('todos');

  const [formData, setFormData] = useState({
    os_id: '',
    colaborador_id: '',
    valor: 0,
    status: 'pendente' as StatusComissao,
  });

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const getColaboradorNome = (id: string | null) => colaboradores.find(c => c.id === id)?.nome || 'N/A';
  
  const getOSInfo = (osId: string | null) => {
    if (!osId) return 'N/A';
    const os = ordensServico.find(o => o.id === osId);
    if (!os) return 'N/A';
    const cliente = clientes.find(c => c.id === os.cliente_id);
    const veiculo = veiculos.find(v => v.id === os.veiculo_id);
    return `#${osId.slice(0, 6)} - ${cliente?.nome || 'N/A'} - ${veiculo?.placa || 'N/A'}`;
  };

  const calcularMaoObraOS = (osId: string) => {
    const os = ordensServico.find(o => o.id === osId);
    return os?.servicos?.reduce((acc, s) => acc + s.valor_mao_obra, 0) || 0;
  };

  const filteredComissoes = useMemo(() => {
    if (colaboradorFilter === 'todos') return comissoes;
    return comissoes.filter(c => c.colaborador_id === colaboradorFilter);
  }, [comissoes, colaboradorFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const comissoesMes = comissoes.filter(c => {
      const d = new Date(c.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalMes = comissoesMes.reduce((acc, c) => acc + c.valor, 0);
    const pendentes = comissoes.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor, 0);
    const pagas = comissoesMes.filter(c => c.status === 'paga').reduce((acc, c) => acc + c.valor, 0);

    return { totalMes, pendentes, pagas };
  }, [comissoes]);

  const handleOpenDialog = (comissao?: typeof comissoes[0]) => {
    if (comissao) {
      setEditingComissao(comissao);
      setFormData({
        os_id: comissao.os_id || '',
        colaborador_id: comissao.colaborador_id || '',
        valor: comissao.valor,
        status: comissao.status,
      });
    } else {
      setEditingComissao(null);
      setFormData({ os_id: '', colaborador_id: '', valor: 0, status: 'pendente' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingComissao) {
      updateComissao({
        id: editingComissao.id,
        os_id: formData.os_id || null,
        colaborador_id: formData.colaborador_id || null,
        valor: formData.valor,
        status: formData.status,
      });
    } else {
      addComissao({
        os_id: formData.os_id || null,
        colaborador_id: formData.colaborador_id || null,
        valor: formData.valor,
        status: formData.status,
      });
    }
    setIsDialogOpen(false);
  };

  const handleCalcComissao = () => {
    const colaborador = colaboradores.find(c => c.id === formData.colaborador_id);
    const maoObra = calcularMaoObraOS(formData.os_id);
    
    if (colaborador) {
      let valor = 0;
      if (colaborador.tipo_comissao === 'percentual') {
        valor = (maoObra * colaborador.valor_comissao) / 100;
      } else {
        valor = colaborador.valor_comissao;
      }
      setFormData({ ...formData, valor });
    }
  };

  const handleMarcarPaga = (id: string) => {
    updateComissao({ id, status: 'paga' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta comissão?')) deleteComissao(id);
  };

  if (isLoadingComissoes) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comissões"
        description="Controle de comissões dos colaboradores"
        actionLabel="Nova Comissão"
        onAction={() => handleOpenDialog()}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total (Mês)</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalMes)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pendentes)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Pagas (Mês)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.pagas)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <CardTitle className="text-lg">Lista de Comissões</CardTitle>
            <Select value={colaboradorFilter} onValueChange={setColaboradorFilter}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filtrar por colaborador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os colaboradores</SelectItem>
                {colaboradores.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredComissoes.length === 0 ? (
            <EmptyState
              icon={Percent}
              title="Nenhuma comissão registrada"
              description="Registre as comissões dos colaboradores"
              actionLabel="Nova Comissão"
              onAction={() => handleOpenDialog()}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Colaborador</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">OS</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Valor</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComissoes.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-3 px-2 text-sm">{formatDate(c.created_at)}</td>
                      <td className="py-3 px-2 text-sm font-medium">{getColaboradorNome(c.colaborador_id)}</td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">{getOSInfo(c.os_id)}</td>
                      <td className="py-3 px-2"><StatusBadge status={c.status} type="comissao" /></td>
                      <td className="py-3 px-2 text-right font-bold">{formatCurrency(c.valor)}</td>
                      <td className="py-3 px-2 text-right">
                        {c.status === 'pendente' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleMarcarPaga(c.id)}
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(c.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingComissao ? 'Editar Comissão' : 'Nova Comissão'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>OS Vinculada *</Label>
              <Select value={formData.os_id} onValueChange={(v) => setFormData({ ...formData, os_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a OS" /></SelectTrigger>
                <SelectContent>
                  {ordensServico.map((os) => (
                    <SelectItem key={os.id} value={os.id}>{getOSInfo(os.id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.os_id && (
                <p className="text-xs text-muted-foreground">
                  Mão de obra da OS: {formatCurrency(calcularMaoObraOS(formData.os_id))}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Colaborador *</Label>
              <Select value={formData.colaborador_id} onValueChange={(v) => setFormData({ ...formData, colaborador_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
                <SelectContent>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} ({c.tipo_comissao === 'percentual' ? `${c.valor_comissao}%` : formatCurrency(c.valor_comissao)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Valor da Comissão *</Label>
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  onClick={handleCalcComissao}
                  disabled={!formData.os_id || !formData.colaborador_id}
                >
                  Calcular automaticamente
                </Button>
              </div>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.valor || ''}
                onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as StatusComissao })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                {editingComissao ? 'Salvar' : 'Registrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
