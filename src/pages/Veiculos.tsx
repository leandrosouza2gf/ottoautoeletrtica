import { useState } from 'react';
import { useStore } from '@/store/useStore';
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
import { Car, Pencil, Trash2, Search } from 'lucide-react';
import type { Veiculo } from '@/types';

export default function Veiculos() {
  const { veiculos, clientes, addVeiculo, updateVeiculo, deleteVeiculo } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    clienteId: '',
    placa: '',
    modelo: '',
    ano: '',
  });

  const filteredVeiculos = veiculos.filter(
    (v) =>
      v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClienteNome = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    return cliente?.nome || 'N/A';
  };

  const handleOpenDialog = (veiculo?: Veiculo) => {
    if (veiculo) {
      setEditingVeiculo(veiculo);
      setFormData({
        clienteId: veiculo.clienteId,
        placa: veiculo.placa,
        modelo: veiculo.modelo,
        ano: veiculo.ano,
      });
    } else {
      setEditingVeiculo(null);
      setFormData({ clienteId: '', placa: '', modelo: '', ano: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVeiculo) {
      updateVeiculo(editingVeiculo.id, formData);
    } else {
      addVeiculo({
        id: crypto.randomUUID(),
        ...formData,
        createdAt: new Date(),
      });
    }
    setIsDialogOpen(false);
    setFormData({ clienteId: '', placa: '', modelo: '', ano: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este veículo?')) {
      deleteVeiculo(id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Veículos"
        description="Gerencie os veículos cadastrados"
        actionLabel="Novo Veículo"
        onAction={() => handleOpenDialog()}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por placa ou modelo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {filteredVeiculos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Car}
              title="Nenhum veículo cadastrado"
              description="Comece cadastrando o primeiro veículo"
              actionLabel="Novo Veículo"
              onAction={() => handleOpenDialog()}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVeiculos.map((veiculo) => (
            <Card key={veiculo.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{veiculo.placa}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(veiculo)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(veiculo.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Modelo:</strong> {veiculo.modelo}</p>
                  <p><strong>Ano:</strong> {veiculo.ano}</p>
                  <p><strong>Proprietário:</strong> {getClienteNome(veiculo.clienteId)}</p>
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
              {editingVeiculo ? 'Editar Veículo' : 'Novo Veículo'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clienteId">Proprietário *</Label>
              <Select
                value={formData.clienteId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clienteId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="placa">Placa *</Label>
              <Input
                id="placa"
                value={formData.placa}
                onChange={(e) =>
                  setFormData({ ...formData, placa: e.target.value.toUpperCase() })
                }
                placeholder="ABC-1234"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo *</Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={(e) =>
                  setFormData({ ...formData, modelo: e.target.value })
                }
                placeholder="Ex: Gol, Uno, Corolla..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                value={formData.ano}
                onChange={(e) =>
                  setFormData({ ...formData, ano: e.target.value })
                }
                placeholder="Ex: 2020"
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
                {editingVeiculo ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
