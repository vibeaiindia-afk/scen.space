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
