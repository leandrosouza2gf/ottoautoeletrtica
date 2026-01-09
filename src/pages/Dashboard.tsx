import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { 
  Car, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  TrendingDown, 
  TrendingUp,
  FileText 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';

export default function Dashboard() {
  const { ordensServico, entradas, saidas, clientes, veiculos } = useStore();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const osEmConserto = ordensServico.filter(
      (os) => os.status === 'em_conserto'
    ).length;

    const osAguardandoPeca = ordensServico.filter(
      (os) => os.status === 'aguardando_peca'
    ).length;

    const osConcluidas = ordensServico.filter((os) => {
      const osDate = new Date(os.createdAt);
      return (
        os.status === 'concluido' &&
        osDate.getMonth() === currentMonth &&
        osDate.getFullYear() === currentYear
      );
    }).length;

    const faturamentoMes = entradas
      .filter((e) => {
        const date = new Date(e.data);
        return (
          e.status === 'recebido' &&
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      })
      .reduce((acc, e) => acc + e.valor, 0);

    const despesasMes = saidas
      .filter((s) => {
        const date = new Date(s.data);
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      })
      .reduce((acc, s) => acc + s.valor, 0);

    const lucroEstimado = faturamentoMes - despesasMes;

    return {
      osEmConserto,
      osAguardandoPeca,
      osConcluidas,
      faturamentoMes,
      despesasMes,
      lucroEstimado,
    };
  }, [ordensServico, entradas, saidas]);

  const osAbertas = useMemo(() => {
    return ordensServico
      .filter((os) => os.status !== 'entregue')
      .slice(0, 5);
  }, [ordensServico]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getClienteNome = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    return cliente?.nome || 'N/A';
  };

  const getVeiculoInfo = (veiculoId: string) => {
    const veiculo = veiculos.find((v) => v.id === veiculoId);
    return veiculo ? `${veiculo.modelo} - ${veiculo.placa}` : 'N/A';
  };

  const statCards = [
    {
      title: 'Em Conserto',
      value: stats.osEmConserto,
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Aguardando Peça',
      value: stats.osAguardandoPeca,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Concluídos (Mês)',
      value: stats.osConcluidas,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Faturamento (Mês)',
      value: formatCurrency(stats.faturamentoMes),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Despesas (Mês)',
      value: formatCurrency(stats.despesasMes),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Lucro Estimado',
      value: formatCurrency(stats.lucroEstimado),
      icon: TrendingUp,
      color: stats.lucroEstimado >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.lucroEstimado >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral da oficina
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* OS Abertas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Ordens de Serviço em Aberto</CardTitle>
          <Link to="/ordens-servico">
            <Button variant="outline" size="sm">
              Ver todas
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {osAbertas.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhuma OS em aberto"
              description="Todas as ordens de serviço foram finalizadas"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      OS
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Veículo
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {osAbertas.map((os) => (
                    <tr key={os.id} className="border-b last:border-0">
                      <td className="py-3 px-2 text-sm font-medium">
                        #{os.id.slice(0, 6)}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {getClienteNome(os.clienteId)}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {getVeiculoInfo(os.veiculoId)}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={os.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
