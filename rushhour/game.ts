import type { Car, GridConfig } from "./grid.ts";
import { populateGrid } from "./grid.ts";

export type MoveDirection = "up" | "down" | "left" | "right";

export interface Move {
  carId: string;
  direction: MoveDirection;
}

export interface GameState extends GridConfig {
  exitRow: number;
  exitCol: number;
}

export function cloneGameState(state: GameState): GameState {
  return {
    width: state.width,
    height: state.height,
    exitRow: state.exitRow,
    exitCol: state.exitCol,
    cars: state.cars.map((car) => ({ ...car }))
  };
}

export function buildGridFromState(state: GameState): (Car | null)[][] {
  return populateGrid({
    width: state.width,
    height: state.height,
    cars: state.cars
  });
}

export function applyMove(state: GameState, move: Move): GameState {
  const carIndex = state.cars.findIndex((car) => car.id === move.carId);
  if (carIndex === -1) {
    throw new Error(`Unknown car id: ${move.carId}`);
  }

  const car = state.cars[carIndex]!;

  let dRow = 0;
  let dCol = 0;

  switch (move.direction) {
    case "up":
      dRow = -1;
      break;
    case "down":
      dRow = 1;
      break;
    case "left":
      dCol = -1;
      break;
    case "right":
      dCol = 1;
      break;
  }

  if (dRow !== 0 && car.orientation !== "vertical") {
    throw new Error(`Car ${car.id} cannot move vertically`);
  }

  if (dCol !== 0 && car.orientation !== "horizontal") {
    throw new Error(`Car ${car.id} cannot move horizontally`);
  }

  const newRow = car.row + dRow;
  const newCol = car.col + dCol;

  if (newRow < 0 || newCol < 0) {
    throw new Error("Move would go out of bounds");
  }

  if (car.orientation === "horizontal") {
    if (newCol + car.length - 1 >= state.width) {
      throw new Error("Move would go out of bounds");
    }
  } else {
    if (newRow + car.length - 1 >= state.height) {
      throw new Error("Move would go out of bounds");
    }
  }

  const updatedCar: Car = { ...car, row: newRow, col: newCol };
  const updatedCars = state.cars.slice();
  updatedCars[carIndex] = updatedCar;

  const config: GridConfig = {
    width: state.width,
    height: state.height,
    cars: updatedCars
  };

  // Will throw if the move causes overlaps or other invalid placement
  populateGrid(config);

  return {
    ...state,
    cars: updatedCars
  };
}

export function isSolved(state: GameState): boolean {
  const redCar = state.cars.find((car) => car.color === "red");
  if (!redCar) {
    return false;
  }

  if (redCar.orientation !== "horizontal") {
    return false;
  }

  const frontCol = redCar.col + redCar.length - 1;
  return redCar.row === state.exitRow && frontCol === state.exitCol;
}

export function createDemoGameState(): GameState {
  return {
    width: 6,
    height: 6,
    exitRow: 2,
    exitCol: 5,
    cars: [
      { id: "target", color: "red", length: 2, orientation: "horizontal", row: 2, col: 0 },
      { id: "blue1", color: "blue", length: 3, orientation: "vertical", row: 0, col: 3 },
      { id: "green1", color: "green", length: 2, orientation: "vertical", row: 3, col: 1 },
      { id: "yellow1", color: "yellow", length: 2, orientation: "horizontal", row: 0, col: 1 },
      { id: "purple1", color: "purple", length: 3, orientation: "horizontal", row: 4, col: 2 },
      { id: "gray1", color: "gray", length: 2, orientation: "vertical", row: 1, col: 5 }
    ]
  };
}
