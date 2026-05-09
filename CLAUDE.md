# CLAUDE.md - Validation Layout Tool

## Project Overview
Pharmaceutical equipment validation point layout diagram tool. Replaces CAD for creating isometric temperature probe placement diagrams.

## Tech Stack
- React 18 + TypeScript + Vite
- tldraw v2 (canvas engine with custom shapes)
- Zustand (business state)
- Tailwind CSS
- Electron 28

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run electron:dev` - Start Electron dev mode
- `npm test` - Run tests

## Architecture
- `src/shapes/` - tldraw custom shapes (Chamber, ProbePoint, Annotation, Dimension, Legend)
- `src/tools/` - tldraw custom tools (ProbePointTool, DimensionTool)
- `src/core/` - Pure TS logic (projection, placement, geometry)
- `src/components/` - React UI (toolbar, panels, dialogs)
- `src/store/` - Zustand business state
- `src/templates/` - Built-in equipment templates
