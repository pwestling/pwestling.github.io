import { describe, expect, it } from "bun:test";
import { createEmptyGrid, populateGrid, type GridConfig } from "./grid.ts";

describe("createEmptyGrid", () => {
  it("creates a grid of the correct size filled with nulls", () => {
    const width = 4;
    const height = 3;
    const grid = createEmptyGrid(width, height);

    expect(grid.length).toBe(height);
    for (const row of grid) {
      expect(row.length).toBe(width);
      for (const cell of row) {
        expect(cell).toBeNull();
      }
    }
  });
});

describe("populateGrid", () => {
  it("places cars correctly on the grid", () => {
    const config: GridConfig = {
      width: 6,
      height: 6,
      cars: [
        { id: "car1", color: "red", length: 2, orientation: "horizontal", row: 0, col: 0 },
        { id: "car2", color: "blue", length: 3, orientation: "vertical", row: 1, col: 5 }
      ]
    };

    const grid = populateGrid(config);

    expect(grid[0]![0]!.id).toBe("car1");
    expect(grid[0]![1]!.id).toBe("car1");
    expect(grid[1]![5]!.id).toBe("car2");
    expect(grid[2]![5]!.id).toBe("car2");
    expect(grid[3]![5]!.id).toBe("car2");
  });

  it("throws if a car is out of bounds", () => {
    const config: GridConfig = {
      width: 4,
      height: 4,
      cars: [
        { id: "car1", color: "red", length: 3, orientation: "horizontal", row: 0, col: 2 }
      ]
    };

    expect(() => populateGrid(config)).toThrow();
  });

  it("throws if cars overlap", () => {
    const config: GridConfig = {
      width: 4,
      height: 4,
      cars: [
        { id: "car1", color: "red", length: 2, orientation: "horizontal", row: 1, col: 1 },
        { id: "car2", color: "blue", length: 3, orientation: "vertical", row: 0, col: 2 }
      ]
    };

    expect(() => populateGrid(config)).toThrow();
  });
});
