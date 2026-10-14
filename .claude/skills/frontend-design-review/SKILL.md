---
name: frontend-design-review
description: |
  Review a Doresh screen or frontend diff for polish before it ships: UX states (loading, empty,
  error, not found, pending), responsive at 360 px, reading comfort for Scripture, light and dark
  themes, accessibility (including Hebrew RTL), design tokens and contrast, pt-BR copy and tone,
  AI content labelling, privacy leaks (cache after logout/login, storage, events, console), and
  performance smells. Produces findings by severity and fixes what's in scope. Use before
  declaring any user-facing change done and before a launch.
---

# Design review

Review **what the user sees**, not only the code. If the app can run, look at it (`run` skill):
desktop (1280 px) and mobile (360 px), light and dark, logged in as a user with data and as a
brand-new user.

## 1. Scope

```bash
git diff --name-only origin/main...HEAD -- frontend/src
```

No branch → `git diff --name-only HEAD -- frontend/src`. List screens/components touched and the spec/story.

## 2. Checklist

### States
- [ ] Loading: skeleton shaped like the content (no blank screen, no layout jump)
- [ ] Empty for a **brand-new user**: guiding message + primary action
- [ ] Empty after filters: says so + "Limpar filtros"
- [ ] Error: pt-BR message saying what failed and what to do; retry where it makes sense
- [ ] Not found: `NotFoundPanel` with a way back; no hint the record exists for someone else
- [ ] Pending: buttons disabled with loading label; no double submit; AI actions show progress and can be cancelled

### Reading (Bible, studies)
- [ ] Scripture in `font-crimson`, ≥ 16 px on mobile, ~60–75 characters per line, line-height ≥ 1.6
- [ ] Verse numbers discreet; highlights keep text ≥ 4.5:1 in both themes
- [ ] Hebrew/Greek with correct `lang`/`dir`; layout doesn't flip

### Responsive (360 px)
- [ ] No horizontal page scroll; long words/references wrap
- [ ] Touch targets ≥ 44 px; primary action reachable with the thumb
- [ ] Dialogs/forms usable (full-screen on mobile), keyboard doesn't hide the submit button
- [ ] `FloatingAssistant` doesn't cover content or the primary action

### Themes
- [ ] Light and dark both legible; no hard-coded `bg-white`/`text-gray-*`/hex
- [ ] Contrast per `design_context.md` §3 (watch: white on gold, muted text, destructive, accent text in dark)

### Accessibility
- [ ] `<Label htmlFor>` on every input; errors linked (`aria-describedby`)
- [ ] Icon-only buttons have `aria-label`; dialogs have a title
- [ ] Full keyboard path; visible focus ring
- [ ] Colour never the only signal; heading order makes sense; page `<title>` set

### Brand and tokens (`frontend-design-tokens`)
- [ ] Semantic tokens only; **one** gold primary action per screen
- [ ] Radius/shadows/icons consistent with `design_context.md` §5

### Copy (pt-BR, `design_context.md` §6)
- [ ] No English leftovers (toasts, aria-labels, 404, alt) and no pt-PT ("ecrã", "guardar", "telemóvel")
- [ ] Buttons verb + object; errors say what to do; no hype, no emoji in UI
- [ ] Biblical references correct (book names, numbering); doubtful theological text → `talmid`

### AI
- [ ] AI-generated content visibly labelled; Ruach limits/errors explained

### Privacy (LGPD — religious content is sensitive)
- [ ] Logout → login as another user: nothing from the first user visible (lists, reader highlights, chat)
- [ ] No studies/comments/chat in browser storage beyond explicit drafts keyed by user
- [ ] `track()` events carry no content; no content in `console.*`
- [ ] No secret in `VITE_*`; no real user data in screenshots/fixtures

### Performance
- [ ] Lists paginated; no "fetch all and filter"
- [ ] Bible book cached (`staleTime: Infinity`); no refetch loops
- [ ] Heavy pages lazy-loaded; images sized/compressed (landing hero JPEGs)

## 3. Report

```
## Design review: <screen/PR>

Verified: <widths, themes, browser, users; what was not checked>

| # | Severity | Where | Problem | Fix |
|---|---|---|---|---|
| 1 | Critical | Library | After logout/login as B, A's studies flash for ~1 s | clear queryClient before navigate |
```

Severity: **Critical** (data leak, data loss, blocked task) · **High** (broken state, unusable on
mobile, a11y blocker, illegible theme, wrong copy) · **Medium** (inconsistency, missing polish) ·
**Low** (nit). Fix Critical/High in scope before calling it done; list Medium/Low for the user.
