import { useState } from 'react';
import { useColaboradores, type Colaborador } from '@/hooks/useColaboradores';
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
import { UserCog, Pencil, Trash2, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type TipoComissao = Database['public']['Enums']['tipo_comissao'];

export default function Colaboradores() {
  const { colaboradores, isLoading, addColaborador, updateColaborador, deleteColaborador } = useColaboradores();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    funcao: '',
    tipo_comissao: 'percentual' as TipoComissao,
    valor_comissao: 0,
  });

  const handleOpenDialog = (colaborador?: Colaborador) => {
    if (colaborador) {
      setEditingColaborador(colaborador);
      setFormData({
        nome: colaborador.nome,
        funcao: colaborador.funcao || '',
        tipo_comissao: colaborador.tipo_comissao,
        valor_comissao: Number(colaborador.valor_comissao),
      });
    } else {
      setEditingColaborador(null);
      setFormData({ nome: '', funcao: '', tipo_comissao: 'percentual', valor_comissao: 0 });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingColaborador) {
      updateColaborador({ id: editingColaborador.id, ...formData });
    } else {
      addColaborador(formData);
    }
    setIsDialogOpen(false);
    setFormData({ nome: '', funcao: '', tipo_comissao: 'percentual', valor_comissao: 0 });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este colaborador?')) {
      deleteColaborador(id);
    }
  };

  const formatComissao = (colaborador: Colaborador) => {
    if (colaborador.tipo_comissao === 'percentual') {
      return `${colaborador.valor_comissao}%`;
    }
    return Number(colaborador.valor_comissao).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colaboradores"
        description="Gerencie os técnicos e colaboradores"
        actionLabel="Novo Colaborador"
        onAction={() => handleOpenDialog()}
      />

      {/* List */}
      {colaboradores.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={UserCog}
              title="Nenhum colaborador cadastrado"
              description="Cadastre os técnicos e colaboradores da oficina"
              actionLabel="Novo Colaborador"
              onAction={() => handleOpenDialog()}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colaboradores.map((colaborador) => (
            <Card key={colaborador.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {colaborador.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{colaborador.nome}</p>
                      <p className="text-sm text-muted-foreground">{colaborador.funcao || 'Sem função'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(colaborador)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(colaborador.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm bg-secondary/50 rounded-lg px-3 py-2">
                  <span className="text-muted-foreground">Comissão: </span>
                  <span className="font-medium">{formatComissao(colaborador)}</span>
                  <span className="text-muted-foreground text-xs ml-1">
                    ({colaborador.tipo_comissao === 'percentual' ? 'sobre mão de obra' : 'fixo'})
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingColaborador ? 'Editar Colaborador' : 'Novo Colaborador'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="funcao">Função</Label>
              <Input
                id="funcao"
                value={formData.funcao}
                onChange={(e) =>
                  setFormData({ ...formData, funcao: e.target.value })
                }
                placeholder="Ex: Técnico, Eletricista..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Comissão</Label>
              <Select
                value={formData.tipo_comissao}
                onValueChange={(value: TipoComissao) =>
                  setFormData({ ...formData, tipo_comissao: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorComissao">
                {formData.tipo_comissao === 'percentual'
                  ? 'Percentual da Comissão (%)'
                  : 'Valor Fixo (R$)'}
              </Label>
              <Input
                id="valorComissao"
                type="number"
                min="0"
                step={formData.tipo_comissao === 'percentual' ? '1' : '0.01'}
                value={formData.valor_comissao}
                onChange={(e) =>
                  setFormData({ ...formData, valor_comissao: parseFloat(e.target.value) || 0 })
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
                {editingColaborador ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
