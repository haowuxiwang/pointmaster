# CLAUDE.md - Validation Layout Tool

## Project Overview
Pharmaceutical equipment validation point layout diagram tool. Replaces CAD for creating isometric temperature probe placement diagrams.

## Tech Stack
- React 19 + TypeScript + Vite
- tldraw v5 (canvas engine with custom shapes)
- Zustand (business state)
- Tailwind CSS
- Electron 42

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run electron:dev` - Start Electron dev mode
- `npm test` - Run tests

## Architecture
- `src/shapes/` - tldraw custom shapes (Chamber, ProbePoint, DrainPort, InletPort, BuiltInProbe, TextAnnotation, Dimension, Legend)
- `src/tools/` - tldraw custom tools (ProbePointTool, DrainPortTool, InletPortTool, BuiltInProbeTool, DimensionTool)
- `src/core/` - Pure TS logic (projection, placement, export)
  - `core/projection/` - Isometric 3D to 2D projection
  - `core/placement/` - Point placement algorithms (uniform, keypoints, grid)
  - `core/export/` - PNG and SVG export
- `src/components/` - React UI (toolbar, panels, dialogs)
- `src/store/` - Zustand business state (projectStore)
- `src/templates/` - Built-in equipment templates (9 templates)
- `src/utils/` - Utilities (description generator, file I/O)

## Key Patterns

### tldraw Custom Shapes
- Each shape extends `ShapeUtil<ShapeType>` with static `type` and `props`
- `getGeometry()` returns hit-test geometry (keep tight to visual content, NOT inflated)
- `canEdit()` returns `true` for inline editing via `foreignObject` + `<input>`/`<textarea>`
- Use `SVGContainer` for SVG-based rendering
- `isFilled: true` blocks click-through to shapes underneath

### Placement Pipeline
1. User clicks "执行布点" in AutoPlacePanel
2. `autoPlace()` collects fixed shapes (drain-port, inlet-port, built-in-probe) from canvas
3. `uniformPlacement()` generates points: vent ports + fixed points + corner/center + uniform grid
4. All points are re-labeled as T1, T2, T3... (unified naming)
5. Probe shapes created on canvas, description text-annotation placed below chamber
6. Description uses semantic positions (上/中/下层, 左/中/右) and notes proximity to special features

### Point Types (in ProbePointData.properties.type)
- `vent-port` - Exhaust port cold points (from chamber.ventPorts)
- `drain-port` - Drain port (from canvas shape)
- `inlet-port` - Inlet port (from canvas shape)
- `built-in-probe` - Equipment built-in probe (from canvas shape)
- `corner` - Corner points (K1-K8 in algorithm, re-labeled T1-Tn)
- `center` - Center point (K9 in algorithm, re-labeled T1-Tn)
- `{}` - Uniform grid points

### Coordinate System
- Chamber coordinates: 3D (x, y, z) in mm
- Canvas coordinates: 2D isometric projection via `project3Dto2D()`
- `CHAMBER_SCALE = 0.2` for rendering
- Drag sync: `EditorSync` in Canvas.tsx listens to store changes, batches via RAF

## Testing
- Vitest with jsdom environment
- Tests in `src/**/__tests__/` directories
- Mock tldraw editor in tests (setEditingShape, getCurrentPageShapes, etc.)
