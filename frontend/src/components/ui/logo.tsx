import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
};

/** Pergaminho da Torá do Doresh (vetor do torah.png). Cor via `currentColor`; padrão: azul da marca. */
export const LogoMark: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="174 174 676 676" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Rolo esquerdo */}
    <rect x="247" y="175" width="50" height="120" rx="25" />
    <path d="M207 325h130a10 10 0 0 0 10-10c0-25-32-43-75-43s-75 18-75 43a10 10 0 0 0 10 10Z" />
    <rect x="217" y="345" width="100" height="332" rx="6" />
    <path d="M207 697h130a10 10 0 0 1 10 10c0 25-32 43-75 43s-75-18-75-43a10 10 0 0 1 10-10Z" />
    <rect x="247" y="728" width="50" height="122" rx="25" />
    {/* Rolo direito */}
    <rect x="727" y="175" width="50" height="120" rx="25" />
    <path d="M687 325h130a10 10 0 0 0 10-10c0-25-32-43-75-43s-75 18-75 43a10 10 0 0 0 10 10Z" />
    <rect x="697" y="345" width="100" height="332" rx="6" />
    <path d="M687 697h130a10 10 0 0 1 10 10c0 25-32 43-75 43s-75-18-75-43a10 10 0 0 1 10-10Z" />
    <rect x="727" y="728" width="50" height="122" rx="25" />
    {/* Folha com o texto */}
    <rect x="344" y="326" width="337" height="372" rx="50" fill="none" stroke="currentColor" strokeWidth="28" />
    <g stroke="currentColor" strokeWidth="28" strokeLinecap="round">
      <path d="M412 405h200" />
      <path d="M412 469h120M576 469h36" />
      <path d="M412 533h200" />
      <path d="M412 597h78M533 597h79" />
    </g>
  </svg>
);

export const Logo: React.FC<LogoProps> = ({ size = 'md', className }) => (
  <LogoMark aria-hidden="true" className={cn('shrink-0 text-brand', sizeClasses[size], className)} />
);
