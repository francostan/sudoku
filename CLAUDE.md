# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 Sudoku game application built with React 19, TypeScript, and Tailwind CSS. The app features a fully functional Sudoku game with multiple difficulty levels, move tracking, timer, and a polished UI using shadcn/ui components.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

## Architecture

### Core Game Logic (`lib/sudoku-utils.ts`)

The Sudoku game logic is centralized in `lib/sudoku-utils.ts`:
- **generateSudoku(difficulty)**: Generates a new puzzle by creating a complete board and removing cells based on difficulty (easy: 35, medium: 45, hard: 55 cells removed)
- **isValidMove(board, row, col, num)**: Validates if a number placement follows Sudoku rules
- **isSolved(board)**: Checks if the puzzle is completely and correctly solved
- Uses backtracking algorithm with randomization for board generation

### Main Game Component (`components/sudoku-game.tsx`)

Single-file game component managing all game state:
- **Board state**: 9x9 grid of Cell objects (`{ value: number, isFixed: boolean, isError: boolean }`)
- **Timer**: Starts on first move, pauses when complete
- **Move history**: Tracks all moves with position (e.g., "A1") and timestamp
- **Keyboard controls**: Arrow keys for navigation, 1-9 for input, Delete/Backspace to clear
- **Cell highlighting**: Shows selected cell, row, column, and 3x3 box
- **Coordinate system**: Column labels A-I, row labels 1-9

### UI Structure

Three-column layout (desktop):
1. **Left sidebar**: Difficulty selector and restart button
2. **Center**: Game title, timer, board, number pad, and completion message
3. **Right sidebar**: Move log showing position → value for each move

Mobile layout collapses sidebars into main column.

### Styling

- **Tailwind CSS 4.x** with CSS variables for theming
- **shadcn/ui components** in `components/ui/` (New York style)
- Custom animations: `animate-shake` for errors, `animate-scale-in` for filled cells
- Responsive grid with thick borders every 3 cells for 3x3 boxes
- Path alias `@/*` maps to project root

### State Management

All state managed locally in `components/sudoku-game.tsx` with React hooks:
- Board state, selected cell, difficulty, timer, move history
- No global state management library used

### Type System

TypeScript strict mode enabled. Key types:
- `Cell`: `{ value: number, isFixed: boolean, isError: boolean }`
- `Difficulty`: `"easy" | "medium" | "hard"`
- `Move`: `{ position: string, value: number, timestamp: number }`

## Project Structure

```
app/
  layout.tsx        - Root layout with fonts and analytics
  page.tsx          - Home page rendering SudokuGame
  globals.css       - Global styles and Tailwind imports
components/
  sudoku-game.tsx   - Main game component (480 lines)
  theme-provider.tsx
  ui/               - shadcn/ui components (57 components)
lib/
  sudoku-utils.ts   - Game logic and algorithms
  utils.ts          - cn() utility for className merging
hooks/
  use-mobile.ts     - Mobile detection hook
  use-toast.ts      - Toast notification hook
```

## Design System & Visual Language

### Color Philosophy

**OKLCH Color Space** - Modern, perceptually uniform color system with precise control:
- Near-achromatic palette with subtle warm undertone (~75° hue)
- Very low chroma (0.006-0.012) creates sophisticated, neutral base
- High lightness (0.965 background) for airy, spacious feel
- Strong contrast with near-black foreground (0.12 lightness)
- Extensive use of opacity modifiers (`/60`, `/80`, `/90`) for layering
- Dark mode fully supported with inverted lightness values

**Color defined in `app/globals.css` as CSS variables** - modify these to change the entire theme

### Typography System

- **Primary**: Comfortaa (Google Font) - Rounded, friendly geometric sans-serif creating playful yet refined personality
- **Monospace**: Geist Mono - For timer, move log, coordinate labels; creates precision and technical feel
- **Serif**: Bree Serif - Available but sparingly used

**Type Scale & Patterns**:
- Massive hero title: `text-6xl md:text-7xl` with `tracking-tighter`
- Large numeric displays: `text-4xl md:text-5xl` with `font-light` and `tabular-nums`
- Micro labels: `text-[10px]` with extreme letter-spacing `tracking-[0.3em]` in `uppercase`
- Body text: `text-sm` to `text-xl` with `tracking-wide` or `tracking-[0.2em]`
- Weight hierarchy: `font-light` (timer) → `font-normal` (buttons) → `font-semibold` (fixed cells) → `font-bold` (title)

### Spatial System

**Generous, breathing whitespace**:
- Padding scale: `p-4`, `p-6`, `p-8` → `md:p-8`, `lg:p-12`
- Gap scale: `gap-2`, `gap-3`, `gap-8` → `gap-12`
- Responsive breakpoints at `md:` (768px) and `lg:` (1024px)

**Border Radius Philosophy**:
- Base: `0.5rem` (8px)
- Cards/containers: `rounded-2xl` (16px) - soft, approachable
- Buttons/inputs: `rounded-xl` (12px)
- Pills/icons: `rounded-full` - playful accents
- Grid container: `rounded-2xl` with structural `border-[2.5px]` for visual weight

### Elevation & Layering

**Glass morphism aesthetic**:
- `backdrop-blur-sm` on all card surfaces
- Transparency layers: `bg-card/60`, `bg-card/80`, `bg-accent/50`
- Subtle shadows: `shadow-[0_2px_16px_rgba(0,0,0,0.06)]`, `shadow-[0_4px_24px_rgba(0,0,0,0.08)]`
- Creates floating, modern feel without heavy drop shadows

**Border Strategy**:
- Structural borders: `border-[2.5px] border-foreground/90` (grid lines every 3 cells)
- Subtle dividers: `border border-border/30` (cards, between cells)
- Invisible borders become visible on hover: `hover:border-foreground/30`

### Animation & Microinteractions

**Defined in `app/globals.css`**:

1. **scale-in** (`animate-scale-in`): Bouncy overshoot animation with cubic-bezier(0.34, 1.56, 0.64, 1)
   - Used when filling cells (0.35s duration)
   - Creates delightful, playful feedback

2. **shake** (`animate-shake`): Horizontal shake for errors (0.25s)
   - Subtle -3px to +3px movement
   - Clear error feedback without being jarring

**Interaction Patterns**:
- All transitions: `transition-all duration-200 ease-out` (consistent 200ms timing)
- Hover scale-ups: `hover:scale-105`, `hover:scale-110`, `hover:scale-[1.03]`
- Active press-downs: `active:scale-95`, `active:scale-[0.97]`
- Disabled states: `disabled:opacity-20 disabled:hover:scale-100`
- State changes cascade through opacity, background, scale, and color simultaneously

**Timing Philosophy**: Fast (200ms) but not instant - feels responsive without being twitchy

### UX Patterns & Interaction Design

**Visual Feedback Hierarchy**:
1. Selected cell: `bg-accent/60` with `ring-2 ring-inset ring-foreground/20`
2. Related row/col: `bg-muted/40`
3. Related 3x3 box: `bg-muted/20`
4. Unrelated cells: `bg-card` with `hover:bg-accent/30`
5. Error state: `text-destructive animate-shake`
6. Recently filled: `animate-scale-in` bounce

**Accessibility-First**:
- Semantic `<button>` elements for all cells (not divs)
- Full keyboard navigation (arrows, numbers, delete)
- Clear focus states with ring utilities
- Disabled states clearly communicated (low opacity + cursor change)
- High contrast ratios (0.12 vs 0.965 lightness)

**Information Architecture**:
- Center-dominant layout with single focal point (the grid)
- Sidebars (desktop only) provide context without distraction
- Mobile: collapse sidebars into horizontal controls at top, vertical log at bottom
- Progressive disclosure: move log appears only as moves are made

**Coordinate System UX**:
- Column labels (A-I) at top
- Row labels (1-9) at left
- Labels scale and bold when their row/column is selected
- Creates spatial orientation without cluttering the grid

### Overall Aura & Aesthetic

**Minimalist Premium** - The design occupies the space between:
- Not corporate/sterile (Comfortaa font, rounded corners, warm undertones)
- Not childish/playful (sophisticated color choices, refined animations)
- Not stark/brutalist (generous whitespace, soft shadows, glass effects)

**Design Influences**:
- iOS/Apple design language (glass morphism, refined animations, generous spacing)
- Modern indie game UI (clean but with personality)
- Scandinavian minimalism (function-first, restrained palette, natural feel)

**Emotional Tone**:
- Calm and focused (low chroma, neutral palette)
- Confident but approachable (bold scale contrasts, friendly typography)
- Crafted and intentional (custom timing curves, precise spacing)
- Premium but accessible (polished without being exclusive)

**Key Differentiators**:
- OKLCH color space (cutting-edge, not standard RGB/HSL)
- Extreme letter-spacing on labels (0.2em-0.3em) creates luxury brand feel
- Bouncy scale-in animation (personality without gimmicks)
- Glass morphism throughout (modern, not flat or skeuomorphic)

## Key Implementation Details

- Game board uses button elements for accessibility and keyboard navigation
- Cell coordinates in state are 0-indexed (row, col), but displayed as 1-indexed with letters (A1-I9)
- Error detection is instant but doesn't prevent invalid moves (red highlighting only)
- Timer starts only after first move is made
- Fixed cells (original puzzle numbers) cannot be modified
- Move log auto-scrolls to show latest moves
- All animations use custom keyframes defined in `app/globals.css`
- Color system uses CSS custom properties - theme changes cascade automatically
