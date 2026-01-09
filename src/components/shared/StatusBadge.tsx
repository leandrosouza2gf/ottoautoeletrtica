import type { StatusOS, StatusPagamento, StatusComissao } from '@/types';
import { cn } from '@/lib/utils';

const statusOSLabels: Record<StatusOS, string> = {
  aguardando_diagnostico: 'Aguardando Diagnóstico',
  em_conserto: 'Em Conserto',
  aguardando_peca: 'Aguardando Peça',
  concluido: 'Concluído',
  entregue: 'Entregue',
};

const statusOSColors: Record<StatusOS, string> = {
  aguardando_diagnostico: 'status-pending',
  em_conserto: 'status-progress',
  aguardando_peca: 'status-waiting',
  concluido: 'status-completed',
  entregue: 'status-delivered',
};

interface StatusBadgeProps {
  status: StatusOS | StatusPagamento | StatusComissao;
  type?: 'os' | 'pagamento' | 'comissao';
}

export function StatusBadge({ status, type = 'os' }: StatusBadgeProps) {
  if (type === 'os') {
    return (
      <span className={cn('status-badge', statusOSColors[status as StatusOS])}>
        {statusOSLabels[status as StatusOS]}
      </span>
    );
  }

  if (type === 'pagamento') {
    return (
      <span className={cn(
        'status-badge',
        status === 'recebido' ? 'status-completed' : 'status-pending'
      )}>
        {status === 'recebido' ? 'Recebido' : 'Pendente'}
      </span>
    );
  }

  return (
    <span className={cn(
      'status-badge',
      status === 'paga' ? 'status-completed' : 'status-pending'
    )}>
      {status === 'paga' ? 'Paga' : 'Pendente'}
    </span>
  );
}
