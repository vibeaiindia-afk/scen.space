# Scen — Complete Product Tree

Built by reading the source, not the docs: `index.html` (1.35 MB / 9,248 lines),
`agent-studio.html` (210 KB), `vercel.json`, `prompt-library.json`,
`backend/server-connector/` (72 API routes), and the two standalone pages
(`ironclad.html`, `mostar/`). Every count below was extracted from the files and
then re-checked against the deployed https://scen.space on 2026-08-17.

Numbers at a glance:

| Surface | Count |
|---|---|
| Public URLs (no login) | 6 — `/`, `/preset/<slug>`, `/agent-studio.html`, `/prompt-library.json`, `/ironclad.html`, `/mostar/` |
| App views (`views.*`) | 89 |
| Staff-only routes (`__ADMIN_ROUTES`) | 15 |
| Sidebar links | 69 static + 11 injected at runtime = 80, in 11 groups |
| `data-action` handlers in index.html | 516 |
| Builder left-rail tabs / inspector tabs | 19 / 9 |
| Agent Studio interview questions | 14 |
| Agent Studio tool panels | 17 |
| Backend API routes | 72 |
| Database tables | 25 |
| Templates in repo / on live | 1 / 37 |

---

## 1. Deployment surface

`vercel.json` is the whole routing story. Vercel checks the filesystem first,
then applies the rewrites, so real files win over the SPA catch-all.

```
scen.space/
│
├── [static files — served directly]
│   ├── /agent-studio.html      the 4D Website Builder            ← main product entry
│   ├── /prompt-library.json    119 prompt starting points (fetched by the Prompt Library view)
│   ├── /ironclad.html          standalone "IRONCLAD Wrestling" page   ⚠ live, unlinked
│   └── /mostar/                standalone 3-file site (index.html + styles.css + script.js)
│       └──                     "Mostar city"                          ⚠ live, unlinked
│
├── /api/:path*   →  https://scen-backend.vercel.app/api/:path*
│                    (separate Vercel project, rooted at backend/server-connector)
│
└── /((?!api/|prompt-library.json|agent-studio).*)  →  /index.html
    ├── /                  #marketing        public home page
    ├── /preset/<slug>     #presetView       a template as a full standalone site (public)
    ├── /agent             → redirects to /agent-studio.html (retired in-app builder)
    └── any other path     index.html, then the router decides
```

Two independent gates inside `index.html`:

```
PUBLIC_ROUTES = { marketing, auth }                        index.html:202681
  └── anything else with no session → auth, and the intended route is kept in state.pendingRoute

__ADMIN_ROUTES = 15 staff-only routes                      index.html:1130310
  admin · integrations · production · productionready · preapiaudit · finalqa ·
  uxstates · mobileqa · globalsearch · auditlogs · security · roles ·
  clientreview · handoff · uxpolish
  └── links hidden by applyAdminUI() AND the route blocked in navigate(),
      because a hidden link is still reachable by URL
```

---

## 2. Public home page — `/`

```
/  (section#marketing)
│
├── nav.mnav
│   ├── logo "Scen"                     → top of #marketing
│   ├── .mlinks
│   │   ├── Features                    → #features      anchor
│   │   ├── Showcase                    → #showcase      anchor
│   │   ├── Pricing                     → #pricing       anchor
│   │   ├── Templates                   → #templates     anchor (section injected at runtime)
│   │   └── Docs                        → data-nav="helpdocs"
│   │                                     ⚠ not a public route → logged-out visitor
│   │                                       lands on the Auth screen instead of docs
│   └── .mactions
│       ├── ● 4D Website Builder        → /agent-studio.html     ← the real product entry
│       ├── Log in                      → #auth
│       └── Start building ↗            → #auth
│
├── header.hero
│   ├── .cinematic-field                depth grid · 2 halos · cursor glow · scan line
│   ├── .hero-scroll-meter              #heroScrollMeter
│   ├── .hero-copy
│   │   ├── kicker   "AI + spatial web creation"
│   │   ├── h1       "One brief. / A world that moves."
│   │   ├── lead     "Generate cinematic 3D websites from one brief…"
│   │   └── .proofs  Prompt → Website · 3D Scroll Scenes · Visual Editor ·
│   │                Responsive · No-code motion
│   │                └── "Explore scene library ↗"  → navigate('scenes')  ⚠ gated → Auth
│   ├── .world-stage #worldStage / #world
│   │   ├── rings r1 r2 · orb · float-page fp1–fp4 (wireframe pages)
│   │   └── labels  Live 3D scene · AI-generated structure · Scroll-linked motion
│   └── .prompt-dock                    ← the conversion widget
│       ├── textarea #heroPrompt        "Describe your website — e.g. a cinematic
│       │                                luxury resort in Jaipur…"
│       ├── chips  Business · SaaS · Portfolio · Restaurant · Real Estate
│       └── "Generate world →"          data-action="heroGenerate"   index.html:275154
│           └── keeps the typed brief (so it survives sign-up),
│               startNewProject() → Auth → generation, never an empty dashboard
│
├── .brand-hero-strip   One continuous system · Builder · Motion · Launch
├── .marquee            AI WEBSITE AGENT · 3D MOTION ENGINE · VISUAL BUILDER ·
│                       RESPONSIVE EDITING · PUBLISH ANYWHERE
│
├── §#showcase          "Not templates. / Living web worlds."
│   ├── Spatial commerce — Orbit Store
│   └── Hospitality — Silent Resort
│
├── §#features          "One flow. / From brief to live."
│   ├── ✦ Creative Director    prompt → pages, sections, brand, copy, motion planning
│   ├── ◈ 3D Scene Builder     keyframe depth, scroll transforms, sticky sequences, parallax
│   └── ⌘ AI + Visual Editing  chat with the site, or click an element and edit it
│
├── §#templates         injected by <script id="agent-entry-runtime">, inserted before #pricing
│   │                   live heading: "Start from a template. Then tell it what to change."
│   ├── one card per TEMPLATES entry
│   │   ├── Preview ↗   → /preset/<slug>   (new tab, the whole site)
│   │   └── Customize   → /agent-studio.html?template=<slug>
│   │                     + the full seed written to localStorage["scen.agentstudio.seed"]
│   │                       (a query string cannot carry a whole preset)
│   └── live only: 11 industry "agent start" cards → ?start=<industry>
│       Restaurant & café · Fashion & retail · Real estate · Creative agency ·
│       SaaS product · Portfolio · Clinic & wellness · Gym & fitness ·
│       Education · Events · Travel & place
│
├── §#pricing           "Simple plans. / Upgrade as you grow."
│   ├── Basic · Plus · Pro · Premium (₹12,999/mo · 25,000 credits/mo)
│   └── each card: price · credits/mo + meter · "~N sites/mo, ~N ZIP exports" ·
│       feature list · Subscribe → data-action="choosePlan"
│       └── no session → toast "Sign in to subscribe" → Auth
│           with session → Cashfree subscribe modal
│
└── footer
    ├── logo + "3D-native AI website creation system."
    ├── Help & Docs → helpdocs      ⚠ gated
    ├── Privacy     → Legal Center (privacy tab)
    └── Terms       → Legal Center (terms tab)
```

**So of the six things in the nav, four are public anchors on this page, one
(4D Website Builder) is a separate page, and Docs is not public at all.**

---

## 3. Preset system — `/preset/<slug>` (public)

```
/preset/<slug>
├── presetFromPath()        matches /^\/preset\/([a-z0-9-]+)\/?$/ against TEMPLATES
│                           (a later layer re-matches on a slugified name, so
│                            "Aetheris Voyage" resolves as /preset/aetheris-voyage)
├── showPreset(tpl)         hides #marketing, #auth, #appShell; shows #presetView
│                           edits mutate a deep copy — never the shared TEMPLATES entry
└── three renderers, most specific first
    ├── renderCinemaPreset()   templates with cinema:true
    ├── power hero preset      templates with a powerHero block
    │                          (dormant in the repo: TEMPLATES was cut back to Mostar)
    └── base preset renderer

Also: the Templates gallery cards each load /preset/<slug> in an iframe and scrub it,
so a card plays the real website instead of showing a picture of it (only a few run at once).
```

---

## 4. Auth — `#auth`

```
#auth (.auth-view)
├── .auth-art       rotating cube + "Build a world. Not another page."
└── .auth-panel
    ├── Google      data-action="googleAuth"  → /api/auth/google/start
    ├── Email + password  (#authEmail, #authPassword)
    ├── #authError
    ├── Create account → / Sign in           → /api/auth/signup | /api/auth/login
    └── authToggle  switches the form between sign-up and sign-in
Session is an HttpOnly cookie — the browser never holds a token (index.html:210394).
```

---

## 5. The app — `#appShell`, 89 views

```
#appShell
├── header.app-top
│   └── logo · ⌘K search #appSearch · credits pill #creditPill · Admin ·
│       avatar · Sign out
├── aside.app-sidebar     ＋ New project → create
├── main#appMain          the rendered view
├── #commandPalette       ⌘K — pages, tools and actions
├── #uxStatusbar          save dot · Online/Offline · ⌘K
├── #cinematicPreloader   "Building the world"
├── #presetView           /preset/<slug> renders here
└── #modal                every modal
```

### 5.1 Sidebar — 80 links in 11 groups

`*` = staff-only (in `__ADMIN_ROUTES`) · `+` = link injected at runtime by a later layer

```
Workspace
├── ⌂ Home                dashboard          greeting() · "Your spatial website workspace is ready."
├── ◫ Projects            projects           Create, organize and publish every website
├── ▦ Templates           templates          Premium starting points — preview before customizing
└── ✧ Prompt library      library          + 119 starting points from /prompt-library.json
                                             (the link is a clone of the Templates link — the
                                              router reads data-nav, not data-route)

Create
├── ✦ Agent Studio        → /agent-studio.html   (leaves the SPA)
├── ✦ AI Studio           studio             ⚠ still in the repo's markup, but navigate('studio')
│                                             is patched to location.href = /agent-studio.html,
│                                             so the link leaves the app (see §9.5)
├── ◉ Media               media              All uploaded, generated and exported assets
└── ◎ Domains             domains            Connect a domain you own, DNS / SSL status

Business  (17)
├── ⌁ Analytics           analytics          Traffic, engagement and conversion
├── ◈ Events              events             Analytics events, then connect a provider
├── ◌ Leads               leads              Inquiries from every published website
├── ▤ Forms               forms              Conversion flows → Leads (+ per-form logic layer)
├── ▥ CMS                 cms                Collections powering cards, galleries, journals
├── ◫ Store               store              Products, cart, checkout, orders
├── ◇ Product Detail      productdetail      Product page, variants, buying experience
├── ▥ Inventory           inventory          Stock across products and variants
├── ▣ Orders              orders             Payment state, fulfillment, customer history
├── % Discounts           discounts          Promotion rules
├── ◇ Shipping & Tax      shipping           Regional delivery and tax behaviour
├── ◫ Checkout Design     checkoutdesign     Checkout experience design
├── ◷ Bookings            bookings           Services, availability, confirmations
├── ▦ Booking Calendar    bookingcalendar    Operational month/agenda calendar
├── ◷ Availability Rules  availability       When customers can book
├── ↳ Funnels             funnels            Website actions as one visual journey
└── ⌕ Site Search         search             Index pages and CMS content

Site Ops  (10)
├── 文 Languages           localization       Localize pages on one design system
├── 文 Per-page Copy       pagetranslations   Every page, every enabled language
├── ↪ Redirects & 404     redirects          URL migrations + custom 404
├── ⇩ Backup / Import     backups            Portable project snapshots
├── ◉ Privacy             privacy            Cookie & consent centre
├── </> Custom Code       customcode         Snippets and embeds (not executed in the prototype)
├── ⚙ Project Settings    projectsettings    Identity, indexing, access, launch behaviour
├── ✉ Email Templates     notifications      Transactional email design
├── ◉ Membership          members            Member tiers and gated content
└── ♙ User Accounts       accounts           Customer profiles, tiers, saved products

Team & QA  (2 static + 3 injected)
├── ◎ Collaboration       collaboration      Previews, roles, comments
├── ◉ Client Review     * clientreview     + Pin feedback to 3D objects, branch scenes, compare
├── ⇩ Export & Handoff  * handoff          + Package projects for engineering or client ownership
├── ✓ Final Product Polish * uxpolish      + Actions, responsive, a11y, motion, performance
└── ◒ Accessibility       accessibility      Motion, contrast, focus, semantic QA

Account  (3 static + 1 injected)
├── ◇ Billing & Credits   billing            Plans, credits, usage history
├── ⌾ Auth & Email        authemail        + Real identity, session security, email control plane
├── ♙ Team                team               Invite collaborators, workspace access
└── ⚙ Settings            settings           Workspace identity, brand kit, notifications, security

Builder Power Tools  (8 static + 6 injected)
├── ⌘ Command Center      commandcenter      Move through the product without hunting menus
├── ↻ Autosave & Recovery recovery           Local-first protection for every change
├── ◈ Design Tokens       designtokens       Colour, radius, spacing, type, depth
├── ▦ Component Variants  variants           Reusable visual states without duplication
├── 〽 Motion Lab          motionlab          Timing, easing and keyframes
├── ◈ 3D Scene Library    scenes             Spatial scene patterns, no external APIs
├── ◆ Cinematic Sequencer sequencer          Chapters, camera moves, transitions, adaptive loading
├── 〽 Motion Studio       motionstudio     + Type, frames, sound cues and page transitions
├── ◈ 3D Assets & Materials assetstudio    + Objects, materials, environments, shadows, reflections
├── ⚡ Effects & Physics   effects          + Particles, physics, liquid, atmosphere, post-processing
├── ⌘ Scene Composer      scenecomposer    + Scene systems, hierarchy, constraints, comparisons
├── ⌗ Precision Editing   precision        + Snap, align, multi-select, group, object states
├── ✦ Interaction & Lighting interactions  + Cursor behaviour, magnetics, 3D hover, scene lighting
└── ▣ Breakpoints         breakpoints        Exact responsive widths, not device presets

Operations  (9)
├── ◉ Notifications       activity           One inbox: publishing, orders, bookings, team, system
├── ⚡ Performance         performance        Payload, LCP, media prep
├── ◌ Error Monitor       monitoring         Broken routes, runtime warnings
├── ≡ Audit Logs        * auditlogs          Publishing, admin, team, billing, security changes
├── ⌾ Security          * security           Sessions, login protection, workspace controls
├── ♙ Roles             * roles              What each workspace role can do
├── ? Support             support            Bugs, feedback, feature requests
├── ◎ Product Tour        onboardingcenter   Guided path through the product tree
└── ✓ Launch Checklist    launchcheck        Product, business, performance, security, content

Brand & Help
├── ◇ Brand Studio        brandstudio        Name, voice, colours, promise
├── ✎ Product Copy        copycenter         UX writing for onboarding, empty states, feedback
├── ? Help & Docs         helpdocs           Search + "15-minute build path" + principles
└── § Legal Center        legal              Privacy / Terms / acceptable use placeholders

Final Pre-API  (5, all staff-only)
├── ◌ UX States Lab     * uxstates           Loading, empty, error, success states
├── ▯ Mobile Polish     * mobileqa           Touch-first controls, safe areas, compact editing
├── ⌕ Global Search     * globalsearch       Modules, projects, pages, products, CMS in one place
├── ✓ Pre-API Audit     * preapiaudit        One completion gate before provider keys
└── ◎ Final QA Sweep    * finalqa            Routes, actions, responsive, pre-API performance

System
├── ✓ Production Readiness * productionready Architecture, safety and launch gates
├── ◈ Production        * production         Everything needed to run the finished site
├── ▣ Admin             * admin              Admin Command Center
└── ⌁ API & Keys [LAST] * integrations       Connect providers to a Vercel project + server secrets
```

### 5.2 Views reachable without a sidebar link

```
create            Create new website — 5 methods:
                  ✦ Generate with AI (brief → plan → site) · ▦ Use template ·
                  ↗ Import website (from URL) · ▧ Screenshot → Website · ＋ Blank canvas
                  → big prompt box + "Build project plan →"
plan              Project plan — review the website system before generation
generation        Generating your website — 7-step pipeline:
                  Understanding brief → Creating sitemap → Visual direction →
                  Writing content → Designing pages → Building 3D scene → Quality check
                  (+ a Visuals step: hero image and background video)
builder           the visual editor (see 5.3) — opened from a project, not the sidebar
onboarding        4 steps: Welcome → Work type → Visual default → Ready

Provider control planes — linked only from Integrations/Admin cards
├── aigateway         Admin · AI Text & Code Gateway
├── imagegateway      Image Generation Gateway
├── videogateway      Video gateway (endpoints + policy + job log)
├── dbstorage         Database & Storage Foundation
├── billingops        Billing Control Center
├── vercelconnector   Admin · Real Vercel Connector
└── authemail         Authentication & Email
    ⚠ none of these seven is in __ADMIN_ROUTES, so any signed-in user can reach
      them by route — and authemail even injects a visible sidebar link.
      The server side is gated separately: every /api/admin/* route calls
      requireAdmin() (src/lib/admin-auth.ts), so the panels would render but
      their calls should be refused. Client-side gap, not a secret leak.
```

### 5.3 Builder — the visual editor

```
route 'builder'  (builderView, index.html:266155)
├── .builder-top     ← back · project name · "Saved locally" · ↶ ↷ ·
│                    Desktop | Tablet | Mobile · ⌁ Timeline · Preview · Publish
├── .builder-left    19 tabs, regrouped into 6 by RAIL_GROUPS (index.html:1133234)
│   ├── ▤ Build      pages · components · layers · global
│   ├── ◇ Design     brand · media
│   ├── ◈ 3D Scene   scenes · scenecomposer · assetstudio · effects · precision
│   ├── 〽 Motion     motionstudio · sequence · interactions
│   ├── ✦ AI         ai  → AI Creative Director: edits the current site instead of
│   │                     regenerating it; canvas text is directly editable
│   └── ✓ Ship       review · handoff · polish · history
├── .builder-canvas-wrap
│   └── .canvas-device (desktop|tablet|mobile)
│       ├── .site-preview-nav       logo · links · CTA
│       ├── .site-hero              contenteditable h1 / p / up to 3 CTAs + 3D cube
│       ├── state.components.map()  each section rendered and selectable
│       └── "End of page"           drag to reorder, edit copy, or use the AI director
├── .builder-right   9 inspector tabs, regrouped into 4 by PROP_GROUPS
│   ├── Design   design · device
│   ├── Motion   motion · scene · interact
│   ├── SEO      seo
│   └── Checks   qa · logic · a11y
└── motionTimeline()  when ⌁ Timeline is on
```

### 5.4 How the file is built (worth knowing before editing it)

`index.html` is one baseline plus ~25 appended layers, each a
`<style id="…">` + `<script id="…">` pair that **wraps what came before**:

```
finalPreApiStyles · final-qa-polish · cinematic-sequencer-style/-runtime-polish ·
final-qa-runtime · scen-interaction-lighting · scen-asset-material ·
scen-effects-physics · scene-composer · precision-editing · client-review ·
export-handoff · final-product-polish · production-readiness ·
real-vercel-connector · scen-payments-credits · cinemaCss · thumbCss ·
liveThumbCss · sceneCss · mediaCss · panelMediaCss · domainsCss · hero3dCss ·
motionStudioCss · verCss · mobilePolishCss · libraryCss · agent-entry ·
myTplCss · agent-build-renderer
```

Consequences: `views.finalqa` is redefined 18 times and `views.integrations`
7 times — each layer does `const old = views.x; views.x = () => old() + '…'`.
**The last definition wins, so patch the last match, never the first.**

---

## 6. `/agent-studio.html` — the 4D Website Builder

One file, one IIFE, one storage key (`localStorage["scen.agentstudio.v1"]`).
Title: *Scen Agent Studio — brief → plan → build*.

### 6.1 Shell

```
agent-studio.html
├── header.topbar
│   ├── tb-left
│   │   ├── logo "scen"
│   │   ├── #projBtn / #projName          "Untitled project"
│   │   └── seg [role=tablist]            Design | Build
│   │        Design → conversation (#chatBody) · Build → build stream (#streamBody)
│   ├── nav.tb-center                     ⚒ Tools | ▭ Preview (+#prevBadge) | ❮❯ Code
│   └── tb-right
│       ├── #acctPill      workspace + credits   (signed out: "Not signed in")
│       ├── #resetBtn ⟲    confirmReset → new project
│       ├── Invite         email + role modal    → POST /api/workspaces/invitations
│       └── Publish        publishFlow           → POST /api/publish
│
└── .shell
    ├── aside.rail          ◎ chat · ▤ brief · ＋ new · ? about
    ├── §#chatCol
    │   ├── .chat-head      ● #liveDot · "Scen Agent" · #aiPill (gateway) · #phasePill
    │   │                   phase: Interview → Plan → Building… → Live preview
    │   ├── #chatBody       messages (Design mode)
    │   ├── #streamBody     step stream (Build mode)
    │   └── .composer
    │       ├── #attStrip   attached reference images (a colour is pulled out of the first one)
    │       ├── #input      "Message the agent…"
    │       └── .comp-bar   ＋ attach · ⛁ Lite/Pro depth · Plan (show plan first) ·
    │                       ✦ AI (use the gateway) · 🎙 mic (SpeechRecognition) · ↑ send
    ├── §#toolsCol          17 tool panels (6.3)
    └── main#mainPane       active panel, or Preview, or Code
```

### 6.2 The interview — `FLOW`, 14 questions

```
phase: interview
├── 1  kind        single  Website | Mobile app | Website + app
├── 2  industry    single  restaurant · realestate · fashion · agency · saas ·
│                          portfolio · clinic · fitness · education · events ·
│                          travel · other
│                          → preloads that industry's pages, features and accent
├── 3  name        text    a seeded template name survives a skip, else suggestName()
├── 4  pitch       text    becomes the line under the headline ("Write it for me" allowed)
├── 5  goal        single  sell | lead | book | show | signup
│                          → auto-adds store / forms / bookings / accounts
├── 6  audience    text    optional; changes the tone of the copy
├── 7  pages       multi   industry default + 28 options (Home, About, Services, Work,
│                          Shop, Menu, Listings, Courses, Classes, Events, Gallery,
│                          Lookbook, Pricing, Blog, Reservations, Book, Team, Faculty,
│                          Admissions, Membership, Trainers, Treatments, Product,
│                          Docs, Tickets, Venue, FAQ, Contact)
├── 8  features    multi   🛍 store · 📅 bookings · ✎ blog/CMS · ✉ forms · 👤 accounts ·
│                          🌐 multi-language · ▦ gallery · 📍 maps · 📈 analytics · 💬 chat
├── 9  style       single  cinematic | minimal | editorial | luxury | playful
├── 10 accent      color   from your reference image · industry suggestion · 8 presets ·
│                          named colours accepted
├── 11 motion      single  subtle | cinematic | full 3D
│                          (full 3D stays off under prefers-reduced-motion)
├── 12 content     single  agent writes everything | mix | I have my own copy
├── 13 languages   multi   English · Hindi · French · Arabic · Spanish · German
│                          (>1 adds the multilang module and locale URLs)
└── 14 domain      text    custom domain, else <slug>.scen.space
      │
      ▼
phase: review    plan shown · "Change something" jumps back to any answer ·
      │          free text here is parsed and applied (handleReviewText)
      ▼
phase: building  → phase: built    live preview + downloadable files
```

Seeding (`seedFromUrl`) — the interview shortens when it arrives pre-filled:

```
?template=<slug>   localStorage["scen.agentstudio.seed"] written by the site,
                   falling back to TEMPLATE_SEEDS (mostar)
?start=<industry>  industry pack: pages + features + accent + pitch
SEED_SKIP          kind · industry · pitch · audience · pages · style · motion ·
                   content · languages are skipped → ~5 questions left
```

### 6.3 Tools column — 17 panels

```
PROJECT
├── ▤ Brief        the answers, N/10 filled, every row editable
├── ◇ Plan         pages × sections, file count, credit estimate
├── ⌁ Build log    every step with its timing and the provider that ran it
└── ⌸ Files        the generated file list

SCEN CLOUD  (these read the real backend)
├── ✦ AI gateway      provider/model status + live probe   GET  /api/ai/generate
├── ◈ Publishing      history, slug, live URL              POST /api/publish
├── 🌐 Domains         list + add                           GET/POST /api/domains
├── ⛁ Database        tables and migration status
├── ◍ Users & Auth    session and account                  GET  /api/auth/me
├── 📈 Monitoring      project events
├── ▦ App Storage     assets                               GET/POST /api/assets
└── ⛨ Security Center sessions, revoke others              GET/DELETE /api/auth/sessions

SETUP
├── ⧉ Integrations
├── ⑂ Git
├── 🔑 Secrets
└── ✦ Agent Skills

(PANE.growth exists in the code but is absent from TOOLS — unreachable.)
```

### 6.4 Build pipeline

```
buildPlanSteps() → startBuild()
1  Reading the brief              14 answers · N pages
2  Planning the structure         live: X.writePlan() — the gateway lays out the pages
                                  offline: local planner (sectionsFor)
3  Building the design system     style · accent · motion
4  Writing copy                   live: X.writeCopy() — headlines, sections, FAQs
                                  offline: local writer
5  Writing site/<page>.html       one step per page, sections logged as they are written
6  Compiling site/styles.css      tokens, layout, responsive rules
7  Wiring site/app.js             scroll reveals, navigation, forms
8  Wiring <each feature>          e.g. store → "Catalogue, cart and checkout"
9  app/App.jsx + app/theme.js     only when kind = app | both
10 brief.json + README.md         so the same brief can be rerun
11 Running checks                 headings, link targets, contrast, mobile widths

A live plan that arrives mid-build is what gets written — each page step reads
sectionsFor() at write time rather than trusting the plan captured at step 1.
```

Output (`generate()`):

```
<project>/
├── site/
│   ├── index.html      ← Home
│   ├── <page>.html     one per chosen page
│   ├── styles.css
│   └── app.js
├── app/                only for kind = app | both
│   ├── App.jsx
│   └── theme.js
├── brief.json          the whole brief, replayable
└── README.md
```

Section vocabulary (`SECLABEL` / `SEC`):

```
hero · phero (page header) · logos (marquee) · services · servicelist ·
showcase (gallery) · stats · products · booking · pricing · testimonial · faq ·
posts (blog teaser) · team · contact · map · steps (process) · prose (story) · cta
```

`sectionsFor()` — a live AI plan wins; otherwise pages are matched by name
(shop/menu → products, book/reserve → booking + map, work/gallery → showcase,
team → team, admissions → process + contact …). Depth **Pro** adds logos, stats,
testimonial and FAQ on top.

### 6.5 Preview / Code

```
▭ Preview   iframe #prevFrame, srcdoc from previewDoc()
            ├── page selector #pageSel
            ├── device desktop / mobile
            └── site preview | app preview (appPreviewDoc: tab bar + screens)
❮❯ Code     file tree grouped by folder, highlighted source
            ├── download one file
            └── Download all
```

### 6.6 Everything in the studio that hits the backend

```
GET    /api/auth/me                 account + workspace
GET    /api/billing/credits         credit pill
POST   /api/projects                save
PATCH  /api/projects/<id>           save a version
GET    /api/domains · POST          domains panel + addDomainFlow
POST   /api/publish                 publishFlow (subdomain or custom host)
POST   /api/workspaces/invitations  inviteFlow
GET    /api/auth/sessions           security panel
DELETE /api/auth/sessions           revoke other sessions
GET    /api/assets · POST           app storage
POST   /api/image/generate          heroImageFlow
POST   /api/ai/generate             plan + copy + edits + probe
GET    /api/store/products          store panel
```

Signed out, the studio says so plainly and keeps working:
*"Not signed in, so the gateway is refusing requests. Sign in on Scen and reload,
or keep building with the local writers."*

---

## 7. Backend — `backend/server-connector/` (72 routes)

A separate Vercel project (Next.js App Router), reached only through the
`/api/*` rewrite.

```
/api
├── auth/
│   ├── signup · login · logout · me
│   ├── sessions · sessions/[id]
│   ├── verify/request · verify/confirm
│   ├── password/reset/request · password/reset/confirm
│   └── google/start · google/callback
├── projects/
│   ├── (list, create)
│   └── [id]/ · [id]/versions · [id]/versions/[versionId]
│              · [id]/scenes  · [id]/scenes/[sceneId]
├── publish
├── sites/[slug] · sites/[slug]/asset/[assetId]        the published site
├── assets · assets/[id] · assets/[id]/content
├── storage/uploads/sign · storage/uploads/complete
├── ai/generate · ai/vision-site
├── image/generate
├── video/jobs · jobs/[id] · [id]/cancel · [id]/content · [id]/store · from-asset
├── billing/
│   ├── checkout · credits · invoices · portal
│   └── webhooks/stripe · webhooks/razorpay · webhooks/cashfree
├── store/products · store/checkout
├── domains · domains/[id]
├── workspaces/invitations · invitations/accept
├── font/[name]
└── admin/                     every route calls requireAdmin() — HMAC-signed
    ├── session                admin cookie (scen_admin_session)
    ├── ai/status · ai/providers/test
    ├── image/status · image/providers/test
    ├── video/status · video/providers/test
    ├── auth-email/status · auth-email/test
    ├── billing/status · billing/credits/adjust
    ├── data/status · data/migrations/apply · data/workspace ·
    │   data/test-users · data/published-site
    └── vercel/status · vercel/projects · vercel/env · vercel/env/[id] ·
        vercel/oauth/start · oauth/callback · oauth/disconnect
```

Library layer:

```
src/lib/
├── ai/        registry + router + 4 providers: openai · anthropic · gemini · grok
├── image/     registry + router + 3 providers: openai · gemini · replicate
│              + moderation + storage
├── video/     registry + router + 4 providers: openai · gemini · grok · replicate
│              + credits · job-token · moderation + storage
├── auth/      session · password · tokens · google · account · flows
├── billing/   checkout · credits · events · webhooks + stripe/razorpay/cashfree
├── email/     send · templates · events + postmark/resend
├── data/      db · migrations · projects · versions · scenes · assets · principals
├── storage/   s3 · keys · ingest · upload-token
├── store/     orders · pricing
├── admin-auth.ts · user-auth.ts
└── vercel-api.ts · vercel-token.ts
```

Database — 25 tables. Canonical SQL lives in `src/lib/data/migrations.ts`; the
files under `migrations/` are the version-controlled operator copy.

```
core     scen_schema_migrations · workspaces · users · memberships · projects ·
         project_versions · scenes · assets · generated_jobs · review_comments ·
         audit_events
billing  billing_customers · billing_subscriptions · billing_payments ·
         billing_invoices · billing_checkout_intents · billing_webhook_events ·
         credit_wallets · credit_ledger
auth     auth_credentials · auth_sessions · auth_one_time_tokens ·
         auth_oauth_states · oauth_identities · email_deliveries

Tenant key is workspace_id, derived from the signed server session — never from the client.
```

---

## 8. Supporting files

```
prompt-library.json   119 entries — {n, cat, area, prompt}. Long, production-shaped
                      prompts (React + TS + Vite + Tailwind + Framer Motion …).
                      Read by the Prompt Library view with cache:'force-cache'.
manifests/            6 feature manifests — AI gateway · auth+email · database+storage ·
                      image gateway · payments+credits · video gateway
docs/                 DEPLOYMENT-NOTES.md · SECRET-SCAN.json
ROADMAP-VERIFIED.md   the three shipped flows, mapped to index.html
ADMIN-KEY.txt         local only, gitignored
ironclad.html         standalone template page — live at /ironclad.html, unlinked
mostar/               standalone 3-file site — live at /mostar/, unlinked
.vercelignore         the frontend project deploys only the repo root;
                      backend/, docs/, manifests/ are excluded
```

---

## 9. Findings from this pass

1. **This repo is not what is deployed.** The two differ in both directions, so
   neither is simply "older":

   | | repo (every commit + working copy) | live scen.space |
   |---|---|---|
   | `TEMPLATES` entries | 1 — Mostar | 37 |
   | "✦ AI Studio" sidebar link | present | removed |
   | Sidebar links | 80 | 79 |
   | `views.*` | 89 | 89 |
   | API & Keys badge | `LAST` | `ADMIN` |

   The 37 live templates are Velorah, Aetheris Voyage, Securify, Prisma, Max Reed,
   Celestial Renewal, TrustFlow, Innovation Lab, ADHD Planner, Blog Showcase,
   Nexto 404, No-Code Waitlist, Build With Us, Rocket Pricing, Orbis Hello, Glow
   Features, Mind-Body Healing, AI Image Generator, CodeNest, Radial, Mostar,
   Ironclad, Verge, Terrace, Cadence, Signal, Atelier, Ledger, Kanso, Observatory,
   Forma, Monolith, Horizon, Power, Eclipse, Paloma, Vertex. `ROADMAP-VERIFIED.md`
   says historical snapshots were stripped "so they are not exposed by a public
   deploy", which fits a packaged copy rather than the live source.
   **`.vercel/project.json` still points at the `scen-space` project, so deploying
   from here would cut the gallery from 37 cards to 1 and re-add the AI Studio link.**
   Worth resolving before the next deploy.
2. **The uncommitted `index.html` change** (26 insertions, 162 deletions) renames
   the nav link *Templates → Preset AI*, retitles the section, and removes the 11
   industry "agent start" cards so only previewable presets remain.
3. **Docs is not public.** The nav's Docs link, the footer's Help & Docs, and the
   hero's "Explore scene library" all point at gated routes, so a first-time
   visitor gets the sign-up screen instead of the thing they clicked.
4. **Seven control-plane views are not staff-gated.** aigateway, imagegateway,
   videogateway, dbstorage, billingops, vercelconnector and authemail are missing
   from `__ADMIN_ROUTES`, so any signed-in user can open them; authemail also
   injects a visible sidebar link. The server side is gated independently —
   every `/api/admin/*` route calls `requireAdmin()` — so this is a UI exposure,
   not a credential one.
5. **AI Studio is half-removed in the repo.** `agent-entry-runtime` claims *"its
   view, its generators and every button that opened it were removed"*, but in the
   repo `views.studio` is still defined, the "✦ AI Studio" sidebar link is still
   in the markup, and five buttons still carry `data-nav="studio"` — Media
   Library's "Generate asset" and its empty state, the scene picker's "Open AI
   Studio", and the project media panel. Because `navigate('studio')` is patched
   to `location.href = /agent-studio.html`, every one of those buttons now leaves
   the app instead of opening the image/video generator. The image and video
   generation code behind them (`studioGenerate`, `videoGenerate`, `pollVideoJob`,
   hero image/video assignment) is still in the file and now unreachable.
   Live has already dropped the sidebar link; the buttons remain.
6. **A stale banner in `agent-studio.html`.** The comment at the top of the script
   still reads *"Nothing here talks to a server. Everything runs in the page."*
   That stopped being true at commit `908d6a9`; the studio now uses 13 real
   endpoints. Only the fallback planner and writer are local.
7. **Two orphan pages are publicly reachable**: `/ironclad.html` and `/mostar/`
   are served straight off the filesystem (Vercel checks files before rewrites)
   and are linked from nowhere in the product.

---

## 10. The simplified information architecture (2026-08-17)

Four layers were appended to the end of `index.html`, plus one new backend
route. Nothing was deleted: all 89 original views still exist and every legacy
route still resolves, so old links and bookmarks keep working.

```
<style id="scen-simple-ia-css">  + <script id="scen-simple-ia">      shell, sidebar, Home, Projects, Pages, Advanced Tools, Help, mobile
<style id="scen-connections-css"> + <script id="scen-connections">    Connections, orchestrator, AI Builder, Business, Publish
                                   <script id="scen-settings-ia">     Settings tab strip, Media → 3D
                                   <script id="scen-marketing-ia">    public-page dead-ends
```

New backend route: `GET /api/capabilities` (`requireUser`, booleans only).

### 10.1 Sidebar

80 links in 11 groups → **12 links in 3 groups**, with an Advanced toggle that
restores the full technical set as 4 extra groups.

```
Main              Home · Projects
Current project   AI Builder · Pages · Media · Business · Connections · Publish
(footer)          Settings · Help · Advanced Tools → · Credits · Profile
```

### 10.2 New views (7)

`aibuilder` `pages` `business` `connections` `publish` `help` `advanced`
— total `views.*` is now **96**.

### 10.3 Where the old routes went

The mapping lives in code as `ROUTES` inside `scen-simple-ia`, which is what
renders the Advanced Tools index — so the document and the UI cannot drift.
41 technical routes across Build · Design · Developer · Operations.

### 10.4 Capability states

`GET /api/capabilities` returns one of `connected · setup_required ·
not_connected · error · unavailable` per capability. The UI adds `checking`
and `unknown` (the read failed) and never collapses `unknown` into
"not connected" — a status a customer sees always comes from the server.

Only **Domain** is genuinely self-serve. AI, Data, Login, Storage, Payments and
Email are server-side environment configuration held by the operator, so their
cards say so instead of offering a Connect button that cannot work. Analytics,
CRM, GitHub and Webhooks have no backend adapter at all and report
`unavailable`.

### 10.5 Staff gating closed

`__ADMIN_ROUTES` grew from 15 to 22: `aigateway · imagegateway · videogateway ·
dbstorage · billingops · vercelconnector · authemail` are now blocked in
`navigate()` as well as hidden, closing finding #4 above. Their `/api/admin/*`
calls were already refused by `requireAdmin()`, so no customer loses working
functionality.

### 10.6 Correction to finding #5

Finding #5 above states that `navigate('studio')` is patched to
`location.href = /agent-studio.html`. **That is wrong.** Only the `/agent`
*path* redirects (`index.html:8`). `navigate('studio')` renders `views.studio`
in-app, so Media Library's "Generate asset" button and the other four
`data-nav="studio"` buttons still open the real image/video generator. Verified
in the browser: `navigate('studio')` leaves `location.href` unchanged and
renders the "AI Studio" view.
