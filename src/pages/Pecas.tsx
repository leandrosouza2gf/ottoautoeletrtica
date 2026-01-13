import { useState } from 'react';
import { usePecas, type Peca } from '@/hooks/usePecas';
import { useFornecedores } from '@/hooks/useFornecedores';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
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
import { Wrench, Pencil, Trash2, Search, Loader2 } from 'lucide-react';

export default function Pecas() {
  const { pecas, isLoading: isLoadingPecas, addPeca, updatePeca, deletePeca } = usePecas();
  const { fornecedores, isLoading: isLoadingFornecedores } = useFornecedores();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPeca, setEditingPeca] = useState<Peca | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    fornecedor_id: null as string | null,
    valor_custo: 0,
  });

  const filteredPecas = pecas.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFornecedorNome = (fornecedorId: string | null) => {
    if (!fornecedorId) return 'N/A';
    const fornecedor = fornecedores.find((f) => f.id === fornecedorId);
    return fornecedor?.nome || 'N/A';
  };

  const handleOpenDialog = (peca?: Peca) => {
    if (peca) {
      setEditingPeca(peca);
      setFormData({
        nome: peca.nome,
        fornecedor_id: peca.fornecedor_id,
        valor_custo: Number(peca.valor_custo),
      });
    } else {
      setEditingPeca(null);
      setFormData({ nome: '', fornecedor_id: null, valor_custo: 0 });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPeca) {
      updatePeca({ id: editingPeca.id, ...formData });
    } else {
      addPeca(formData);
    }
    setIsDialogOpen(false);
    setFormData({ nome: '', fornecedor_id: null, valor_custo: 0 });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta peça?')) {
      deletePeca(id);
    }
  };

  const formatCurrency = (value: number) => {
    return Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (isLoadingPecas || isLoadingFornecedores) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Peças / Componentes"
        description="Cadastro de peças para uso nas OS"
        actionLabel="Nova Peça"
        onAction={() => handleOpenDialog()}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome da peça..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {filteredPecas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Wrench}
              title="Nenhuma peça cadastrada"
              description="Cadastre as peças utilizadas na oficina"
              actionLabel="Nova Peça"
              onAction={() => handleOpenDialog()}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Nome da Peça
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Fornecedor
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Valor Custo
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPecas.map((peca) => (
                    <tr key={peca.id} className="border-b last:border-0">
                      <td className="py-3 px-2 font-medium">{peca.nome}</td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {getFornecedorNome(peca.fornecedor_id)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatCurrency(peca.valor_custo)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(peca)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(peca.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPeca ? 'Editar Peça' : 'Nova Peça'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Peça *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Alternador, Motor de Partida..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Select
                value={formData.fornecedor_id || ''}
                onValueChange={(value) =>
                  setFormData({ ...formData, fornecedor_id: value || null })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorCusto">Valor de Custo (R$)</Label>
              <Input
                id="valorCusto"
                type="number"
                min="0"
                step="0.01"
                value={formData.valor_custo}
                onChange={(e) =>
                  setFormData({ ...formData, valor_custo: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                {editingPeca ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
