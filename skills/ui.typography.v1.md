# Skill: UI Typography Consistency

## When to Use

- Global typography tuning
- New page or component design
- Sidebar, form, dialog, and dashboard cleanup
- UI refresh work that should feel closer to ChatGPT Web reading density

## Defaults

- Base body and message text: `16px` with `line-height: 1.5`
- Sidebar, helper text, and secondary descriptions: `14px`
- Metadata, timestamps, and micro labels: `12px` to `13px`
- Primary page headings: `24px` to `28px`
- Text color: use deep gray such as `#0d0d0d`, not pure black
- Font stack: default to the project sans font and keep it consistent across all pages

## Steps

1. Start from the global tokens in [`/Users/shenlan/workspaces/cloud-neutral-toolkit/console.svc.plus/src/app/globals.css`](/Users/shenlan/workspaces/cloud-neutral-toolkit/console.svc.plus/src/app/globals.css).
2. Keep body copy at `16px` unless the surface is explicitly metadata-heavy.
3. Use `14px` for sidebars, helper text, chip labels, and supporting descriptions.
4. Reserve `12px` to `13px` for timestamps, disclaimers, and low-emphasis metadata.
5. Tighten layout density together with typography: if text gets smaller, reduce padding and corner radius proportionally.
6. Verify at least one dense workspace page and one marketing or document page after the change.

## Do

- Do keep line height readable at `1.5` for paragraphs, lists, inputs, and buttons.
- Do make typography decisions in the global design tokens first.
- Do keep container radius and spacing visually consistent with the text scale.
- Do prefer neutral grays for body text and muted text over saturated colors.

## Do Not

- Do not mix multiple body font sizes on the same page without a clear hierarchy.
- Do not use oversized rounded corners on dense workflow surfaces.
- Do not rely on one-off component overrides when the issue is global.
- Do not use pure black text for normal reading surfaces.
