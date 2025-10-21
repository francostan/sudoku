type Cell = {
  value: number
  isFixed: boolean
  isError: boolean
}

type Difficulty = "easy" | "medium" | "hard"

// Generate a complete valid Sudoku board
function generateCompleteBoard(): number[][] {
  const board: number[][] = Array(9)
    .fill(0)
    .map(() => Array(9).fill(0))

  fillBoard(board)
  return board
}

// Fill the board using backtracking
function fillBoard(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5)

        for (const num of numbers) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num

            if (fillBoard(board)) {
              return true
            }

            board[row][col] = 0
          }
        }

        return false
      }
    }
  }
  return true
}

// Check if a number can be placed at a position
function isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3
  const startCol = Math.floor(col / 3) * 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false
    }
  }

  return true
}

// Remove numbers from the board based on difficulty
function removeNumbers(board: number[][], difficulty: Difficulty): number[][] {
  const cellsToRemove = {
    easy: 35,
    medium: 45,
    hard: 55,
  }[difficulty]

  const newBoard = board.map((row) => [...row])
  let removed = 0

  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * 9)
    const col = Math.floor(Math.random() * 9)

    if (newBoard[row][col] !== 0) {
      newBoard[row][col] = 0
      removed++
    }
  }

  return newBoard
}

// Generate a Sudoku puzzle
export function generateSudoku(difficulty: Difficulty): Cell[][] {
  const completeBoard = generateCompleteBoard()
  const puzzleBoard = removeNumbers(completeBoard, difficulty)

  return puzzleBoard.map((row) =>
    row.map((value) => ({
      value,
      isFixed: value !== 0,
      isError: false,
    })),
  )
}

// Check if a move is valid
export function isValidMove(board: Cell[][], row: number, col: number, num: number): boolean {
  if (num === 0) return true

  // Create a temporary board for validation
  const tempBoard = board.map((r) => r.map((cell) => cell.value))
  tempBoard[row][col] = num

  return isValidPlacement(tempBoard, row, col, num)
}

// Check if the puzzle is solved
export function isSolved(board: Cell[][]): boolean {
  // Check if all cells are filled
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col].value === 0 || board[row][col].isError) {
        return false
      }
    }
  }

  // Check if all rows, columns, and boxes are valid
  const tempBoard = board.map((r) => r.map((cell) => cell.value))

  for (let i = 0; i < 9; i++) {
    const row = new Set(tempBoard[i])
    const col = new Set(tempBoard.map((r) => r[i]))

    if (row.size !== 9 || col.size !== 9) return false
  }

  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const box = new Set<number>()
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          box.add(tempBoard[boxRow * 3 + i][boxCol * 3 + j])
        }
      }
      if (box.size !== 9) return false
    }
  }

  return true
}
