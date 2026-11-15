# V01 performance baseline

Measured from the V01 production build and the local Vite browser check on 2026-11-15.

## Renderer

| Metric | Measurement |
| --- | ---: |
| Triangles (`renderer.info.render.triangles`) | 2,828 |
| Draw calls (`renderer.info.render.calls`) | 31 |
| Triangle budget | Pass: below 150,000 |
| Draw-call budget | Pass: below 100 |

The dev-only renderer probe records the values after the first rendered frame. The
scene was interacted with using pan and zoom before the values were recorded.

## Rendering behavior

- `Canvas` uses `frameloop="demand"`.
- After the initial frame, renderer metrics remained unchanged for a one-second
  idle observation, so no additional demand frames were observed while idle.
- Normal interactive FPS: not measured in this automated check. The scene is
  demand-rendered and does not have a continuous idle FPS stream.
- Chrome 4x CPU-throttle FPS: not measured; this requires the manual DevTools
  throttle step in the spec.

## Build output

`npm run build` passed. The generated visualizer report is
`dist/stats.html`.

| Artifact | Bytes |
| --- | ---: |
| Initial JavaScript | 986,506 |
| Initial CSS | 866 |
| Data assets | 202 |
| Initial JS + assets | 987,574 |
| Initial JS + assets gzip | 273,810 |

Initial JS plus assets is below the 3 MB V01 budget.

## Follow-up measurements

1. Run Chrome DevTools Performance with CPU set to 4x slowdown and record the
   Stats FPS while panning and zooming.
2. Repeat on a low-end device if available.
