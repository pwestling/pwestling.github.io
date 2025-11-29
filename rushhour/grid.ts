export type Color = "red" | "blue" | "green" | "yellow" | "purple" | "orange" | "gray";

export type Orientation = "horizontal" | "vertical";

export interface Car {
  id: string;
  color: Color;
  length: number;
  orientation: Orientation;
  row: number;
  col: number;
}

export interface GridConfig {
  width: number;
  height: number;
  cars: Car[];
}

export function createEmptyGrid(width: number, height: number): (Car | null)[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => null));
}

export function populateGrid(config: GridConfig): (Car | null)[][] {
  const grid = createEmptyGrid(config.width, config.height);

  for (const car of config.cars) {
    for (let i = 0; i < car.length; i++) {
      const r = car.row + (car.orientation === "vertical" ? i : 0);
      const c = car.col + (car.orientation === "horizontal" ? i : 0);

      if (r < 0 || r >= config.height || c < 0 || c >= config.width) {
        throw new Error(`Car ${car.id} is out of bounds at (${r}, ${c})`);
      }

      const row = grid[r]!;
      const existing = row[c];

      if (existing !== null) {
        throw new Error(
          `Car ${car.id} overlaps with car ${existing ? existing.id : "unknown"} at (${r}, ${c})`
        );
      }

      row[c] = car;
    }
  }

  return grid;
}
