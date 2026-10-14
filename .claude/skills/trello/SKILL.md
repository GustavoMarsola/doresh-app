---
name: trello
description: |
  Read and manage the Doresh product backlog in Trello through the REST API: list
  boards/lists/cards, create cards from user stories or bugs, move cards between lists, add
  labels, checklists (acceptance criteria) and comments, archive cards. Credentials are always
  loaded from the repo's .env via the bundled trello.sh helper. Use whenever the user or the
  product-owner agent wants to see or change the Trello backlog.
---

# Trello Backlog

## Credentials: always from `.env`

- Every call goes through `bash .claude/skills/trello/trello.sh`, which reads `TRELLO_API_KEY`
  and `TRELLO_TOKEN` from the repo-root `.env` **on each call** and sends them in the
  `Authorization` header
- Never `export` them, never `cat`/`grep` their values into the output, never put them in URLs,
  commands, files or commits. `.env` is git-ignored; keep it that way
- Missing variables → ask the user to add `TRELLO_API_KEY` and `TRELLO_TOKEN` to `.env`
  (key and token from https://trello.com/power-ups/admin). Auth error (401) → ask them to check/regenerate

## Boards

| Board | ID | Use |
|---|---|---|
| **Doresh** ❓ | ❓ `<fill on first use>` | Product backlog: the only board this skill writes to |
| Impera Energy | `6abd38af92e4d48d570676e0` | **Another project. Never read or write.** Blocked by `trello.sh` |
| RZ Solar - Tech | `6a3ce14af751db83bdf94e9d` | **Another company. Never read or write.** Blocked by `trello.sh` |

### First use (board not registered yet)

1. `$T GET /members/me/boards fields=name,closed filter=open` → show the user the names (not the ids of blocked boards)
2. Ask which one is Doresh (or whether to create one — creating a board needs explicit confirmation:
   `$T POST /boards name="Doresh" defaultLists=false`)
3. Record its id in the table above and fill the lists table below

### Current lists (Doresh) ❓

| List | ID |
|---|---|
| <fill> | <fill> |

Suggested flow 🧪 (the `product-owner` proposes; create only after the user approves):
`Ideias` → `Discovery` → `Backlog` → `Pronto para Dev` → `Em andamento` → `Em revisão` → `Concluído`.
Labels: see `.claude/agents/product-owner.md`. Get ids with `$T GET /boards/$B/labels fields=name,color`.

## Commands

```bash
T="bash .claude/skills/trello/trello.sh"
B=<doresh board id>

# read
$T GET /boards/$B/lists fields=name filter=open
$T GET /boards/$B/labels fields=name,color
$T GET /boards/$B/cards fields=name,idList,idLabels,due,shortUrl
$T GET /lists/<listId>/cards fields=name,shortUrl
$T GET /cards/<cardId> fields=name,desc,idList,idLabels,shortUrl checklists=all

# create a card (desc is Markdown)
$T POST /cards idList=<listId> name="Pregador gera esboço de sermão a partir de um texto" desc="$(cat <scratchpad>/card.md)" pos=bottom idLabels=<id1>,<id2>

# move / update
$T PUT /cards/<cardId> idList=<listId>
$T PUT /cards/<cardId> name="..." desc="..."
$T POST /cards/<cardId>/idLabels value=<labelId>

# checklist (acceptance criteria)
$T POST /checklists idCard=<cardId> name="Critérios de aceitação"
$T POST /checklists/<checklistId>/checkItems name="Dado ..., quando ..., então ..."

# comment
$T POST /cards/<cardId>/actions/comments text="..."

# archive (never delete)
$T PUT /cards/<cardId> closed=true

# labels / lists (only after the user approves the structure)
$T POST /labels idBoard=$B name="D1 Preparo" color=blue
$T POST /lists idBoard=$B name="Pronto para Dev" pos=bottom
```

Write long descriptions to a file in the scratchpad and pass `desc="$(cat file)"`. Parse JSON with
`python3 -c "import json,sys; ..."` when you need ids. Don't dump whole boards into the
conversation; select fields.

## Card content

Templates (story, bug), title rules and the Definition of Ready live in
`.claude/agents/product-owner.md`. Acceptance criteria go in the description **and** as a
"Critérios de aceitação" checklist.

## Rules

- **Confirm before writing**: show the cards to be created/changed (title, list, labels) and get a
  yes. Bulk (> 5 cards): always confirm, even if single cards were authorised
- **Archive, never delete**
- **Never put user content** (studies, comments, chat transcripts, real names/e-mails) in cards or comments — LGPD sensitive data
- Never touch boards of other projects (the script blocks the known ones)
- After writing, report each card's `shortUrl`
