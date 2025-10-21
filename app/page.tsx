import SudokuGame from "@/components/sudoku-game";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <SudokuGame />
      </main>
      
      <footer className="py-6 text-center border-t border-border/20">
        <p className="text-xs text-muted-foreground/60 tracking-wide">
          Made with care by{" "}
          <a 
            href="https://github.com/francostan" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-foreground/80 hover:text-foreground transition-colors underline decoration-dotted underline-offset-2"
          >
            francostan
          </a>
        </p>
      </footer>
    </div>
  );
}
