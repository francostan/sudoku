"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles } from "lucide-react";
import { generateSudoku, isValidMove, isSolved } from "@/lib/sudoku-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import confetti from "canvas-confetti";

type Cell = {
  value: number;
  isFixed: boolean;
  isError: boolean;
};

type Difficulty = "easy" | "medium" | "hard";

type Move = {
  position: string;
  value: number;
  timestamp: number;
};

export default function SudokuGame() {
  const [board, setBoard] = useState<Cell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isComplete, setIsComplete] = useState(false);
  const [recentlyFilled, setRecentlyFilled] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [selectedAI, setSelectedAI] = useState<"chatgpt" | "claude">("claude");
  const [initialBoard, setInitialBoard] = useState<Cell[][]>([]);
  const [navigationBuffer, setNavigationBuffer] = useState<string>("");
  const [showHelp, setShowHelp] = useState(false);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const moveLogRef = useRef<HTMLDivElement>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isMobile = useIsMobile();

  const columnLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  const rowLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  useEffect(() => {
    startNewGame(difficulty);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerRunning && !isComplete) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isComplete]);

  useEffect(() => {
    if (moveLogRef.current) {
      moveLogRef.current.scrollTop = moveLogRef.current.scrollHeight;
    }
  }, [moveHistory]);

  useEffect(() => {
    if (recentlyFilled) {
      const timer = setTimeout(() => setRecentlyFilled(null), 400);
      return () => clearTimeout(timer);
    }
  }, [recentlyFilled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();

      // New game shortcut
      if (key === "N" && !e.metaKey && !e.ctrlKey && !showHelp) {
        e.preventDefault();
        startNewGame(difficulty);
        return;
      }

      // Help overlay toggle
      if (key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Close help if open
      if (showHelp && e.key === "Escape") {
        e.preventDefault();
        setShowHelp(false);
        return;
      }

      // Two-key navigation sequence (when no cell selected or "G" command)
      if (key === "G" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setNavigationBuffer("");
        setSelectedCell(null);
        return;
      }

      // Handle navigation buffer
      if (!selectedCell || navigationBuffer !== "") {
        // Column selection (A-I)
        if (key >= "A" && key <= "I" && navigationBuffer === "") {
          e.preventDefault();
          setNavigationBuffer(key);

          // Auto-reset after 3 seconds
          if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
          }
          navigationTimeoutRef.current = setTimeout(() => {
            setNavigationBuffer("");
          }, 3000);
          return;
        }

        // Row selection (1-9)
        if (key >= "1" && key <= "9" && navigationBuffer !== "") {
          e.preventDefault();
          const col = navigationBuffer.charCodeAt(0) - 65; // A=0, B=1...
          const row = parseInt(key) - 1; // 1=0, 2=1...
          setSelectedCell({ row, col });
          setNavigationBuffer("");
          if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
          }
          return;
        }

        // Cancel navigation
        if (e.key === "Escape" && navigationBuffer !== "") {
          e.preventDefault();
          setNavigationBuffer("");
          if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
          }
          return;
        }
      }

      // Existing controls when cell is selected
      if (selectedCell) {
        const { row, col } = selectedCell;

        if (e.key >= "1" && e.key <= "9") {
          e.preventDefault();
          handleNumberInput(Number.parseInt(e.key));
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          handleClear();
        } else if (e.key === "Escape") {
          e.preventDefault();
          setSelectedCell(null);
        } else if (e.key === "ArrowUp" && row > 0) {
          e.preventDefault();
          setSelectedCell({ row: row - 1, col });
        } else if (e.key === "ArrowDown" && row < 8) {
          e.preventDefault();
          setSelectedCell({ row: row + 1, col });
        } else if (e.key === "ArrowLeft" && col > 0) {
          e.preventDefault();
          setSelectedCell({ row, col: col - 1 });
        } else if (e.key === "ArrowRight" && col < 8) {
          e.preventDefault();
          setSelectedCell({ row, col: col + 1 });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [selectedCell, board, navigationBuffer, showHelp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatMoveTime = (timestamp: number, startTime: number | null) => {
    if (!startTime) return "00:00";
    const elapsedSeconds = Math.floor((timestamp - startTime) / 1000);
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatBoardForPrompt = (boardData: Cell[][]) => {
    const lines: string[] = [];
    lines.push("    A B C   D E F   G H I");
    lines.push("  ┌───────┬───────┬───────┐");

    for (let row = 0; row < 9; row++) {
      let line = `${row + 1} │ `;
      for (let col = 0; col < 9; col++) {
        const cell = boardData[row][col];
        line += cell.value === 0 ? "." : cell.value.toString();
        if ((col + 1) % 3 === 0) {
          line += " │ ";
        } else {
          line += " ";
        }
      }
      lines.push(line.trimEnd());

      if ((row + 1) % 3 === 0 && row !== 8) {
        lines.push("  ├───────┼───────┼───────┤");
      }
    }

    lines.push("  └───────┴───────┴───────┘");
    return lines.join("\n");
  };

  const generateAnalysisPrompt = () => {
    const status = isComplete ? "Complete" : "In Progress";
    const completionPercent = Math.round(
      (board.flat().filter((cell) => cell.value !== 0).length / 81) * 100,
    );

    const movesText = moveHistory
      .map((move, index) => {
        const prevTime =
          index > 0 ? moveHistory[index - 1].timestamp : gameStartTime;
        const delta = prevTime
          ? Math.round((move.timestamp - prevTime) / 1000)
          : 0;
        const deltaText = index > 0 ? `  (Δ${delta}s)` : "";
        return `${formatMoveTime(move.timestamp, gameStartTime)}  ${move.position} → ${move.value}${deltaText}`;
      })
      .join("\n");

    const initialBoardText = formatBoardForPrompt(initialBoard);

    return `# 🎯 ELITE SUDOKU ANALYSIS: Your Solving Patterns Decoded

**🎭 ANALYSIS MODE:** Act as a ruthless Sudoku master. Be surgical, not polite. Every insight must be actionable.

════════════════════════════════════════════════════════════════
🔍 PHASE 0: PRE-ANALYSIS RESEARCH (MANDATORY)
════════════════════════════════════════════════════════════════

BEFORE analyzing my moves, research these topics:

1. **Web search:** "advanced sudoku solving techniques constraint satisfaction"
2. **Web search:** "sudoku pattern recognition naked pairs hidden singles x-wing"
3. **Web search:** "optimal sudoku solving sequence cognitive strategies"

**Use this knowledge to:**
- Identify which formal techniques I used (by name)
- Spot techniques I missed that were available
- Compare my approach to optimal solving sequences
- Reference specific Sudoku terminology in your analysis

════════════════════════════════════════════════════════════════
📊 SESSION SNAPSHOT
════════════════════════════════════════════════════════════════

**Difficulty:** ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} | **Time:** ${formatTime(elapsedTime)} | **Moves:** ${moveHistory.length} | **Status:** ${status} | **Completion:** ~${completionPercent}% filled

════════════════════════════════════════════════════════════════
🎯 INITIAL PUZZLE STATE
════════════════════════════════════════════════════════════════

\`\`\`
${initialBoardText}
\`\`\`

*Legend: Fixed numbers = given clues · (.) = empty cells I need to fill*

════════════════════════════════════════════════════════════════
⏱️ MY MOVE TIMELINE (tempo reveals thinking patterns)
════════════════════════════════════════════════════════════════

${movesText || "No moves yet - puzzle just started"}

════════════════════════════════════════════════════════════════
🗡️ ACT I: CRITICAL ASSESSMENT (The Brutal Truth)
════════════════════════════════════════════════════════════════

**Identify 5 specific flaws in my solving approach. Be harsh but precise.**

For each weakness, provide:
- **Evidence:** Cite MY actual moves (cell positions, timestamps)
- **Impact:** Quantify inefficiency (time wasted, missed opportunities)
- **Pattern:** Name the anti-pattern or technique gap

**Format:**
1️⃣ [Harsh observation about move sequence/strategy]
   • Evidence: [Specific cells/times from MY moves]
   • Impact: [Measurable cost - e.g., "3 minutes wasted scanning randomly"]
   • Gap: [Technique name I should have used]

2️⃣ [Brutal insight about spatial strategy]
   • Evidence: [Pattern in how I navigated the board]
   • Impact: [How this made puzzle harder]
   • Gap: [Better approach I could have taken]

3️⃣ [Critical analysis of tempo/pacing]
   • Evidence: [Fast vs slow moves, hesitations]
   • Impact: [Cognitive load implications]
   • Gap: [Decision-making framework missing]

4️⃣ [Ruthless assessment of technique usage]
   • Evidence: [Which advanced techniques were available but unused]
   • Impact: [How many cells could have been solved earlier]
   • Gap: [Specific technique names with examples]

5️⃣ [Unfiltered diagnosis of constraint awareness]
   • Evidence: [How I used/ignored row/column/box constraints]
   • Impact: [Efficiency loss from poor constraint checking]
   • Gap: [CSP principles I'm missing]

**Requirements:**
- Reference MY specific moves, not generic advice
- Show opportunity cost with cell examples: "F3 was solvable at 00:15 using hidden singles, but you found it at 01:42"
- Use real Sudoku technique names from your research
- Maximum 2 lines per item

════════════════════════════════════════════════════════════════
🎯 ACT II: MASTER PLAN (Surgical Improvement)
════════════════════════════════════════════════════════════════

**For each weakness above, provide an actionable master plan:**

**Fix for Weakness #1:**
- **Tactical Steps:**
  • [24h] [Immediate drill with specific exercise]
  • [7d]  [Practice routine with measurable goal]
  • [30d] [Integration milestone showing mastery]
- **Leading Indicator:** [Early signal I'm improving - e.g., "spotting naked pairs within 10 seconds"]
- **Lagging Indicator:** [Final outcome - e.g., "solve times reduced by 30%"]
- **Primary Risk:** [Most likely failure mode]
- **Mitigation:** [Specific countermeasure to avoid backsliding]

**Fix for Weakness #2:**
- **Tactical Steps:**
  • [24h] [Action with concrete outcome]
  • [7d]  [Checkpoint with measurement]
  • [30d] [Long-term integration goal]
- **Leading Indicator:** [...]
- **Lagging Indicator:** [...]
- **Primary Risk:** [...]
- **Mitigation:** [...]

[Continue for all 5 weaknesses]

**Requirements:**
- Every step must use action verbs (practice, drill, scan, check, apply)
- Timelines are strict: 24h/7d/30d only
- All indicators must be measurable
- Maximum 5 lines per weakness

════════════════════════════════════════════════════════════════
🧠 ACT III: COGNITIVE ARCHITECTURE (Deep Dive)
════════════════════════════════════════════════════════════════

**Decision-Making Pattern Analysis:**
- **Solving Style:** [Sequential/Opportunistic/Systematic - based on MY moves]
- **Spatial Strategy:** [Row-first/Column-first/Box-first/Mixed - observed pattern]
- **Tempo Profile:** [Ratio of fast intuitive vs slow deliberate moves]
- **Working Memory:** [Estimate how many candidates I track simultaneously]

**Mathematical Foundations Applied:**
- **Constraint Types Used:** [Which of the 324 CSP constraints I actually applied]
- **Inference Chains:** [Diagram my logical dependencies using ASCII arrows]
- **Domain Reduction:** [Show how I narrowed possibilities at key cells]

**Technique Proficiency Matrix:**
| Technique | Observed? | Proficiency | Next Action |
|-----------|-----------|-------------|-------------|
| Naked Singles | [✓/✗] | [None/Basic/Advanced] | [Specific next step] |
| Hidden Singles | [✓/✗] | [None/Basic/Advanced] | [e.g., "Practice at F3, G7"] |
| Naked Pairs | [✓/✗] | [None/Basic/Advanced] | [Drill exercise] |
| Pointing Pairs | [✓/✗] | [None/Basic/Advanced] | [When to use] |
| X-Wing | [✓/✗] | [None/Basic/Advanced] | [Pattern recognition] |

════════════════════════════════════════════════════════════════
📋 YOUR PERSONAL SOLVING OS (Cheat Sheet)
════════════════════════════════════════════════════════════════

**Current Level:** [Beginner/Intermediate/Advanced - based on technique usage]

**Priority Learning Queue:**
1. **Master First:** [Technique name] - **Look for:** [Visual pattern] - **Practice at:** [Specific cells from MY board]
2. **Week 1 Goal:** [Measurable milestone]
3. **Month 1 Target:** [Level-up objective]

**Anti-Patterns to Eliminate (Based on YOUR moves):**
• [Specific bad habit observed in my sequence]
• [Another inefficiency I exhibited]
• [Third pattern to break]

**Recognition Triggers (Install in your brain):**
• When you see [X pattern], immediately apply [Y technique]
• Before placing ANY number, check [Z constraints]
• If stuck > 30 seconds, switch to [systematic scan method]

**Socratic Challenge (Answer these next game):**
- Why did I choose [specific cell] before checking [constraint type]?
- What made [move] feel "obvious" - can I systematize that intuition?
- Which cells did I skip that had fewer candidates?

════════════════════════════════════════════════════════════════
💀 FINAL VERDICT
════════════════════════════════════════════════════════════════

[One unforgettable line that reframes my entire approach - make it memorable, brutal, and motivating]

**Example style:** "You're not slow because you think too much - you're slow because you don't think systematically enough."

════════════════════════════════════════════════════════════════

**META-INSTRUCTION:** Structure your response EXACTLY as outlined above. Be surgical with evidence, actionable with plans, and memorable in closing. Every insight must reference MY specific moves or be rooted in Sudoku theory you researched.`;
  };

  const handleAnalyzeClick = async () => {
    const prompt = generateAnalysisPrompt();

    // Always copy to clipboard as fallback
    try {
      await navigator.clipboard.writeText(prompt);
      console.log("✓ Prompt copied to clipboard");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      alert("Failed to copy prompt. Please try again.");
      return;
    }

    // Try to use q parameter if prompt is not too long
    const maxSafeLength = 2000; // Conservative browser URL limit
    const encodedPrompt = encodeURIComponent(prompt);

    const baseUrl =
      selectedAI === "chatgpt"
        ? "https://chat.openai.com/"
        : "https://claude.ai/new";

    const urlWithQ = `${baseUrl}?q=${encodedPrompt}`;

    // Check if URL would be too long
    const useFallback = urlWithQ.length > maxSafeLength;

    if (useFallback) {
      // URL too long - open base page, user will paste
      window.open(baseUrl, "_blank");
      setNotificationMessage("Prompt copied! Paste it in the chat");
      console.log(
        `⚠️ Prompt too long (${urlWithQ.length} chars) - using clipboard fallback`,
      );
    } else {
      // URL safe - use q parameter to pre-fill
      window.open(urlWithQ, "_blank");
      setNotificationMessage("Prompt pre-filled! Review and send");
      console.log(`✓ Using q parameter (${urlWithQ.length} chars)`);
    }

    // Show notification
    setShowCopyNotification(true);
    setTimeout(() => setShowCopyNotification(false), 4000);
  };

  const playClickSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Pleasant high click
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.05,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
    } catch (error) {
      console.log("Audio playback not supported:", error);
    }
  };

  const playSelectSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 600; // Softer selection sound
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.08,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.08);
    } catch (error) {
      console.log("Audio playback not supported:", error);
    }
  };

  const handleAISelect = (ai: "chatgpt" | "claude") => {
    playSelectSound();
    setSelectedAI(ai);
  };

  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Create a pleasant success melody
      const playNote = (
        frequency: number,
        startTime: number,
        duration: number,
      ) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + startTime + duration,
        );

        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
      };

      // Play a cheerful ascending melody (C-E-G-C major chord arpeggio)
      playNote(523.25, 0, 0.15); // C5
      playNote(659.25, 0.1, 0.15); // E5
      playNote(783.99, 0.2, 0.2); // G5
      playNote(1046.5, 0.35, 0.3); // C6
    } catch (error) {
      console.log("Audio playback not supported:", error);
    }
  };

  const startNewGame = (diff: Difficulty) => {
    const newBoard = generateSudoku(diff);
    setBoard(newBoard);
    setInitialBoard(JSON.parse(JSON.stringify(newBoard))); // Deep copy
    setSelectedCell(null);
    setIsComplete(false);
    setRecentlyFilled(null);
    setElapsedTime(0);
    setIsTimerRunning(false);
    setMoveHistory([]);
    setGameStartTime(null);
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    if (board[row][col].isFixed) return;

    // Play click sound
    playClickSound();

    if (!isTimerRunning) {
      const now = Date.now();
      setIsTimerRunning(true);
      setGameStartTime(now);
    }

    const newBoard = board.map((r, i) =>
      r.map((cell, j) => {
        if (i === row && j === col) {
          const isValid = isValidMove(board, row, col, num);
          return { ...cell, value: num, isError: !isValid };
        }
        return cell;
      }),
    );

    setBoard(newBoard);
    setRecentlyFilled({ row, col });

    const position = `${columnLabels[col]}${rowLabels[row]}`;
    setMoveHistory((prev) => [
      ...prev,
      { position, value: num, timestamp: Date.now() },
    ]);

    setSelectedCell(null);

    if (isSolved(newBoard)) {
      setIsComplete(true);
      setIsTimerRunning(false);

      // Play success sound
      playSuccessSound();

      // Trigger celebration confetti
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 100);
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
      }, 200);
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
    }
  };

  const handleClear = () => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    if (board[row][col].isFixed) return;

    const newBoard = board.map((r, i) =>
      r.map((cell, j) => {
        if (i === row && j === col) {
          return { ...cell, value: 0, isError: false };
        }
        return cell;
      }),
    );

    setBoard(newBoard);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-6 lg:gap-8 xl:gap-12 items-center">
          <aside className="hidden lg:flex lg:justify-end lg:align-center">
            <div className="w-full max-w-[340px] bg-background/95 backdrop-blur-md border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] p-6 space-y-1.5 rounded-xl">
              <button
                onClick={() => {
                  setDifficulty("easy");
                  startNewGame("easy");
                }}
                className={`
                  w-full flex items-center gap-4 px-5 py-4 rounded-[16px] text-left
                  transition-all duration-200 ease-out
                  ${difficulty === "easy" ? "bg-foreground text-background shadow-[0_1px_2px_rgba(0,0,0,0.1)]" : "hover:bg-muted/50 text-foreground/70"}
                `}
              >
                <div
                  className={`rounded-full border-[2px] flex items-center justify-center w-[15px] h-[15px] ${difficulty === "easy" ? "border-background" : "border-current"}`}
                >
                  {difficulty === "easy" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-background" />
                  )}
                </div>
                <span className="font-normal font-mono text-sm">Easy</span>
              </button>

              <button
                onClick={() => {
                  setDifficulty("medium");
                  startNewGame("medium");
                }}
                className={`
                  w-full flex items-center gap-4 px-5 py-4 rounded-[16px] text-left
                  transition-all duration-200 ease-out
                  ${difficulty === "medium" ? "bg-foreground text-background shadow-[0_1px_2px_rgba(0,0,0,0.1)]" : "hover:bg-muted/50 text-foreground/70"}
                `}
              >
                <div
                  className={`rounded-full border-[2px] flex items-center justify-center w-[15px] h-[15px] ${difficulty === "medium" ? "border-background" : "border-current"}`}
                >
                  {difficulty === "medium" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-background" />
                  )}
                </div>
                <span className="font-light font-mono text-sm">Medium</span>
              </button>

              <button
                onClick={() => {
                  setDifficulty("hard");
                  startNewGame("hard");
                }}
                className={`
                  w-full flex items-center gap-4 px-5 py-4 rounded-[16px] text-left
                  transition-all duration-200 ease-out
                  ${difficulty === "hard" ? "bg-foreground text-background shadow-[0_1px_2px_rgba(0,0,0,0.1)]" : "hover:bg-muted/50 text-foreground/70"}
                `}
              >
                <div
                  className={`rounded-full border-[2px] flex items-center justify-center w-[15px] h-[15px] ${difficulty === "hard" ? "border-background" : "border-current"}`}
                >
                  {difficulty === "hard" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-background" />
                  )}
                </div>
                <span className="font-light font-mono text-sm">Hard</span>
              </button>

              <div className="h-px bg-border/30 my-3" />

              <button
                onClick={() => startNewGame(difficulty)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-[16px] text-left hover:bg-muted/50 transition-all duration-200 ease-out font-light font-mono text-sidebar-primary"
              >
                <RotateCcw className="w-[15px] h-[15px]" />
                <span className="font-medium text-sm">Restart</span>
              </button>

              <span className="mt-10 p-3 font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
                Use keyboard shortcuts.
              </span>
              <br />
              <span className="mt-10 p-3 font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
                Press (letter: A) + (number: 1)
              </span>
            </div>
          </aside>

          <main className="space-y-8 md:space-y-10">
            <div className="text-center space-y-5">
              <h1 className="text-6xl lg:text-8xl tracking-tighter text-balance font-extralight md:text-7xl">
                Sudoku
              </h1>

              <div className="flex justify-center">
                <div className="space-y-2">
                  <p className="text-[9px] tracking-[0.35em] uppercase font-mono font-light text-zinc-500">
                    Just focus
                  </p>
                  <div className="text-4xl font-light tabular-nums text-foreground/90 md:text-3xl font-mono tracking-widest leading-7">
                    {formatTime(elapsedTime)}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:hidden">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center sm:items-start">
                <div className="w-full max-w-[340px] bg-background/95 backdrop-blur-md border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] p-6 space-y-1.5 rounded-xl">
                  <button
                    onClick={() => {
                      setDifficulty("easy");
                      startNewGame("easy");
                    }}
                    className={`
                      w-full flex items-center gap-4 px-5 py-4 rounded-[16px] text-left
                      transition-all duration-200 ease-out
                      ${difficulty === "easy" ? "bg-foreground text-background shadow-[0_1px_2px_rgba(0,0,0,0.1)]" : "hover:bg-muted/50 text-foreground/70"}
                    `}
                  >
                    <div
                      className={`rounded-full border-[2px] flex items-center justify-center w-[15px] h-[15px] ${difficulty === "easy" ? "border-background" : "border-current"}`}
                    >
                      {difficulty === "easy" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-background" />
                      )}
                    </div>
                    <span className="font-normal font-mono text-sm">Easy</span>
                  </button>

                  <button
                    onClick={() => {
                      setDifficulty("medium");
                      startNewGame("medium");
                    }}
                    className={`
                      w-full flex items-center gap-4 px-5 py-4 rounded-[16px] text-left
                      transition-all duration-200 ease-out
                      ${difficulty === "medium" ? "bg-foreground text-background shadow-[0_1px_2px_rgba(0,0,0,0.1)]" : "hover:bg-muted/50 text-foreground/70"}
                    `}
                  >
                    <div
                      className={`rounded-full border-[2px] flex items-center justify-center w-[15px] h-[15px] ${difficulty === "medium" ? "border-background" : "border-current"}`}
                    >
                      {difficulty === "medium" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-background" />
                      )}
                    </div>
                    <span className="font-light font-mono text-sm">Medium</span>
                  </button>

                  <button
                    onClick={() => {
                      setDifficulty("hard");
                      startNewGame("hard");
                    }}
                    className={`
                      w-full flex items-center gap-4 px-5 py-4 rounded-[16px] text-left
                      transition-all duration-200 ease-out
                      ${difficulty === "hard" ? "bg-foreground text-background shadow-[0_1px_2px_rgba(0,0,0,0.1)]" : "hover:bg-muted/50 text-foreground/70"}
                    `}
                  >
                    <div
                      className={`rounded-full border-[2px] flex items-center justify-center w-[15px] h-[15px] ${difficulty === "hard" ? "border-background" : "border-current"}`}
                    >
                      {difficulty === "hard" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-background" />
                      )}
                    </div>
                    <span className="font-light font-mono text-sm">Hard</span>
                  </button>

                  <div className="h-px bg-border/30 my-3" />

                  <button
                    onClick={() => startNewGame(difficulty)}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-[16px] text-left hover:bg-muted/50 transition-all duration-200 ease-out font-light font-mono text-sidebar-primary"
                  >
                    <RotateCcw className="w-[15px] h-[15px]" />
                    <span className="font-medium text-sm">Restart</span>
                  </button>

                  <button
                    onClick={() => setShowHelp(true)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 mt-3 rounded-[16px] hover:bg-muted/30 transition-all duration-200 ease-out group"
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 flex items-center justify-center text-[9px] text-muted-foreground/40 group-hover:border-muted-foreground/60 group-hover:text-muted-foreground/70 transition-colors font-mono">
                      ?
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
                      Keyboard
                    </span>
                  </button>
                </div>

                <div className="w-full max-w-[340px] h-[425px] bg-background/95 backdrop-blur-md border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] p-6 rounded-xl flex flex-col">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-1 h-1 rounded-full bg-foreground/30" />
                    <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground/50 font-mono font-light">
                      Moves
                    </p>
                  </div>

                  <div
                    ref={moveLogRef}
                    className="flex-1 overflow-y-auto space-y-1.5 pr-2 mb-4"
                  >
                    {moveHistory.length === 0 ? (
                      <p className="text-muted-foreground/30 font-mono text-center pt-12 leading-relaxed italic font-light text-xs">
                        Awaiting first move
                      </p>
                    ) : (
                      moveHistory.map((move, index) => {
                        const prevTime =
                          index > 0
                            ? moveHistory[index - 1].timestamp
                            : gameStartTime;
                        const delta = prevTime
                          ? Math.round((move.timestamp - prevTime) / 1000)
                          : 0;
                        return (
                          <div
                            key={move.timestamp}
                            className="text-sm font-mono text-foreground/60 tracking-wide py-1 text-center"
                          >
                            <span className="text-muted-foreground/30 text-xs mr-2.5">
                              {(index + 1).toString().padStart(2, "0")}.
                            </span>
                            <span className="font-semibold text-foreground/80">
                              {move.position}
                            </span>
                            <span className="text-muted-foreground/25 mx-2">
                              →
                            </span>
                            <span className="font-medium text-foreground/70">
                              {move.value}
                            </span>
                            <span className="text-muted-foreground/25 mx-1.5">
                              ·
                            </span>
                            <span className="text-[10px] text-muted-foreground/30">
                              {formatMoveTime(move.timestamp, gameStartTime)}
                            </span>
                            {index > 0 && (
                              <span className="text-[9px] text-muted-foreground/20 ml-1.5">
                                (Δ{delta}s)
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="h-px bg-border/30 mb-4" />

                  <div className="flex items-center justify-center gap-4 px-2">
                    <button
                      onClick={() => handleAISelect("chatgpt")}
                      className={`
                        flex items-center gap-2.5 px-3 py-2 rounded-lg
                        transition-all duration-200 ease-out
                        ${selectedAI === "chatgpt" ? "bg-foreground/5" : "hover:bg-muted/30"}
                      `}
                    >
                      <div
                        className={`rounded-full border-[2px] flex items-center justify-center w-[13px] h-[13px]
                          ${selectedAI === "chatgpt" ? "border-foreground/80" : "border-foreground/30"}`}
                      >
                        {selectedAI === "chatgpt" && (
                          <div className="w-2 h-2 rounded-full bg-foreground/80" />
                        )}
                      </div>
                      <span
                        className={`font-mono text-[11px] tracking-wide
                          ${selectedAI === "chatgpt" ? "text-foreground/90" : "text-foreground/40"}`}
                      >
                        ChatGPT
                      </span>
                    </button>

                    <button
                      onClick={() => handleAISelect("claude")}
                      className={`
                        flex items-center gap-2.5 px-3 py-2 rounded-lg
                        transition-all duration-200 ease-out
                        ${selectedAI === "claude" ? "bg-foreground/5" : "hover:bg-muted/30"}
                      `}
                    >
                      <div
                        className={`rounded-full border-[2px] flex items-center justify-center w-[13px] h-[13px]
                          ${selectedAI === "claude" ? "border-foreground/80" : "border-foreground/30"}`}
                      >
                        {selectedAI === "claude" && (
                          <div className="w-2 h-2 rounded-full bg-foreground/80" />
                        )}
                      </div>
                      <span
                        className={`font-mono text-[11px] tracking-wide
                          ${selectedAI === "claude" ? "text-foreground/90" : "text-foreground/40"}`}
                      >
                        Claude
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={handleAnalyzeClick}
                    disabled={moveHistory.length === 0}
                    className="
                      w-full flex items-center justify-center gap-2.5
                      px-5 py-1 mt-2 rounded-xl text-sm
                      bg-accent/40 hover:bg-accent/60
                      border border-border/40 hover:border-foreground/30
                      backdrop-blur-sm
                      transition-all duration-200 ease-out
                      hover:scale-[1.02] active:scale-[0.98]
                      disabled:opacity-20 disabled:hover:scale-100 disabled:cursor-not-allowed
                      font-mono font-light text-foreground/80
                    "
                  >
                    <span>Analyze it</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="inline-flex flex-col gap-3">
                <div className="flex items-center gap-0 pl-8 sm:pl-9 md:pl-10">
                  {columnLabels.map((label, index) => {
                    const isHighlighted = selectedCell?.col === index;
                    return (
                      <div
                        key={label}
                        className={`
                          w-10 sm:w-11 md:w-14 h-6 md:h-7 flex items-center justify-center
                          text-[10px] md:text-xs font-mono tracking-[0.25em] uppercase
                          transition-all duration-200 ease-out
                          ${isHighlighted ? "text-foreground/90 font-semibold scale-110" : "text-muted-foreground/40"}
                        `}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex flex-col gap-0">
                    {rowLabels.map((label, index) => {
                      const isHighlighted = selectedCell?.row === index;
                      return (
                        <div
                          key={label}
                          className={`
                            w-6 h-10 sm:w-6 sm:h-11 md:w-7 md:h-14 flex items-center justify-center
                            text-[10px] md:text-xs font-mono tracking-[0.25em]
                            transition-all duration-200 ease-out
                            ${isHighlighted ? "text-foreground/90 font-semibold scale-110" : "text-muted-foreground/40"}
                            ${(index + 1) % 3 === 0 && index !== 8 ? "mb-[2.5px]" : ""}
                          `}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className="inline-grid grid-cols-9 gap-0 border-[2.5px] border-foreground/90 rounded-2xl overflow-hidden
                           shadow-[0_4px_32px_rgba(0,0,0,0.06)] bg-card/90 backdrop-blur-sm"
                  >
                    {board.map((row, rowIndex) =>
                      row.map((cell, colIndex) => {
                        const isSelected =
                          selectedCell?.row === rowIndex &&
                          selectedCell?.col === colIndex;
                        const isInSelectedRow = selectedCell?.row === rowIndex;
                        const isInSelectedCol = selectedCell?.col === colIndex;
                        const isInSelectedBox =
                          selectedCell &&
                          Math.floor(selectedCell.row / 3) ===
                            Math.floor(rowIndex / 3) &&
                          Math.floor(selectedCell.col / 3) ===
                            Math.floor(colIndex / 3);
                        const isRecentlyFilled =
                          recentlyFilled?.row === rowIndex &&
                          recentlyFilled?.col === colIndex;

                        const borderRight =
                          (colIndex + 1) % 3 === 0 && colIndex !== 8;
                        const borderBottom =
                          (rowIndex + 1) % 3 === 0 && rowIndex !== 8;

                        return (
                          <button
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            className={`
                              w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 flex items-center justify-center
                              text-lg sm:text-xl md:text-2xl font-normal relative
                              transition-all duration-200 ease-out
                              ${borderRight ? "border-r-[2.5px] border-foreground/90" : "border-r border-border/25"}
                              ${borderBottom ? "border-b-[2.5px] border-foreground/90" : "border-b border-border/25"}
                              ${cell.isFixed ? "font-semibold text-foreground" : "text-foreground/50"}
                              ${isSelected ? "bg-accent/60 ring-2 ring-inset ring-foreground/20" : ""}
                              ${!isSelected && (isInSelectedRow || isInSelectedCol) ? "bg-muted/40" : ""}
                              ${!isSelected && isInSelectedBox && !isInSelectedRow && !isInSelectedCol ? "bg-muted/20" : ""}
                              ${!isSelected && !isInSelectedRow && !isInSelectedCol && !isInSelectedBox ? "bg-card hover:bg-accent/30" : ""}
                              ${cell.isError ? "text-destructive animate-shake" : ""}
                              ${isRecentlyFilled ? "animate-scale-in" : ""}
                              cursor-pointer focus:outline-none
                              hover:scale-[1.03] active:scale-[0.97]
                            `}
                          >
                            {cell.value !== 0 ? cell.value : ""}
                          </button>
                        );
                      }),
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="grid grid-cols-5 gap-2 sm:gap-2.5 max-w-md">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberInput(num)}
                    disabled={
                      !selectedCell ||
                      board[selectedCell.row][selectedCell.col].isFixed
                    }
                    className={`
                      text-lg sm:text-xl font-normal h-14 w-14 sm:h-16 sm:w-16 md:h-16 md:w-16 rounded-xl
                      transition-all duration-200 ease-out
                      hover:scale-105 hover:bg-accent/50 hover:border-foreground/30
                      active:scale-95
                      disabled:opacity-20 disabled:hover:scale-100 disabled:cursor-not-allowed
                      border-[1.5px]
                    `}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleClear}
                  disabled={
                    !selectedCell ||
                    board[selectedCell.row][selectedCell.col].isFixed
                  }
                  className={`
                    text-[10px] font-medium h-14 w-14 sm:h-16 sm:w-16 md:h-16 md:w-16 rounded-xl tracking-wider uppercase
                    transition-all duration-200 ease-out
                    hover:scale-105 hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive
                    active:scale-95
                    disabled:opacity-20 disabled:hover:scale-100 disabled:cursor-not-allowed
                    border-[1.5px]
                  `}
                >
                  Clear
                </Button>
              </div>
            </div>

            {isComplete && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 animate-in fade-in duration-300">
                <div className="bg-background border-2 border-foreground/20 rounded-3xl p-10 shadow-2xl max-w-md mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                  <div className="text-center space-y-6">
                    <div className="text-6xl">🎉</div>
                    <div>
                      <p className="text-4xl font-light text-balance tracking-tight mb-2">
                        Complete!
                      </p>
                      <p className="text-sm text-muted-foreground/70 font-light tracking-wider uppercase">
                        Well Done
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="bg-muted/30 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground/60 uppercase tracking-wider font-mono mb-1">
                          Time
                        </p>
                        <p className="text-2xl font-mono font-light">
                          {formatTime(elapsedTime)}
                        </p>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground/60 uppercase tracking-wider font-mono mb-1">
                          Moves
                        </p>
                        <p className="text-2xl font-mono font-light">
                          {moveHistory.length}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="h-px bg-border/30" />

                      <div>
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <button
                            onClick={() => handleAISelect("chatgpt")}
                            className={`
                              flex items-center gap-2 px-4 py-2 rounded-lg
                              transition-all duration-200 ease-out
                              ${selectedAI === "chatgpt" ? "bg-foreground/10" : "hover:bg-muted/30"}
                            `}
                          >
                            <div
                              className={`rounded-full border-[2px] flex items-center justify-center w-[13px] h-[13px]
                                ${selectedAI === "chatgpt" ? "border-foreground/80" : "border-foreground/30"}`}
                            >
                              {selectedAI === "chatgpt" && (
                                <div className="w-2 h-2 rounded-full bg-foreground/80" />
                              )}
                            </div>
                            <span
                              className={`font-mono text-xs tracking-wide
                                ${selectedAI === "chatgpt" ? "text-foreground/90" : "text-foreground/40"}`}
                            >
                              ChatGPT
                            </span>
                          </button>

                          <button
                            onClick={() => handleAISelect("claude")}
                            className={`
                              flex items-center gap-2 px-4 py-2 rounded-lg
                              transition-all duration-200 ease-out
                              ${selectedAI === "claude" ? "bg-foreground/10" : "hover:bg-muted/30"}
                            `}
                          >
                            <div
                              className={`rounded-full border-[2px] flex items-center justify-center w-[13px] h-[13px]
                                ${selectedAI === "claude" ? "border-foreground/80" : "border-foreground/30"}`}
                            >
                              {selectedAI === "claude" && (
                                <div className="w-2 h-2 rounded-full bg-foreground/80" />
                              )}
                            </div>
                            <span
                              className={`font-mono text-xs tracking-wide
                                ${selectedAI === "claude" ? "text-foreground/90" : "text-foreground/40"}`}
                            >
                              Claude
                            </span>
                          </button>
                        </div>

                        <button
                          onClick={handleAnalyzeClick}
                          className="
                            w-full flex items-center justify-center gap-2
                            px-5 py-3 rounded-xl text-sm
                            bg-accent/50 hover:bg-accent/70
                            border border-border/40 hover:border-foreground/30
                            backdrop-blur-sm
                            transition-all duration-200 ease-out
                            hover:scale-[1.02] active:scale-[0.98]
                            font-mono font-medium text-foreground/90
                          "
                        >
                          <span>Analyze it</span>
                        </button>
                      </div>

                      <div className="h-px bg-border/30" />

                      <Button
                        onClick={() => startNewGame(difficulty)}
                        className="w-full h-12 text-base rounded-xl"
                        size="lg"
                      >
                        Play Again
                      </Button>
                      <p className="text-xs text-muted-foreground/50 font-mono">
                        Press{" "}
                        <kbd className="px-2 py-1 bg-muted/50 rounded text-[10px]">
                          N
                        </kbd>{" "}
                        for new game
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          <aside className="hidden lg:flex lg:justify-start lg:align-center">
            <div className="w-full max-w-[340px] h-[440px] bg-background/95 backdrop-blur-md border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] p-6 rounded-xl flex flex-col">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-1 h-1 rounded-full bg-foreground/30" />
                <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground/50 font-mono font-light">
                  Moves
                </p>
              </div>

              <div
                ref={moveLogRef}
                className="flex-1 overflow-y-auto space-y-1.5 pr-2 mb-4"
              >
                {moveHistory.length === 0 ? (
                  <p className="text-muted-foreground/30 font-mono text-center pt-12 leading-relaxed italic font-light text-xs">
                    Awaiting first move
                  </p>
                ) : (
                  moveHistory.map((move, index) => {
                    const prevTime =
                      index > 0
                        ? moveHistory[index - 1].timestamp
                        : gameStartTime;
                    const delta = prevTime
                      ? Math.round((move.timestamp - prevTime) / 1000)
                      : 0;
                    return (
                      <div
                        key={move.timestamp}
                        className="text-sm font-mono text-foreground/60 tracking-wide py-1 text-center"
                      >
                        <span className="text-muted-foreground/30 text-xs mr-2.5">
                          {(index + 1).toString().padStart(2, "0")}.
                        </span>
                        <span className="font-semibold text-foreground/80">
                          {move.position}
                        </span>
                        <span className="text-muted-foreground/25 mx-2">→</span>
                        <span className="font-medium text-foreground/70">
                          {move.value}
                        </span>
                        <span className="text-muted-foreground/25 mx-1.5">
                          ·
                        </span>
                        <span className="text-[10px] text-muted-foreground/30">
                          {formatMoveTime(move.timestamp, gameStartTime)}
                        </span>
                        {index > 0 && (
                          <span className="text-[9px] text-muted-foreground/20 ml-1.5">
                            (Δ{delta}s)
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="h-px bg-border/30 mb-4" />

              <div className="flex items-center justify-center gap-4 px-2">
                <button
                  onClick={() => handleAISelect("chatgpt")}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-lg
                    transition-all duration-200 ease-out
                    ${selectedAI === "chatgpt" ? "bg-foreground/5" : "hover:bg-muted/30"}
                  `}
                >
                  <div
                    className={`rounded-full border-[2px] flex items-center justify-center w-[13px] h-[13px]
                      ${selectedAI === "chatgpt" ? "border-foreground/80" : "border-foreground/30"}`}
                  >
                    {selectedAI === "chatgpt" && (
                      <div className="w-2 h-2 rounded-full bg-foreground/80" />
                    )}
                  </div>
                  <span
                    className={`font-mono text-[11px] tracking-wide
                      ${selectedAI === "chatgpt" ? "text-foreground/90" : "text-foreground/40"}`}
                  >
                    ChatGPT
                  </span>
                </button>

                <button
                  onClick={() => handleAISelect("claude")}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-lg
                    transition-all duration-200 ease-out
                    ${selectedAI === "claude" ? "bg-foreground/5" : "hover:bg-muted/30"}
                  `}
                >
                  <div
                    className={`rounded-full border-[2px] flex items-center justify-center w-[13px] h-[13px]
                      ${selectedAI === "claude" ? "border-foreground/80" : "border-foreground/30"}`}
                  >
                    {selectedAI === "claude" && (
                      <div className="w-2 h-2 rounded-full bg-foreground/80" />
                    )}
                  </div>
                  <span
                    className={`font-mono text-[11px] tracking-wide
                      ${selectedAI === "claude" ? "text-foreground/90" : "text-foreground/40"}`}
                  >
                    Claude
                  </span>
                </button>
              </div>

              <button
                onClick={handleAnalyzeClick}
                disabled={moveHistory.length === 0}
                className="
                  w-full flex items-center justify-center gap-2.5
                  px-5 py-1 mt-2 rounded-xl text-sm
                  bg-accent/40 hover:bg-accent/60
                  border border-border/40 hover:border-foreground/30
                  backdrop-blur-sm
                  transition-all duration-200 ease-out
                  hover:scale-[1.02] active:scale-[0.98]
                  disabled:opacity-20 disabled:hover:scale-100 disabled:cursor-not-allowed
                  font-mono font-light text-foreground/80
                "
              >
                <span>Analyze it</span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Navigation Buffer Indicator */}
      {navigationBuffer && (
        <div className="fixed bottom-6 right-6 bg-foreground/90 text-background px-5 py-3 rounded-xl font-mono text-sm shadow-2xl border-2 border-foreground animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="text-background/60 text-xs uppercase tracking-wider">
              Go to:
            </span>
            <span className="text-lg font-semibold">{navigationBuffer}_</span>
          </div>
          <div className="text-[10px] text-background/50 mt-1 text-center">
            Press row number (1-9) or ESC
          </div>
        </div>
      )}

      {/* Help Overlay */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-background border-2 border-foreground/20 rounded-2xl p-8 shadow-2xl max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light tracking-tight">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Navigation Section */}
              <div>
                <h3 className="text-sm uppercase tracking-widest text-muted-foreground/70 mb-3 font-mono">
                  Navigation
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg">
                    <span className="text-sm">Jump to cell directly</span>
                    <kbd className="px-3 py-1 bg-foreground/10 rounded font-mono text-xs border border-foreground/20">
                      Letter + Number
                    </kbd>
                  </div>
                  <div className="text-xs text-muted-foreground/60 ml-3">
                    Example: Press{" "}
                    <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded font-mono">
                      D
                    </kbd>{" "}
                    then{" "}
                    <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded font-mono">
                      4
                    </kbd>{" "}
                    to select D4
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg">
                    <span className="text-sm">Go to mode (anytime)</span>
                    <kbd className="px-3 py-1 bg-foreground/10 rounded font-mono text-xs border border-foreground/20">
                      G
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg">
                    <span className="text-sm">Arrow keys</span>
                    <kbd className="px-3 py-1 bg-foreground/10 rounded font-mono text-xs border border-foreground/20">
                      ↑ ↓ ← →
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg">
                    <span className="text-sm">Deselect cell</span>
                    <kbd className="px-3 py-1 bg-foreground/10 rounded font-mono text-xs border border-foreground/20">
                      ESC
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Input Section */}
              <div>
                <h3 className="text-sm uppercase tracking-widest text-muted-foreground/70 mb-3 font-mono">
                  Input
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg">
                    <span className="text-sm">Fill cell with number</span>
                    <kbd className="px-3 py-1 bg-foreground/10 rounded font-mono text-xs border border-foreground/20">
                      1-9
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg">
                    <span className="text-sm">Clear cell</span>
                    <kbd className="px-3 py-1 bg-foreground/10 rounded font-mono text-xs border border-foreground/20">
                      Delete / Backspace
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Help Section */}
              <div>
                <h3 className="text-sm uppercase tracking-widest text-muted-foreground/70 mb-3 font-mono">
                  Other
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg">
                    <span className="text-sm">New game</span>
                    <kbd className="px-3 py-1 bg-foreground/10 rounded font-mono text-xs border border-foreground/20">
                      N
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg">
                    <span className="text-sm">Show/hide this help</span>
                    <kbd className="px-3 py-1 bg-foreground/10 rounded font-mono text-xs border border-foreground/20">
                      ?
                    </kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/30 text-center text-xs text-muted-foreground/50">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded font-mono">
                ESC
              </kbd>{" "}
              or{" "}
              <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded font-mono">
                ?
              </kbd>{" "}
              to close
            </div>
          </div>
        </div>
      )}

      {/* Copy Notification Toast */}
      {showCopyNotification && !isMobile && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
          <div className="bg-foreground text-background px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <div className="text-lg">✓</div>
            <div className="text-sm font-medium">{notificationMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
}
