# Visual Style (v3)

## Look
"Candy Moon": a toy diorama on a floating lunar slab. Bright, saturated, rounded, chunky, friendly. Reference feel: Clash of Clans (readable isometric base, juicy buildings) and Boomerang Fu (flat-shaded low-poly, bold colors, simple shapes). Not realistic, not dark.

## Camera
Orthographic, isometric-like (yaw 45 deg, pitch ~35 deg), fixed angle. Pan by drag with bounds, pinch/scroll zoom between 2 limits, double-tap to recenter. Level of detail never changes the look.

## Palette (CSS variables / three constants)
| Token | Hex | Use |
|---|---|---|
| space | #1B1646 | background, with a few soft stars |
| moon | #B9B4D6 | ground; craters rim #D8D3F0, shade #8A84B3 |
| sun-rim | #FFB86B | warm rim light on ridges |
| power | #FFC93C | power meter, solar, sparks |
| air | #4DE1D2 | air meter, bubbles |
| shield | #8E7CFF | shield meter, walls |
| good | #5BD98A | success, plants |
| danger | #FF5D73 | warnings, storms |
| ink | #2A2358 | outlines, text on light |
| paper | #FFFFFF @ 92% | UI panels |
Crew suit colors: Leo orange #FF8A3D, Amir teal #29C7C0, Nia green #6BD66B, Daniel yellow #FFD23F. MILO: white-blue body, big glowing eyes.

## Models (all procedural primitives first; CC0 glTF later)
- Flat shading (`flatShading: true` or toon material with 3 steps), vertex colors, no textures. Rounded bevel-like look via chunky boxes/cylinders + spheres.
- Habitat: fat dome + door + 2 little windows. Solar Panel: tilted blue tile on a short mast with a yellow spark. Battery: green cylinder pack with level bars. Air Maker: cyan tank with a bubble vent. Radiation Wall: stacked purple-gray regolith blocks. Greenhouse: glass dome with green sprouts. Rover: chunky 4-wheel cart with orange scoop.
- Astronauts: chibi (big helmet head, small body), 4 suit colors, idle bobbing; MILO floats with a gentle sine.
- Poly budgets: building <= 1500 tris, character <= 3000, all rocks/craters instanced.
- Ground: one slab (rounded square) + instanced craters and rocks; day/night = light color and intensity shift (sun-rim warm vs cool blue night with stars), not extra geometry.
- Shadows: cached blob decals under objects; long soft sun shadows faked with a stretched blob toward the sun direction.

## UI
Rounded panels (radius 16-24), 3 px ink outline, soft drop shadow, big icons, bold rounded font (Fredoka for UI, Nunito for body; both OFL; bundle locally). Buttons >= 48 px; GO button is the biggest thing on screen. Meters are pill bars with icon + animated fill + tiny arrow for last change. Cards pop with a bouncy ease. Icons: simple filled glyph set (one style only, from a CC0/MIT pack or hand-made SVG).
Speech bubbles: small, tailed, color-coded to the speaker, max 12 words.

## Motion and juice
Build: squash-and-pop + dust puff. Resource change: floating +/- icon numbers. Low meter: gentle pulse (not flashing: no flicker > 3 Hz). Storm: sky tint + soft shake + purple sparkles on shield. Star reward: confetti burst. All motion off or reduced when `prefers-reduced-motion`.

## Audio
One calm looping track, 8-10 short SFX (tap, build, switch, warning, storm, success, star). Mute toggle remembered. No voice acting; "Read to me" uses the browser voice.
