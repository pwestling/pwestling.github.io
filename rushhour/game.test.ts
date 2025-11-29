import { describe, expect, it } from "bun:test";
import { applyMove, createDemoGameState, isSolved, type GameState } from "./game.ts";

describe("game logic", () => {
  it("can move a car one step in a valid direction", () => {
    const initial = createDemoGameState();
    const target = initial.cars.find((car) => car.id === "target");
    expect(target).toBeDefined();

    const next = applyMove(initial, { carId: "target", direction: "right" });
    const moved = next.cars.find((car) => car.id === "target");
    expect(moved).toBeDefined();
    expect(moved?.row).toBe(target?.row);
    expect(moved?.col).toBe((target?.col ?? 0) + 1);
  });

  it("prevents a car from moving off the board", () => {
    const state: GameState = {
      width: 6,
      height: 6,
      exitRow: 2,
      exitCol: 5,
      cars: [
        { id: "edge", color: "blue", length: 2, orientation: "horizontal", row: 0, col: 4 }
      ]
    };

    expect(() => applyMove(state, { carId: "edge", direction: "right" })).toThrow();
  });

  it("prevents a car from moving into another car", () => {
    const state: GameState = {
      width: 6,
      height: 6,
      exitRow: 2,
      exitCol: 5,
      cars: [
        { id: "car1", color: "red", length: 2, orientation: "horizontal", row: 2, col: 1 },
        { id: "car2", color: "blue", length: 2, orientation: "horizontal", row: 2, col: 3 }
      ]
    };

    expect(() => applyMove(state, { carId: "car1", direction: "right" })).toThrow();
  });

  it("detects solved state when red car reaches the exit", () => {
    const state: GameState = {
      width: 6,
      height: 6,
      exitRow: 2,
      exitCol: 5,
      cars: [
        { id: "target", color: "red", length: 2, orientation: "horizontal", row: 2, col: 4 }
      ]
    };

    expect(isSolved(state)).toBe(true);
  });

  it("is not solved when red car is not at the exit", () => {
    const initial = createDemoGameState();
    expect(isSolved(initial)).toBe(false);
  });
});

