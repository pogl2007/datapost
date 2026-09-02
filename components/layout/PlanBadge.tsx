import { Badge } from '@/components/ui/Badge';
import { Crown } from 'lucide-react';

export function PlanBadge({ plan }: { plan: 'FREE' | 'PRO' }) {
  if (plan === 'PRO') {
    return (
      <Badge variant="accent" className="border-accent/50">
        <Crown size={12} /> PRO
      </Badge>
    );
  }
  return <Badge variant="muted">FREE</Badge>;
}
