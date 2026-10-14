---
name: frontend-design-tokens
description: |
  Apply and extend the Doresh design system in the frontend: the HSL CSS variables in
  src/index.css mapped through tailwind.config.ts (shadcn convention), light and dark themes,
  WCAG contrast checks (with the pending fixes for primary, muted-foreground, destructive and
  dark accent text), typography (Inter for UI, Crimson Text for Scripture, Hebrew RTL), radius,
  verse-highlight palette, missing sidebar tokens, and component variants with cva. Use when
  theming, adding a colour/state/variant, replacing hard-coded colours, or when a component needs
  a style that doesn't exist yet.
---

# Design tokens and variants

Source of truth: `project/design/design_context.md` (§3 colour + contrast, §4 type, §5 visual
language, §7 app rules). If `src/index.css` changes, update that file's tables in the same PR.

## Rules (non-negotiable in components)

- Components use **semantic tokens only** (`bg-primary`, `text-muted-foreground`, `border-border`,
  `bg-card`). No hex, no Tailwind palette colours (`bg-slate-50`, `text-gray-500`, `bg-white`) —
  ~49 such usages exist today; fix them in files you touch
- **Gold is light**: one primary action per screen, active nav item, focus, small highlights
- Both themes: every change is checked in light **and** `.dark`
- State never by colour alone (icon + text)
- Generous radius (`--radius: 1rem`), soft shadows, thin Lucide icons

## Theme — `src/index.css` (HSL triplets, shadcn style)

Variables are HSL triplets (`--primary: 39 85% 35%;`) consumed as `hsl(var(--primary))` in
`tailwind.config.ts`. Keep that format; add new tokens the same way in **both** `:root` and `.dark`,
and expose them in `tailwind.config.ts` `theme.extend.colors`.

### Pending contrast fixes 🧪 (DS1 — apply only after the user approves)

| Token | Now | Proposed | Why |
|---|---|---|---|
| `--primary` (light) | `39 85% 35%` | `39 85% 30%` | white on gold 4.08 → 5.26; gold text on bg 4.0 → 5.16 |
| `--muted-foreground` (light) | `25 5% 45%` | `25 5% 40%` | 4.46 → 5.38 on bg |
| `--destructive` (light) | `0 84% 60%` | `0 72% 45%` | white on it 3.62 → 5.56 |
| `--accent-text` (new, dark) | — | `213 85% 65%` | accent as text on dark bg 1.85 → 6.67 |

Until approved, don't use `text-primary` for body-size text on light backgrounds and don't use
`text-accent` on dark backgrounds; mention it when you hit it.

### Missing tokens (DS2)

`tailwind.config.ts` references `--sidebar-*` but `index.css` doesn't define them. Either define them
(both themes) or remove the mapping — ask; don't leave classes that render without colour.

### Verse highlight palette (DS5) 🧪

User-chosen highlight colours are content: define them as tokens (`--hl-yellow`, `--hl-green`,
`--hl-blue`, `--hl-pink`, light and dark variants) chosen so `foreground` text on them is ≥ 4.5:1
in both themes. The backend stores a colour **name**, not a hex — confirm the stored values first.

## Checking contrast

```bash
python3 - <<'EOF'
import colorsys
def hsl(h,s,l): return colorsys.hls_to_rgb(h/360,l/100,s/100)
def lum(c):
    f=lambda v: v/12.92 if v<=0.03928 else ((v+0.055)/1.055)**2.4
    r,g,b=map(f,c); return 0.2126*r+0.7152*g+0.0722*b
def cr(a,b):
    hi,lo=sorted([lum(a),lum(b)],reverse=True); return (hi+0.05)/(lo+0.05)
print(round(cr(hsl(0,0,98), hsl(39,85,30)),2))
EOF
```

AA: 4.5 normal text, 3.0 large text (≥ 24 px, or ≥ 18.66 px bold) and UI components. Record new
pairs in `design_context.md` §3.

## Typography

- `font-inter` (default body) for UI; `font-crimson` for Scripture, verse lists and reading titles
- Hebrew: `lang="he" dir="rtl"` + `font-hebrew`; never let RTL text flip the surrounding layout
- Reading: ≥ 16 px on mobile, line-height ~1.6–1.7, max ~70ch; verse numbers `text-muted-foreground text-xs align-super`
- Weights: 400–600 for UI; 700 only in large display headings

## Variants with `cva`

Extend shadcn primitives through variants in their own file, never ad-hoc class strings repeated in pages.

```ts
const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      neutral: 'bg-muted text-muted-foreground',
      ai: 'bg-accent/10 text-accent dark:text-accent-text',
      brand: 'bg-primary/15 text-foreground',
      danger: 'bg-destructive/10 text-destructive',
    },
  },
  defaultVariants: { tone: 'neutral' },
});
```

Button variants: `default` (gold — one per screen), `outline`, `secondary`, `ghost`, `destructive`,
`link`. Touch targets ≥ 44 px on mobile (`h-11`).

## Adding a token

1. Check `design_context.md`; derive from the palette if missing
2. Compute contrast against `background`, `card` and `muted` in **both** themes
3. Add to `:root` and `.dark` + `tailwind.config.ts`; record the ratio in `design_context.md` §3
4. Brand decisions (new colours) are proposed to the user, not made silently
