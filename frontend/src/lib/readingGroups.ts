import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/components/auth/utils';
import { bookSlug, findBookBySlug } from '@/data/bibleCanon';
import type { Study } from '@/lib/studies';
import { PlanApiError, formatPassages, type PlanDay, type PlanPassage, type Weekday } from '@/lib/readingPlans';

const API = import.meta.env.VITE_API_HOST;

// ── Tipos (espelham backend/src/schemas/reading_groups_schemas.py) ──

export type GroupRole = 'leader' | 'member';

export interface GroupMember {
  id: string; // id da participação (o líder usa para remover)
  name: string | null; // só quando a pessoa escolheu aparecer com nome
  role: GroupRole;
  days_read: number;
  is_me: boolean;
}

export interface GroupNote {
  text: string;
  study_id: string | null;
  study_title: string | null;
  updated_at: string;
}

export interface GroupDay extends PlanDay {
  readers: number;
  is_meeting: boolean;
  note: GroupNote | null;
}

export interface GroupInvite {
  token: string;
  expires_at: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  title: string;
  role: GroupRole;
  members_count: number;
  start_date: string;
  end_date: string;
  reading_days: number;
  days_read: number;
  next_day: PlanDay | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupDetail extends GroupSummary {
  plan_slug: string;
  book: string | null;
  books: string[] | null;
  total_days: number;
  weekdays: Weekday[];
  meeting_weekday: Weekday | null;
  show_name: boolean;
  invite: GroupInvite | null; // só para o líder
  members: GroupMember[];
  days: GroupDay[];
}

export interface InvitePreview {
  group_id: string;
  name: string;
  title: string;
  leader_name: string;
  members_count: number;
  start_date: string;
  end_date: string;
  reading_days: number;
  already_member: boolean;
  next_passages: PlanPassage[];
}

export interface GroupInput {
  name: string;
  plan_id: string;
  start_date?: string;
  meeting_weekday?: Weekday | null;
  consent: boolean;
  show_name: boolean;
}

export interface GroupPatch {
  name?: string;
  start_date?: string;
  total_days?: number;
  weekdays?: Weekday[];
  meeting_weekday?: Weekday | null;
}

/** Versão do texto de consentimento mostrado na app (o backend guarda a sua própria). */
export const CONSENT_TEXT =
  'Entendo que participar de um grupo de leitura da Bíblia revela minha convicção religiosa, que o líder e os membros verão meu progresso de leitura (com meu nome só se eu permitir) e que posso sair a qualquer momento, apagando minha participação. Confirmo que tenho 18 anos ou mais.';

export const groupErrorMessage = (error: unknown) => {
  const code = error instanceof PlanApiError ? error.code : null;
  switch (code) {
    case 'reading_group.not_found':
      return 'Grupo não encontrado. Ele pode ter sido encerrado ou você saiu dele.';
    case 'reading_group.leader_only':
      return 'Só o líder do grupo pode fazer isso.';
    case 'reading_group.consent_required':
      return 'Para entrar, é preciso aceitar o termo de participação.';
    case 'reading_group.plan_not_found':
      return 'Escolha um dos seus planos para criar o grupo.';
    case 'reading_group.invite_invalid':
      return 'Este link de convite não existe ou foi cancelado pelo líder.';
    case 'reading_group.invite_expired':
      return 'Este link de convite expirou. Peça um novo ao líder.';
    case 'reading_group.leader_cannot_leave':
      return 'O líder não sai do grupo: encerre o grupo se quiser terminá-lo.';
    case 'reading_group.cannot_remove_leader':
      return 'O líder não pode ser removido.';
    case 'reading_group.study_not_found':
      return 'Esse estudo não está disponível. Escolha um dos seus estudos.';
    case 'reading_group.annotation_not_found':
      return 'Só dá para compartilhar destaques e comentários seus.';
    case 'reading_group.share_not_found':
      return 'Essa anotação já não está no mural.';
    case 'reading_group.reply_not_found':
      return 'Essa resposta já foi removida.';
    case 'reading_plan.too_many_days':
      return 'Esse prazo é longo demais para este plano. Escolha uma duração menor.';
    case 'reading_plan.invalid_duration':
      return 'Escolha uma duração entre 1 semana e 4 anos.';
    case 'reading_plan.invalid_weekdays':
      return 'Escolha pelo menos um dia da semana para ler.';
    default:
      return 'Verifique sua conexão e tente novamente.';
  }
};

/** "3 de 12 leram", "1 de 12 leu" ou "ninguém leu ainda" — sempre o agregado, nunca quem. */
export const readersLabel = (readers: number, total: number) =>
  readers === 0 ? 'ninguém leu ainda' : `${readers} de ${total} ${readers === 1 ? 'leu' : 'leram'}`;

// ── Links e partilha ──

export const inviteUrl = (token: string) => `${window.location.origin}/grupos/entrar/${token}`;

export const groupDayUrl = (groupId: string, day: number) => `${window.location.origin}/grupos/${groupId}/dia/${day}`;

/** Texto para o WhatsApp: só a referência e o link — nunca o texto bíblico (licença). */
export const shareDayText = (group: GroupSummary, day: PlanDay) =>
  `${group.name} · Dia ${day.index}: ${formatPassages(day.passages).join('; ')}\n${groupDayUrl(group.id, day.index)}`;

/** Partilha pelo sistema quando existe; senão copia. Devolve como foi partilhado. */
export const shareText = async (text: string, title: string): Promise<'shared' | 'copied'> => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') throw error;
    }
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
};

/** Link de convite pendente: guardado quando alguém abre o link sem estar logado. */
export const PENDING_INVITE_KEY = 'doresh:pending-invite';

export const takePendingInvite = (): string | null => {
  try {
    const token = localStorage.getItem(PENDING_INVITE_KEY);
    if (token) localStorage.removeItem(PENDING_INVITE_KEY);
    return token;
  } catch {
    return null;
  }
};

// ── API ──

const displayBook = (name: string) => findBookBySlug(bookSlug(name))?.name ?? name;
const normalizeDay = <T extends PlanDay>(day: T): T => ({
  ...day,
  passages: day.passages.map((p) => ({ ...p, book: displayBook(p.book) })),
});
const normalizeSummary = <T extends GroupSummary>(group: T): T => ({
  ...group,
  next_day: group.next_day && normalizeDay(group.next_day),
});
const normalizeGroup = (group: GroupDetail): GroupDetail => ({
  ...normalizeSummary(group),
  books: group.books?.map(displayBook) ?? null,
  days: group.days.map(normalizeDay),
});

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const res = await authFetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new PlanApiError(res.status, typeof body?.detail === 'string' ? body.detail : null);
  }
  return res.status === 204 ? (undefined as T) : res.json();
};

const groupOf = (r: { group: GroupDetail }) => normalizeGroup(r.group);

export const groupsApi = {
  list: () => request<{ groups: GroupSummary[] }>('/reading-groups').then((r) => r.groups.map(normalizeSummary)),
  get: (id: string) => request<{ group: GroupDetail }>(`/reading-groups/${id}`).then(groupOf),
  create: (input: GroupInput) => request<{ group: GroupDetail }>('/reading-groups', { method: 'POST', body: JSON.stringify(input) }).then(groupOf),
  update: (id: string, patch: GroupPatch) =>
    request<{ group: GroupDetail }>(`/reading-groups/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).then(groupOf),
  remove: (id: string) => request<void>(`/reading-groups/${id}`, { method: 'DELETE' }),
  createInvite: (id: string, days = 30) =>
    request<{ group: GroupDetail }>(`/reading-groups/${id}/invite`, { method: 'POST', body: JSON.stringify({ days }) }).then(groupOf),
  revokeInvite: (id: string) => request<{ group: GroupDetail }>(`/reading-groups/${id}/invite`, { method: 'DELETE' }).then(groupOf),
  invitePreview: (token: string) =>
    request<InvitePreview>(`/reading-groups/invites/${encodeURIComponent(token)}`).then((p) => ({
      ...p,
      next_passages: p.next_passages.map((x) => ({ ...x, book: displayBook(x.book) })),
    })),
  join: (token: string, show_name: boolean) =>
    request<{ group: GroupDetail }>(`/reading-groups/invites/${encodeURIComponent(token)}/join`, {
      method: 'POST',
      body: JSON.stringify({ consent: true, show_name }),
    }).then(groupOf),
  leave: (id: string) => request<void>(`/reading-groups/${id}/members/me`, { method: 'DELETE' }),
  removeMember: (id: string, memberId: string) =>
    request<{ group: GroupDetail }>(`/reading-groups/${id}/members/${memberId}`, { method: 'DELETE' }).then(groupOf),
  setShowName: (id: string, show_name: boolean) =>
    request<{ group: GroupDetail }>(`/reading-groups/${id}/members/me`, { method: 'PATCH', body: JSON.stringify({ show_name }) }).then(groupOf),
  setRead: (id: string, day: number, read: boolean) =>
    request<{ group: GroupDetail }>(`/reading-groups/${id}/days/${day}/read`, { method: read ? 'PUT' : 'DELETE' }).then(groupOf),
  putNote: (id: string, day: number, text: string, study_id: string | null) =>
    request<{ group: GroupDetail }>(`/reading-groups/${id}/days/${day}/note`, { method: 'PUT', body: JSON.stringify({ text, study_id }) }).then(groupOf),
  deleteNote: (id: string, day: number) =>
    request<{ group: GroupDetail }>(`/reading-groups/${id}/days/${day}/note`, { method: 'DELETE' }).then(groupOf),
  dayStudy: (id: string, day: number) => request<{ study: Study }>(`/reading-groups/${id}/days/${day}/study`).then((r) => r.study),
};

// ── Queries ──

export const groupKeys = {
  all: ['reading-groups'] as const,
  list: ['reading-groups', 'list'] as const,
  detail: (id: string) => ['reading-groups', 'detail', id] as const,
  invite: (token: string) => ['reading-groups', 'invite', token] as const,
  dayStudy: (id: string, day: number) => ['reading-groups', 'detail', id, 'study', day] as const,
};

const notRetryable = (error: unknown) => error instanceof PlanApiError && [403, 404, 410].includes(error.status);

export const useMyGroups = () => useQuery({ queryKey: groupKeys.list, queryFn: groupsApi.list });

export const useGroup = (id: string | undefined) =>
  useQuery({
    queryKey: groupKeys.detail(id ?? ''),
    queryFn: () => groupsApi.get(id!),
    enabled: !!id,
    retry: (count, error) => !notRetryable(error) && count < 2,
  });

export const useInvitePreview = (token: string | undefined) =>
  useQuery({
    queryKey: groupKeys.invite(token ?? ''),
    queryFn: () => groupsApi.invitePreview(token!),
    enabled: !!token,
    retry: (count, error) => !notRetryable(error) && count < 2,
  });

export const useGroupDayStudy = (id: string, day: number) =>
  useQuery({
    queryKey: groupKeys.dayStudy(id, day),
    queryFn: () => groupsApi.dayStudy(id, day),
    retry: (count, error) => !notRetryable(error) && count < 2,
  });

/** Guarda o grupo que a API devolveu e marca a lista como desatualizada. */
const useGroupUpdate = <V>(mutationFn: (vars: V) => Promise<GroupDetail>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (group) => {
      queryClient.setQueryData(groupKeys.detail(group.id), group);
      queryClient.invalidateQueries({ queryKey: groupKeys.list });
    },
  });
};

export const useCreateGroup = () => useGroupUpdate(groupsApi.create);
export const useUpdateGroup = (id: string) => useGroupUpdate((patch: GroupPatch) => groupsApi.update(id, patch));
export const useCreateInvite = (id: string) => useGroupUpdate(() => groupsApi.createInvite(id));
export const useRevokeInvite = (id: string) => useGroupUpdate(() => groupsApi.revokeInvite(id));
export const useJoinGroup = (token: string) => useGroupUpdate((show_name: boolean) => groupsApi.join(token, show_name));
export const useRemoveMember = (id: string) => useGroupUpdate((memberId: string) => groupsApi.removeMember(id, memberId));
export const useSetShowName = (id: string) => useGroupUpdate((show_name: boolean) => groupsApi.setShowName(id, show_name));
export const useSetGroupDayRead = (id: string) =>
  useGroupUpdate(({ day, read }: { day: number; read: boolean }) => groupsApi.setRead(id, day, read));
export const usePutNote = (id: string) =>
  useGroupUpdate(({ day, text, study_id }: { day: number; text: string; study_id: string | null }) => groupsApi.putNote(id, day, text, study_id));
export const useDeleteNote = (id: string) => useGroupUpdate((day: number) => groupsApi.deleteNote(id, day));

/** Sair ou encerrar: o grupo some do cache e a lista é recarregada. */
const useGroupRemoval = (mutationFn: (id: string) => Promise<void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: groupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.list });
    },
  });
};

export const useLeaveGroup = () => useGroupRemoval(groupsApi.leave);
export const useRemoveGroup = () => useGroupRemoval(groupsApi.remove);

// ── Mural da passagem (anotações partilhadas com o grupo) ──

export type ShareKind = 'comment' | 'highlight';

export interface ShareAuthor {
  name: string | null;
  role: GroupRole;
  is_me: boolean;
}

export interface ShareReply {
  id: string;
  author: ShareAuthor;
  text: string;
  created_at: string;
}

export interface Share {
  id: string;
  kind: ShareKind;
  author: ShareAuthor;
  book: string; // slug ("1_corintios"), como nos comentários
  chapter: number;
  verse_start: number;
  verse_end: number;
  text: string | null;
  color: string | null;
  hidden: boolean;
  reports: number; // só o líder recebe a contagem
  reported_by_me: boolean;
  replies: ShareReply[];
  created_at: string;
}

/** Onde uma anotação minha está partilhada. */
export interface MyShare {
  id: string;
  group_id: string;
  group_name: string;
  kind: ShareKind;
  comment_id: string | null;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
}

export type ShareInput =
  | { kind: 'comment'; comment_id: string }
  | { kind: 'highlight'; book: string; chapter: number; verse_start: number; verse_end: number };

/** A partilha (minha) de uma anotação num grupo, se existir. */
export const findMyShare = (shares: MyShare[], groupId: string, input: ShareInput) =>
  shares.find((s) =>
    s.group_id === groupId &&
    (input.kind === 'comment'
      ? s.comment_id === input.comment_id
      : s.kind === 'highlight' && s.book === bookSlug(input.book) && s.chapter === input.chapter && s.verse_start === input.verse_start && s.verse_end === input.verse_end),
  );

export const muralApi = {
  day: (id: string, day: number) => request<{ shares: Share[] }>(`/reading-groups/${id}/days/${day}/mural`).then((r) => r.shares),
  mine: () => request<{ shares: MyShare[] }>('/reading-groups/my-shares').then((r) => r.shares),
  share: (id: string, input: ShareInput) =>
    request<{ share: Share }>(`/reading-groups/${id}/shares`, { method: 'POST', body: JSON.stringify(input) }).then((r) => r.share),
  unshare: (id: string, shareId: string) => request<void>(`/reading-groups/${id}/shares/${shareId}`, { method: 'DELETE' }),
  reply: (id: string, shareId: string, text: string) =>
    request<{ share: Share }>(`/reading-groups/${id}/shares/${shareId}/replies`, { method: 'POST', body: JSON.stringify({ text }) }).then((r) => r.share),
  deleteReply: (id: string, shareId: string, replyId: string) =>
    request<{ share: Share }>(`/reading-groups/${id}/shares/${shareId}/replies/${replyId}`, { method: 'DELETE' }).then((r) => r.share),
  setHidden: (id: string, shareId: string, hidden: boolean) =>
    request<{ share: Share }>(`/reading-groups/${id}/shares/${shareId}/hidden`, { method: hidden ? 'PUT' : 'DELETE' }).then((r) => r.share),
  report: (id: string, shareId: string) =>
    request<{ share: Share }>(`/reading-groups/${id}/shares/${shareId}/report`, { method: 'POST' }).then((r) => r.share),
};

export const muralKeys = {
  day: (id: string, day: number) => ['reading-groups', 'mural', id, day] as const,
  mine: ['reading-groups', 'my-shares'] as const,
};

export const useDayMural = (id: string, day: number) =>
  useQuery({
    queryKey: muralKeys.day(id, day),
    queryFn: () => muralApi.day(id, day),
    retry: (count, error) => !notRetryable(error) && count < 2,
  });

export const useMyShares = (enabled = true) => useQuery({ queryKey: muralKeys.mine, queryFn: muralApi.mine, enabled });

/** Partilhar / desfazer: atualiza "minhas partilhas" e todos os murais. */
const useShareChange = <V, R>(mutationFn: (vars: V) => Promise<R>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: muralKeys.mine });
      queryClient.invalidateQueries({ queryKey: ['reading-groups', 'mural'] });
    },
  });
};

export const useShareAnnotation = () => useShareChange(({ groupId, input }: { groupId: string; input: ShareInput }) => muralApi.share(groupId, input));
export const useUnshareAnnotation = () => useShareChange(({ groupId, shareId }: { groupId: string; shareId: string }) => muralApi.unshare(groupId, shareId));

/** Respostas, ocultar e denunciar devolvem a partilha atualizada: substitui no mural do dia. */
const useShareUpdate = <V>(id: string, day: number, mutationFn: (vars: V) => Promise<Share>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (share) => {
      queryClient.setQueryData<Share[]>(muralKeys.day(id, day), (old) => old?.map((s) => (s.id === share.id ? share : s)) ?? old);
    },
  });
};

export const useReplyToShare = (id: string, day: number) =>
  useShareUpdate(id, day, ({ shareId, text }: { shareId: string; text: string }) => muralApi.reply(id, shareId, text));
export const useDeleteReply = (id: string, day: number) =>
  useShareUpdate(id, day, ({ shareId, replyId }: { shareId: string; replyId: string }) => muralApi.deleteReply(id, shareId, replyId));
export const useSetShareHidden = (id: string, day: number) =>
  useShareUpdate(id, day, ({ shareId, hidden }: { shareId: string; hidden: boolean }) => muralApi.setHidden(id, shareId, hidden));
export const useReportShare = (id: string, day: number) => useShareUpdate(id, day, (shareId: string) => muralApi.report(id, shareId));
