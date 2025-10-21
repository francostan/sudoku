# 🎯 Sudoku Game

An elegant, minimalist Sudoku game with AI-powered solving analysis.

![Sudoku Game](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

## ✨ Features

- **🎮 Three Difficulty Levels** - Easy, Medium, and Hard puzzles
- **⌨️ Full Keyboard Navigation** - Complete game control without mouse
- **⏱️ Timer & Move History** - Track your progress and solving patterns
- **🤖 AI-Powered Analysis** - Get brutal, actionable feedback on your solving strategy
- **🎨 Glass Morphism Design** - Modern OKLCH color space with backdrop blur effects
- **📱 Mobile Responsive** - Play seamlessly on any device
- **🌙 Elegant Typography** - Comfortaa + Geist Mono font pairing
- **♿ Accessible** - Semantic HTML with keyboard-first design

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to play!

## ⌨️ Keyboard Shortcuts

### Navigation
- **Arrow Keys** - Move between cells
- **G + [A-I][1-9]** - Jump to specific cell (e.g., G → A → 5 = Cell A5)

### Input
- **1-9** - Fill number in selected cell
- **Delete / Backspace** - Clear cell
- **Space** - Clear cell (alternative)

### Game Controls
- **R** - Restart current game
- **N** - New game with same difficulty

### UI
- **?** - Toggle keyboard shortcuts help
- **ESC** - Close help overlay

See [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md) for complete reference.

## 🤖 AI Analysis Feature

Click **"Analyze it"** button to receive:

1. **🔍 Pre-Analysis Research** - AI searches for advanced Sudoku techniques
2. **🗡️ Critical Assessment** - 5 brutal truths about your solving approach
3. **🎯 Master Plan** - Actionable 24h/7d/30d improvement steps with metrics
4. **🧠 Cognitive Analysis** - Deep dive into your decision-making patterns
5. **📋 Personal Cheat Sheet** - Technique queue and recognition triggers
6. **💀 Final Verdict** - One memorable line that reframes your approach

Example feedback:
> *"Cell F3 was solvable at 00:15 using hidden singles, but you found it at 01:42 - that's 87 seconds of random scanning. Drill hidden singles for 20 minutes tomorrow."*

Powered by Claude/ChatGPT with web search capabilities.

## 🎨 Design Philosophy

**Minimalist Premium** - Inspired by:
- iOS/Apple design language (glass morphism, refined animations)
- Modern indie game UI (clean but with personality)
- Scandinavian minimalism (function-first, restrained palette)

**Key Design Decisions:**
- **OKLCH Color Space** - Perceptually uniform, near-achromatic palette
- **Glass Morphism** - `backdrop-blur-sm` + transparency layers
- **Bouncy Animations** - Scale-in with overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- **Generous Whitespace** - Breathing room for focus
- **Extreme Letter-Spacing** - 0.2em-0.3em creates luxury feel

See [CLAUDE.md](./CLAUDE.md) for complete design system documentation.

## 🏗️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) with App Router
- **UI Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Components:** [shadcn/ui](https://ui.shadcn.com/) (57 components)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Analytics:** [Vercel Analytics](https://vercel.com/analytics)
- **Fonts:** [Google Fonts](https://fonts.google.com/) (Comfortaa, Geist Mono)

## 📁 Project Structure

```
sudoku-game/
├── app/
│   ├── layout.tsx        # Root layout with fonts
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles + Tailwind
├── components/
│   ├── sudoku-game.tsx   # Main game component (1290 lines)
│   ├── theme-provider.tsx
│   └── ui/               # shadcn/ui components (57)
├── lib/
│   ├── sudoku-utils.ts   # Game logic (backtracking algorithm)
│   └── utils.ts          # cn() utility
├── hooks/
│   ├── use-mobile.ts     # Mobile detection
│   └── use-toast.ts      # Toast notifications
├── public/               # Static assets
└── styles/               # Additional styles
```

## 🧠 Core Algorithm

Sudoku generation uses **backtracking with randomization**:

1. **Generate complete board** - Fill recursively with valid numbers
2. **Remove cells** - Based on difficulty (easy: 35, medium: 45, hard: 55)
3. **Validate solvability** - Ensure unique solution exists

See `lib/sudoku-utils.ts` for implementation:
- `generateSudoku(difficulty)` - Main generation function
- `isValidMove(board, row, col, num)` - Constraint validation
- `isSolved(board)` - Completion check

## 🎯 Game State Management

**Local state only** - No global state library:
- `useState` hooks for board, timer, moves, selection
- `useEffect` for timer intervals and keyboard listeners
- `useRef` for DOM references and timeouts

All state managed in single `sudoku-game.tsx` component (~1290 lines).

## 📝 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete development guidelines, design system, architecture
- **[KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md)** - Full keyboard controls reference
- **[ANALYSIS_UPGRADE.md](./ANALYSIS_UPGRADE.md)** - AI analysis feature documentation
- **[PROMPT_EXAMPLE.md](./PROMPT_EXAMPLE.md)** - Example AI analysis prompts

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

```bash
# Build
npm run build

# Output in .next/ folder
# Deploy as Node.js app or static export
```

## 🧪 Testing

Manual testing workflow:
1. Play through all 3 difficulty levels
2. Test all keyboard shortcuts
3. Verify AI analysis generates correctly
4. Check mobile responsiveness
5. Test timer accuracy
6. Validate move history

No automated tests currently - contributions welcome!

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- [ ] Add undo/redo functionality
- [ ] Implement hint system
- [ ] Add dark mode toggle
- [ ] Create automated tests
- [ ] Add puzzle sharing (URL/QR code)
- [ ] Implement multiplayer mode
- [ ] Add accessibility improvements (screen reader support)
- [ ] Optimize performance (React.memo, useMemo)

## 📄 License

MIT License - feel free to use this project for learning or personal use.

## 👤 Author

**francostan**

- GitHub: [@francostan](https://github.com/francostan)
- Built with ❤️ using Next.js and Claude

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Lucide](https://lucide.dev/) - Icon set
- [Vercel](https://vercel.com/) - Hosting & analytics
- Sudoku algorithm inspired by classic backtracking approaches

---

**Enjoy solving! 🎯**

Questions? Open an issue or check the [documentation](./CLAUDE.md).
