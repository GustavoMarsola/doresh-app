import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CONSENT_TEXT, groupErrorMessage, useCreateGroup } from '@/lib/readingGroups';
import { WEEKDAYS, todayISO, useMyPlans, type PlanSummary, type Weekday } from '@/lib/readingPlans';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Plano já escolhido (a partir da página do plano); senão a pessoa escolhe entre os seus. */
  plan?: PlanSummary;
}

/** Cria um grupo a partir de um dos planos da pessoa; o conteúdo e o ritmo do plano são copiados. */
export const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ open, onOpenChange, plan }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const myPlans = useMyPlans();
  const create = useCreateGroup();
  const [name, setName] = React.useState('');
  const [planId, setPlanId] = React.useState(plan?.id ?? '');
  const [startDate, setStartDate] = React.useState(todayISO());
  const [meeting, setMeeting] = React.useState<string>('none');
  const [showName, setShowName] = React.useState(true);
  const [consent, setConsent] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    create.reset();
    setName('');
    setPlanId(plan?.id ?? '');
    setStartDate(plan?.start_date && plan.start_date > todayISO() ? plan.start_date : todayISO());
    setMeeting('none');
    setShowName(true);
    setConsent(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const plans = plan ? [plan] : (myPlans.data ?? []);
  const ready = name.trim().length > 0 && planId && startDate && consent;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    create.mutate(
      {
        name: name.trim(),
        plan_id: planId,
        start_date: startDate,
        meeting_weekday: meeting === 'none' ? null : (Number(meeting) as Weekday),
        consent: true,
        show_name: showName,
      },
      {
        onSuccess: (group) => {
          onOpenChange(false);
          toast({ title: 'Grupo criado', description: 'Agora gere o link de convite e compartilhe com o grupo.' });
          navigate(`/grupos/${group.id}`);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !create.isPending && onOpenChange(next)}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Criar grupo de leitura</DialogTitle>
            <DialogDescription>
              O grupo segue o plano no mesmo ritmo. Cada pessoa marca a própria leitura; você vê quantos leram cada dia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="group-name">Nome do grupo</Label>
            <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Célula de terça, EBD jovens…" autoFocus />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-plan">Plano</Label>
            {plan ? (
              <p id="group-plan" className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">{plan.title}</p>
            ) : myPlans.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando seus planos…</p>
            ) : plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Você ainda não tem planos. Comece um plano e depois crie o grupo a partir dele.</p>
            ) : (
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger id="group-plan" className="h-10">
                  <SelectValue placeholder="Escolha um dos seus planos" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="group-start">Começar em</Label>
              <Input id="group-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-meeting">Dia do encontro</Label>
              <Select value={meeting} onValueChange={setMeeting}>
                <SelectTrigger id="group-meeting" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem encontro fixo</SelectItem>
                  {WEEKDAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.long}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={showName} onCheckedChange={(v) => setShowName(v === true)} className="mt-0.5" />
            <span className="text-foreground">Mostrar meu nome aos membros como líder do grupo</span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 text-sm">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" aria-required />
            <span className="text-foreground">{CONSENT_TEXT}</span>
          </label>

          {create.isError && (
            <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {groupErrorMessage(create.error)}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!ready || create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar grupo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
