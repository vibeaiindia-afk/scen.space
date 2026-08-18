# Premium app & website builder — the studio's operating skill

Given by the client on 2026-08-18 as the standard the Scen Agent builds to.
Kept here because it is behaviour, not decoration: the parts that can be
enforced in code are enforced, and the parts that cannot are stated plainly
below so nobody assumes them.

## Enforced in the studio today

- **Intent before action.** Small talk is answered, not built from. A brief
  starts a build. A request against a built project edits it rather than
  starting again.
- **Don't interrogate.** The interview asks only what changes the result and
  fills the rest from the brief's own language; a detailed brief goes straight
  to a build.
- **No invented proof.** Customer counts, reviews, awards and partnerships are
  never fabricated. Where a section needs them, it renders a marked slot.
- **No emoji interfaces.** One icon language per build.
- **Motion with limits.** 150–400ms on interface interactions, and
  prefers-reduced-motion is honoured.
- **Responsive by construction.** Fluid type, grid/flex, no fixed widths that
  break; every build is checked at phone, tablet and desktop widths.
- **Semantic HTML, labelled controls, visible focus, alt text, contrast.**
- **Titles, descriptions and Open Graph tags on every page.**
- **Copy that sounds human.** The banned-phrase list is in the gateway's
  system prompt and in the local writer.

## Not true today — do not claim it

- The studio writes **HTML, CSS and vanilla JS**, plus React Native screens for
  the app kind. It does not emit React, Next.js, TypeScript or Tailwind.
- There is **no application backend in a generated build**: auth, databases,
  payments and file storage are Scen's own modules, connected from the
  Publishing and Connections panels, not written into the site.
- Dashboards, admin areas and multi-step application flows are not generated.
- Images are CSS/SVG placeholders unless a real image is supplied.

---

## The master system prompt (§1–§43), as it stands in the build

Added 2026-08-19, after the client supplied §1–§24 (agent and design standard)
and §25–§43 (image standard). Split the same way as the rest of this file:
what the build actually does, and what it does not do yet. Nothing below is
aspiration — if it is in the first list, it is in the code.

### Enforced today

- **§2 no interrogation.** The interview is gone. One prompt is the brief; the
  agent decides the rest and says so in a sentence.
- **§3 §4 direction before code.** A build asks the model to art-direct this
  one site — palette, surface, ink, accent, type, radius, density, hero shape,
  photographic direction — before a word is written, and the answer is written
  into the brief the generator reads.
- **§5 §6 premium is not effects.** The direction prompt names what premium
  means and lists the generic-AI patterns to avoid. The generator no longer
  produces the pattern it was named for: three equal cards became alternating
  feature rows, and every section no longer shares one width and one rhythm.
- **§7 hero.** The hero is a claim in display type with the brand small above
  it, one line, one real button and a text link, and a single visual the width
  of the page. The model chooses the hero shape (editorial, split, full,
  statement, product) and the alignment.
- **§8 typography.** Two families at most, chosen per build, with a real scale
  between eyebrow, display, section head, body and label.
- **§9 rhythm.** Hero → statement → alternating features → the rest, with the
  statement section only when there is a sentence worth 80px.
- **§19 progress.** The build says "Creating the visual direction", "Writing
  the words", "Checking mobile and contrast" — not "Writing brief.json".
- **§20 suggestions.** The four chips after a build come from the trade: an
  academy is offered student work and admissions; a restaurant is offered
  signature dishes and reservations.
- **§23 never claim it is done.** Every provider attempt is recorded and shown;
  a fallback says so on the build row and in the AI pane.
- **§26 §27 §28 §30 §31 §36 image plan.** Images are planned as one campaign:
  a direction for the whole set, a subject and ratio per slot, negative space
  put where the headline will sit, per-trade art direction with an explicit
  avoid list, and no text, logos or UI in any frame.
- **§32 no baked-in text.** Stated in every image prompt.
- **§41 fallback.** A failed image run leaves the placeholders and says what
  happened; it never blocks the build.

### Not true today — do not claim it

- **§16 §17 §18 §38 §42 visual QA loop.** Nothing screenshots the result and
  scores it, and nothing regenerates a weak image. The build ends when the
  files are written.
- **§12 responsive by design.** There are real mobile rules, but the mobile
  layout is the desktop one restructured by CSS, not designed separately.
- **§29 mobile crops.** One ratio per slot; no 9:16 variant is generated.
- **§33 §34 logos and uploaded images.** An uploaded reference is read for its
  colour only. Nothing crops, extends, recolours or removes a background, and
  no logo workflow exists.
- **§39 image performance.** Generated images are inserted at one size, with
  no srcset and no lazy-loading below the fold.
- **§14 §15 existing-project edits.** Edits are applied to the brief and the
  site is regenerated; there is no file-level patching of an existing build.
