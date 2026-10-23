import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';

/** Moldura das telas públicas de conta (mesmo visual do login). */
export const AuthShell: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-[400px]"
    >
      <div className="flex flex-col items-center mb-8 space-y-3">
        <Logo size="xl" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Doresh</h1>
          <p lang="he" className="font-hebrew text-xl leading-none text-foreground/75">דּוֹרֵשׁ</p>
        </div>
      </div>

      <Card className="border-border shadow-xl shadow-black/5 bg-card">
        <CardContent className="pt-8 space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  </div>
);
