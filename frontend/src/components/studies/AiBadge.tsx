import React from 'react';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AiBadge: React.FC = () => (
  <Badge variant="secondary" className="w-fit gap-1 rounded-full font-medium">
    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
    Gerado com IA
  </Badge>
);
