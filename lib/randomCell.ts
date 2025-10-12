export interface EmptyCell {
  row: number;
  col: number;
}

export function getEmptyCells(occupiedCells: EmptyCell[]): EmptyCell[] {
  const allCells: EmptyCell[] = [];
  
  // Generate all cells except center (2,2) which is FREE
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) continue; // Skip center FREE cell
      allCells.push({ row, col });
    }
  }
  
  // Filter out occupied cells
  return allCells.filter(cell => 
    !occupiedCells.some(occupied => 
      occupied.row === cell.row && occupied.col === cell.col
    )
  );
}

export function pickRandomCell(emptyCells: EmptyCell[]): EmptyCell | null {
  if (emptyCells.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
}