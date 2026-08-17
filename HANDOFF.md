# Handoff — Scen IA refactor

Written 2026-08-17, after commit `b846719` on branch `agent-studio` (**not pushed**).
Read this with `SITE-TREE.md`, which is the full product map; §10 covers the new
information architecture specifically.

---

## 1. What this repo is

| | |
|---|---|
| Frontend | **one file** — `index.html`, 1.44 MB, ~9,400 lines. No build step. |
| Builder | `agent-studio.html`, 210 KB, standalone page, its own IIFE and storage key |
| Backend | `backend/server-connector/` — Next.js App Router, 73 API routes, separate Vercel project |
| Routing | `vercel.json`: `/api/*` proxies to `scen-backend.vercel.app`, everything else falls through to `index.html` |

**`index.html` is one baseline plus ~29 appended layers**, each a `<style id>` +
`<script id>` pair wrapping what came before. `views.finalqa` is redefined 18 times.
**The last definition wins — patch the last match, never the first.** Each layer is its
own `(function(){…})()`, so a top-level `var` in one layer is invisible to every other;
layers talk through explicit `window.__name` bridges.

To add behaviour: **append a new layer at the end**, wrap `views.*` / `navigate` /
`render` rather than replacing them. That is what the four layers below do.

---

## 2. How to run and test

```bash
python3 -m http.server 8765 --directory .
```

Then open `http://localhost:8765`. The backend **cannot run locally** — it needs
`DATABASE_URL`, storage and provider credentials — so every `/api/*` call 404s and the
app lands on the marketing page.

To get into the app shell locally, paste this in the console:

```js
state.auth={userId:'u',email:'you@example.com',workspaceId:'ws',role:'owner',emailVerified:true};
state.onboarded=true; saveState(); navigate('dashboard');
```

To exercise the Connections hub, stub the capability read as well:

```js
window.__realApi=window.api;
window.__fakeCaps={ai:{state:'connected'},images:{state:'connected'},video:{state:'connected'},
  data:{state:'connected'},auth:{state:'connected',methods:['email']},storage:{state:'connected'},
  domain:{state:'connected',count:1,live:1},payments:{state:'not_connected'},
  email:{state:'connected',provider:'resend'},analytics:{state:'unavailable'},
  crm:{state:'unavailable'},github:{state:'unavailable'},webhooks:{state:'unavailable'}};
window.api=async(p,o)=>p==='/api/capabilities'?{ok:true,capabilities:window.__fakeCaps}:window.__realApi(p,o);
```

Boot is asynchronous: `restoreSession()` resolves *after* your paste and will navigate
away. Re-run `navigate(...)` once, or wrap the setup in `setTimeout(…, 900)`.

Backend typecheck (the only automated check in the repo — there are no tests):

```bash
cd backend/server-connector && ./node_modules/.bin/tsc --noEmit
```

---

## 3. What the refactor did

Sidebar went from **80 links in 11 groups to 12 in 3**, with an Advanced toggle that
restores the full technical set. Nothing was deleted: all 89 original views still exist,
`views.*` is now **96**, and every legacy route still resolves, so old links and
bookmarks keep working.

Four layers, all at the end of `index.html`:

| Layer | Owns |
|---|---|
| `scen-simple-ia` | shell, sidebar, mode toggle, Home, Projects, Pages, Advanced Tools, Help, mobile tab bar, icon set |
| `scen-connections` | Connections hub, AI orchestrator, AI Builder, Business hub, Publish |
| `scen-settings-ia` | Settings tab strip, Media → 3D |
| `scen-marketing-ia` | public-page dead-ends |

Plus one new backend route: **`GET /api/capabilities`**
(`backend/server-connector/src/app/api/capabilities/route.ts`).

The route→destination map lives in code as `ROUTES` inside `scen-simple-ia`, and that
same object renders the Advanced Tools index — so the map and the UI cannot drift.

---

## 4. The two rules this code was written to

**a. A status a customer sees must come from the server.** Every per-provider status
endpoint is behind `requireAdmin()`, so a customer-facing page had no honest source and
could only guess. `GET /api/capabilities` requires a *user* session and returns
**booleans and provider ids only** — no key, endpoint or environment value. States are
`connected · setup_required · not_connected · error · unavailable`, and the UI adds
`checking` and `unknown`. **Never collapse `unknown` (the read failed) into
`not_connected`** — that reports a state you do not know.

**b. Only Domain is genuinely self-serve.** A customer can add a host and follow DNS.
AI, Data, Login, Storage, Payments and Email are **server-side env vars on the
scen-backend Vercel project**, set once by the operator — so those cards say who
configures them instead of offering a Connect button that cannot work. Analytics, CRM,
GitHub and Webhooks have **no backend adapter at all** and report "Not available yet".

Feature toggles *are* self-serve and real: Store, Bookings, Forms, products, services.
The orchestrator drives them by clicking a real hidden `[data-action]` element, so every
existing side effect, undo entry and version snapshot still happens.

---

## 5. The orchestrator, in one paragraph

`window.scenRun(text)` classifies intent against `INTENTS`, checks the required
capabilities, and either performs the task or shows a **Connect & Continue** gate.
The pending task is written to `state.pendingTask` so it **survives the page reload**
that a real OAuth or DNS flow causes, and the customer never retypes it.
`window.scenResume()` finishes it once the blocker clears — but **only while the
customer is still in the flow that asked** (`RESUME_HERE`), because an unguarded resume
yanked a user out of unrelated work during testing. Tasks expire after 6 hours.

Ordering matters in `INTENTS`: `emailform` must be tested before `form`, or
"a contact form, and email me the entries" matches the plain-form rule and the email
requirement is silently skipped. That was a real bug found in testing.

---

## 6. Verified

- 96 views render; 96 routes navigate — **zero JS errors**
- 22 staff routes blocked for non-staff; builder intact (19 tabs, canvas, AI director)
- Mobile 375px: no horizontal overflow, purpose-built bottom bar, 16px inputs
- Connect & Continue + resume, including across a page reload
- `tsc --noEmit` exits 0

---

## 7. What is NOT done — start here

1. **`agent-studio.html` was not refactored.** Separate 210KB page, own shell,
   14-question interview, 17 tool panels. The "Agent Studio becomes AI Builder" merge
   was implemented only for the in-app flow (`views.aibuilder` wrapping the existing
   create → plan → generation → builder routes). **Largest remaining item.**
2. **`GET /api/capabilities` has never run against a live database.** It typechecks and
   reuses existing status helpers, but was only tested against a browser stub.
3. **Pre-existing fake data remains** in wrapped views — `views.funnels` still shows a
   hardcoded "24,810 users". Not introduced here, not fixed here.
4. **Repo vs live divergence** (`SITE-TREE.md` finding #1): this repo has **1 template**,
   live scen.space has **37**, and `.vercel/project.json` still points at the
   `scen-space` project. **Deploying from this repo would cut the gallery to one card.**
   Resolve before any deploy.
5. **Not pushed.** `git push origin agent-studio` when ready.

---

## 8. Gotchas that cost time

- `applyAdminUI()` runs *before* `render()` inside `navigate()`, so staff-only cards
  drawn by a view stay visible unless you re-run it after render. The `render` wrapper
  in `scen-simple-ia` does this.
- An earlier layer listens on `document` in **capture** phase. To beat it, listen on
  `window` in capture — that fires first. This is how the public "Explore scene library"
  link was stopped from bouncing logged-out visitors to the sign-up screen.
- `files` and `versions` are **not routes** — they are builder panels. Linking to them
  falls through to the dashboard.
- `data-action="addPage"` is defined twice; the *later* layer opens a real modal that
  actually appends to `state.pages`. The earlier one only toasts.
- Use a private attribute (`data-sx` here) for new delegated handlers. There are 516
  existing `data-action` handlers to avoid clashing with.
