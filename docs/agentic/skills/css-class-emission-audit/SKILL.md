---
name: css-class-emission-audit
description: "Prove that CSS utility classes actually emit rules instead of silently compiling to nothing, and that a design token used as a text colour is actually readable. Use when styling a component and the result 'looks unchanged', when a Tailwind class with an opacity modifier or a CSS-variable design token seems to have no effect, when a colour/background/border does not appear but there is no build error, when auditing a design-token system, or before trusting that a class in source is a class in the stylesheet. Also use before using a brand/accent token as a *text* colour (a token that works as a fill often fails as text), to verify a themed band/background renders, and to check a dark-mode token pair for contrast."
version: 1.1.0
x-origin: workbuddy-ai/skills
x-migrated: 2026-10-08
---

# CSS Class Emission Audit

A class in source is **not** a rule in the stylesheet. Tailwind (and other utility generators)
drop classes that cannot be resolved, and they do it **silently**: no build error, no warning,
no entry in the output. The element keeps `transparent` or its inherited value, the layout still
works, and every gate stays green.

**Core rule: only the emitted stylesheet is evidence. Source text is a claim.**

The failure mode is nasty because it is invisible to every other check. `tsc`, the test suite,
a screenshot, and a code review all pass. Measured on a real storefront: a sticky header shipped
with `bg-card/95`, and `getComputedStyle(nav).backgroundColor` was `rgba(0, 0, 0, 0)` — **no
background at all**. It looked plausible in a screenshot because the page behind it was a similar
colour.

> Applies directly to this repo — see [`../../traps/register.md`](../../traps/register.md#t49) (T49),
> and `app/globals.css` for the `.surface-accent` / `.surface-accent-soft` workaround.

## 1. The high-value trap: opacity modifiers on CSS-variable tokens

This is the one that bites hardest, because it is the *idiomatic* thing to write.

```js
// tailwind.config.js
colors: { brand: { accent: 'var(--brand-accent)' } }
```

```html
<div class="bg-brand-accent/20">   <!-- emits NOTHING -->
<div class="bg-brand-accent">      <!-- emits correctly -->
```

Tailwind cannot apply an alpha channel to a value it cannot parse into channels. A bare
`var(--x)` has no `<alpha-value>` placeholder, so the `/20` variant produces **no rule at all**.
`bg-brand-bg-card/95` and `border-brand-border/60` fail identically. Any `<utility>-<token>/<n>`
is suspect.

## 2. Prove it by compiling — do not reason about it

Compile the real config against a probe document and inspect the output. This takes seconds and
is the only reliable answer.

```bash
# 1. A probe listing the classes you care about
cat > /tmp/probe.html <<'EOF'
<div class="bg-brand-accent bg-brand-accent/15 bg-brand-accent/30 bg-brand-bg-card/95 border-brand-border/60"></div>
EOF

# 2. Compile with the PROJECT'S OWN config, overriding only `content`
cat > /tmp/tw.probe.js <<'EOF'
const base = require('/abs/path/to/tailwind.config.js');
module.exports = {
  ...base,
  content: [{ raw: require('fs').readFileSync('/tmp/probe.html', 'utf8'), extension: 'html' }]
};
EOF

./node_modules/.bin/tailwindcss -c /tmp/tw.probe.js -i /tmp/in.css -o /tmp/out.css
cat /tmp/out.css        # only the classes that ACTUALLY emitted appear
```

`in.css` is just `@tailwind utilities;`. **Read the output, do not read the config** — the config
is where the intent lives; the output is where the truth lives.

> ⚠️ Always load the project's real config and override only `content`. A hand-written config
> reproduces Tailwind's rules, not the project's, and will happily emit a class the project's
> tokens never define.

## 3. The workarounds, in order of preference

**`color-mix` in a component class** — reads the live token, so it stays theme-aware when the
palette changes:

```css
@layer components {
  .surface-accent-soft {
    background-color: color-mix(in srgb, var(--brand-accent) 20%, var(--brand-bg-card));
  }
}
```

**A plain `opacity-*` utility** when you only need visual hierarchy *inside* an already-coloured
band. `opacity-70` sets the `opacity` property and works fine — it is the *colour-opacity
modifier* that does not.

**An arbitrary value** — `bg-[color-mix(in_srgb,var(--brand-accent)_16%,transparent)]` — when you
need a one-off and do not want a new component class.

**Give the token an `<alpha-value>` channel** (`--brand-accent: 34 211 238` plus
`rgb(var(--brand-accent) / <alpha-value>)`) if you want the modifier syntax everywhere. This is a
token-format migration: it touches every consumer, so decide it deliberately.

## 4. Verify in the browser, not by eye

Once it renders, confirm numerically. A screenshot cannot distinguish a pale band from a
transparent element over a pale page.

```js
const probe = await page.evaluate(() => {
  const el = document.querySelector('nav');
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, border: cs.borderBottomWidth + ' ' + cs.borderBottomColor };
});
// bg === 'rgba(0, 0, 0, 0)'  ->  the class emitted nothing
```

`rgba(0, 0, 0, 0)` is the tell. A `color-mix` result prints as `color(srgb …)`.

## 5. The mirror trap: a token that works as a *fill* fails as *text*

A class can emit perfectly and still be unreadable. **Measure the contrast of every
(token, surface) pair before using a token as a text colour** — never assume that because a
token looks right as a fill it works as a foreground.

The direction that fails is always the same: **a light or bright token as text on a light
surface.** The very same token on an ink fill is usually fine.

Measured on this repo, `--brand-accent: #22d3ee`:

| Foreground | Surface | Ratio | Verdict |
| :-- | :-- | --: | :-- |
| `#22d3ee` | header band `#c4e9f1` | **1.4:1** | unusable |
| accent darkened 70% into the ink token → `#1e9db4` | header band | **2.5:1** | still fails AA (4.5:1) |
| `#22d3ee` | footer canvas `#c2c9d1` | **1.1:1** | unusable |
| `#22d3ee` | ink fill `#16202b` | **9.1:1** | fine |

Two lessons that generalise:

- **Darkening the token is not a fix.** Even a heavily darkened accent reached only 2.5:1. A 12px
  label on a light band cannot carry that colour family as text *at all*. Change the mechanism
  (table below) rather than the shade.
- **Keep the accent for fills, borders and indicators** — a pill background, a 2px underline, a
  swatch ring. There the requirement is 3:1 for non-text, or the token *is* the background and the
  ink is the text.

Replacements that keep the accent visible without using it as text:

| Instead of | Use |
| :-- | :-- |
| `hover:text-accent` on a wordmark | an **ink** underline — `group-hover:underline decoration-2` (`text-decoration-color` defaults to `currentColor`) |
| `text-accent` for an active nav item | an **accent** border/underline + an ink label |
| `text-accent` to single out one link | the same treatment as its neighbours; let **position** distinguish it |
| accent text on a light band | accent **fill** + the paired `*-fg` ink token as the text |

> ⚠️ An **accent** underline on a light band is just as invisible as accent text — same 1.1–1.4:1.
> The underline only works when its colour is the ink token.

Compute the ratio; do not estimate it. For a `color-mix()` surface, resolve the mix to a solid
colour first, then measure the pair:

```python
def lin(c):  # c in 0..1
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def lum(h):
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)

def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

# color-mix(in srgb, #22d3ee 20%, #edeff2) resolves to #c4e9f1 per channel, then:
print(round(ratio('#22d3ee', '#c4e9f1'), 2))   # 1.4  -> unusable as text
```

**Sweep, then fix — and check the background before "fixing" each hit.** `grep` the tree for
`text-<token>` rather than repairing the one site you noticed; a token misused as text is usually
misused in more than one place. In the session this was learned, the sweep found exactly **two**
bad sites (both wordmark hovers) and **one that was correct** — accent text on an ink fill at
9.1:1, which had to be deliberately left alone.

## 6. Check the dark-mode half of every token pair

A background token and its paired foreground token are usually defined per theme. Verify the pair
is **reachable** before trusting it:

- Does anything actually apply the `.dark` class? If there is no theme toggle and no
  `ThemeProvider`, the dark block is dead code — and a bad dark-mode pair is a latent bug, not a
  live one. Say which it is. **In this repo `.dark` is never applied** — there is no toggle and no
  provider, so the dark half of every pair is unreachable today.
- A light `*-fg` token (e.g. `#eef2f6`) on a bright accent fill is roughly 1.9:1 — unreadable.
  Paired foreground tokens are worth one contrast check even when the theme is unreachable today.

## 7. Guard it, or write the trap down

The durable fix is a guard that scans source for the failing shape and fails:

```js
// fails on any `-brand-<name>/<n>` class
const OFFENDER = /\b(?:bg|text|border|ring|fill|stroke|from|to|via)-brand-[a-z-]+\/\d+/g;
```

Scope it to the directories that hold components, and give it a positive control — assert the
regex matches a known-bad string — so a typo cannot make it vacuous. If you cannot add the guard
in the same change, register the trap with the guard named as the follow-up, and mark it
`MITIGATED`, not `RESOLVED`: the root cause is the generator's behaviour, which you have not
changed.

## Pitfalls

- **A visual diff is not evidence.** The whole point of this failure class is that it looks
  plausible. Compile, or read `getComputedStyle`.
- **`vitest`, `tsc` and CI cannot see this.** Nothing about it is a type or test error.
- **The class that breaks is often the idiomatic one.** `/95` on a card background reads as good
  practice; it is the exact shape that fails.
- **Do not "fix" it by bumping the opacity.** `bg-brand-accent/15` → `/30` changes nothing; both
  emit zero rules.
- **Check the token's *shape*, not its name.** Any value that is not a parseable colour — a bare
  `var()`, a gradient — has the same problem.
- **One instance found means there are others.** Grep the whole tree for the shape before
  declaring it fixed; the first sighting is rarely the only one.
- **Emitting is not the same as readable.** §1–4 and §5 are independent checks. A class that
  compiles correctly says nothing about whether anyone can read it, and vice versa. Run both.
- **A colour that is "on brand" is not automatically a text colour.** Design tokens are usually
  chosen for large fills; the same value as a 12px label is a different problem.
