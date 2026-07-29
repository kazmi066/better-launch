# BetterLaunch motion roadmap

## Product direction

BetterLaunch is a specialized motion-design engine for premium product and
feature launch films. It is not intended to become a general-purpose browser
video editor, screen recorder, collaboration suite, or layer-heavy replacement
for Premiere, After Effects, or CapCut.

The product wins by making a narrow set of launch-film decisions exceptionally
well:

1. Choreographed text and logo animation.
2. Cinematic scene transitions.
3. High-quality procedural and branded backgrounds.
4. Consistent, full-resolution export.

The editing surface should remain scene-based and opinionated. New controls
should expose meaningful art direction—not generic editing complexity.

## Non-negotiable export contract

Every motion feature must satisfy these requirements before shipping:

- Preview and MP4 export use the same timestamp-driven renderer.
- Rendering is deterministic: the same project, timestamp, and seed produce the
  same frame.
- Effects are computed at the selected output resolution, including 4K.
- Existing projects keep their current visual output unless an effect is
  explicitly enabled.
- No effect silently reduces canvas resolution, image sampling quality,
  framerate, codec bitrate, or audio quality.
- Expensive effects must have a measurable render-performance budget and a
  graceful quality-preserving fallback.

## Batch 1 — Transition engine

Status: first release complete.

- Full-resolution dual-scene compositor shared by preview and export.
- Incoming-scene transition model that does not alter project duration.
- Cut, dissolve, push, wipe, iris reveal, and zoom-through.
- Adjustable transition duration.
- High-quality canvas resampling for all spatial transitions.
- Independent video elements per scene so two clips from the same source can
  transition without frame conflicts.
- Verified with repeated timeline playback across scene boundaries and a real
  1920×1080, 30 fps WebCodecs MP4 render.

Next transition work:

- Direction controls for push and wipe.
- Custom cubic-bezier motion curves.
- Transition presets tuned for calm, energetic, premium, and technical launches.
- Mask-based reveals using product shapes or an uploaded logo.
- Motion-blur and light-leak passes with 4K performance checks.
- Shared-element transitions for device frames, cards, and product screenshots.

## Batch 2 — Procedural background system

Status: first release complete.

- Deterministic animated Gradient Mesh, Aurora, and Technical Grid backgrounds.
- Shared sky-blue and violet palette controls with an art-directed navy base.
- Motion energy, field scale, flow direction, and deterministic variation.
- Full-resolution deterministic dithering to reduce gradient banding in H.264.
- Verified across timeline playback, a dissolve between two procedural
  backgrounds, and a 1920×1080, 30 fps WebCodecs MP4 render.

Next background work:

- Soft bloom, radial field, chromatic haze, and spotlight backgrounds.
- Blueprint, scanline, dot field, and contour-map backgrounds.
- Particle and orbital systems designed for product reveals rather than generic
  visualizers.
- Brand palette mapping so every background can inherit two to four approved
  colors.
- Palette morphing between consecutive procedural backgrounds.

## Batch 3 — Animation choreography

- Animation families that coordinate heading, subheading, media, and logo as
  one scene rather than as isolated effects.
- Premium kinetic-type systems: line masks, tracking expansion, word swaps,
  counter reveals, typographic tunnels, and perspective titles.
- Staged feature reveals for screenshots, metrics, cards, and comparison states.
- Entrance, emphasis, hold, and exit phases with sensible launch-film timing.
- Motion-character presets such as precise, soft, bold, editorial, and kinetic.
- Beat-aware timing markers without turning the product into a traditional
  audio/video timeline editor.

## Batch 4 — Signature launch-film effects

- Product silhouette and logo-driven reveals.
- Refractive glass, soft prism, depth glow, and controlled chromatic splitting.
- Faux-3D parallax for screenshots and product surfaces.
- Seamless background-to-background palette morphing across scenes.
- Focus pulls, depth masks, and camera moves tuned for interface launches.
- A small curated library of signature BetterLaunch sequences that can be
  recolored and reworded without becoming generic templates.

## Batch 5 — Export fidelity

- Golden-frame tests comparing preview and export at transition boundaries.
- 1080p, 4K, 24/30/60 fps render matrix.
- Configurable high-quality bitrate presets while keeping the current
  20 Mbps mode unchanged.
- Gradient banding tests and optional deterministic dither.
- Frame-accurate video seeking and keyframe cadence validation.
- Memory and render-time budgets for every effect at 4K.
- Export diagnostics that identify the exact effect or asset causing a failure.

## Recommended build order

1. Complete and validate the transition engine.
2. Add deterministic gradient-mesh and technical-grid backgrounds.
3. Add palette morphing between scenes.
4. Build coordinated animation families.
5. Add signature mask, depth, glass, and parallax effects.
6. Expand export-fidelity testing alongside every batch.

## Features intentionally out of scope

- General browser video editing.
- Screen recording and cursor editing.
- Multi-track footage editing.
- Generic social-video templates.
- Long-form editing workflows.
- Collaboration and approval tooling as a primary product direction.
- AI-generated footage as a substitute for designed motion.
