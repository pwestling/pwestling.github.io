import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import type { Color } from "./grid.ts";
import {
  applyMove,
  buildGridFromState,
  cloneGameState,
  createDemoGameState,
  isSolved,
  type GameState,
  type MoveDirection
} from "./game.ts";
import { PUZZLES } from "./puzzles.ts";

function colorToCss(color: Color): string {
  switch (color) {
    case "red":
      return "#ff4b4b";
    case "blue":
      return "#4b7dff";
    case "green":
      return "#4bd66f";
    case "yellow":
      return "#ffce4b";
    case "purple":
      return "#c26dff";
    case "orange":
      return "#ff8a4b";
    case "gray":
      return "#8a96a8";
  }
}

function highlightColorFor(color: Color): string {
  switch (color) {
    case "red":
      return "#ff8585";
    case "blue":
      return "#85a4ff";
    case "green":
      return "#7ee891";
    case "yellow":
      return "#ffe27f";
    case "purple":
      return "#d29bff";
    case "orange":
      return "#ffb17f";
    case "gray":
      return "#b0bccd";
  }
}

function createFallbackState(): GameState {
  return cloneGameState(createDemoGameState());
}

interface GridViewProps {
  state: GameState;
  selectedCarId?: string;
  onSelectCar(id: string): void;
}

const GridView: React.FC<GridViewProps> = ({ state, selectedCarId, onSelectCar }) => {
  const grid = buildGridFromState(state);

  return (
    <div className="board-wrapper">
      <div className="board">
        {grid.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const key = `${rowIndex}-${colIndex}`;
            const isCar = cell !== null;
            const isSelected = isCar && selectedCarId === cell.id;
            const baseColor = isCar ? colorToCss(cell.color) : undefined;
            const bg = isCar && isSelected ? highlightColorFor(cell.color) : baseColor;

            return (
              <div
                key={key}
                className={`cell${isCar ? " car" : ""}${isSelected ? " selected" : ""}`}
                onClick={() => {
                  if (cell) {
                    onSelectCar(cell.id);
                  }
                }}
              >
                <div
                  className="cell-inner"
                  style={bg ? { backgroundColor: bg } : undefined}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [puzzleIndex, setPuzzleIndex] = React.useState(0);
  const [state, setState] = React.useState<GameState>(() =>
    cloneGameState(PUZZLES[0]?.initialState ?? createFallbackState())
  );
  const [selectedCarId, setSelectedCarId] = React.useState<string | undefined>(() =>
    state.cars[0]?.id
  );
  const [movesMade, setMovesMade] = React.useState(0);

  const puzzle = PUZZLES[puzzleIndex] ?? PUZZLES[0];
  const solved = isSolved(state);

  const resetToPuzzle = React.useCallback(
    (index: number) => {
      const p = PUZZLES[index] ?? PUZZLES[0];
      if (!p) {
        return;
      }

      const fresh = cloneGameState(p.initialState);
      setPuzzleIndex(index);
      setState(fresh);
      setSelectedCarId(fresh.cars.find((car) => car.color === "red")?.id ?? fresh.cars[0]?.id);
      setMovesMade(0);
    },
    [setPuzzleIndex, setState, setSelectedCarId, setMovesMade]
  );

  const moveSelected = React.useCallback(
    (direction: MoveDirection) => {
      if (!selectedCarId) {
        return;
      }

      setState((previous) => {
        try {
          const next = applyMove(previous, { carId: selectedCarId, direction });
          setMovesMade((m) => m + 1);
          return next;
        } catch {
          return previous;
        }
      });
    },
    [selectedCarId]
  );

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key;

      if (key === "ArrowLeft") {
        event.preventDefault();
        moveSelected("left");
      } else if (key === "ArrowRight") {
        event.preventDefault();
        moveSelected("right");
      } else if (key === "ArrowUp") {
        event.preventDefault();
        moveSelected("up");
      } else if (key === "ArrowDown") {
        event.preventDefault();
        moveSelected("down");
      } else if (key === "r" || key === "R") {
        event.preventDefault();
        resetToPuzzle(puzzleIndex);
      } else if (key === "]") {
        event.preventDefault();
        const nextIndex = PUZZLES.length === 0 ? 0 : (puzzleIndex + 1) % PUZZLES.length;
        resetToPuzzle(nextIndex);
      } else if (key === "[") {
        event.preventDefault();
        const nextIndex =
          PUZZLES.length === 0 ? 0 : (puzzleIndex - 1 + PUZZLES.length) % PUZZLES.length;
        resetToPuzzle(nextIndex);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [moveSelected, resetToPuzzle, puzzleIndex]);

  return (
    <div className="app-root">
      <div className="app-shell">
        <GridView
          state={state}
          selectedCarId={selectedCarId}
          onSelectCar={setSelectedCarId}
        />

        <div className="side-panel">
          <div>
            <div className="title">Traffic Rush</div>
            <div className="subtitle">Slide the red car to the exit.</div>
          </div>

          <div className="panel-section">
            <div className="panel-heading">Puzzle</div>
            <div className="puzzle-select-row">
              <select
                value={puzzleIndex}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  resetToPuzzle(Number(event.target.value))
                }
              >
                {PUZZLES.map((p, index) => (
                  <option key={p.id ?? index} value={index}>
                    {p.name ?? `Puzzle ${index + 1}`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const nextIndex =
                    PUZZLES.length === 0 ? 0 : (puzzleIndex + 1) % PUZZLES.length;
                  resetToPuzzle(nextIndex);
                }}
              >
                Next
              </button>
            </div>
            <div className="pill-row">
              <div className="pill">#{puzzleIndex + 1}</div>
              {puzzle?.moves != null && <div className="pill">{puzzle.moves} moves (optimal)</div>}
              <div className="pill">{movesMade} moves used</div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-heading">Controls</div>
            <div className="controls-grid">
              <div />
              <button type="button" onClick={() => moveSelected("up")}>
                ↑
              </button>
              <div />
              <button type="button" onClick={() => moveSelected("left")}>
                ←
              </button>
              <button type="button" onClick={() => moveSelected("down")}>
                ↓
              </button>
              <button type="button" onClick={() => moveSelected("right")}>
                →
              </button>
              <button
                type="button"
                className="wide"
                onClick={() => resetToPuzzle(puzzleIndex)}
              >
                Reset puzzle (R)
              </button>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-heading">Status</div>
            {solved ? (
              <div className="status-text good">
                <strong>Solved!</strong> You got the red car to the exit.
              </div>
            ) : (
              <div className="status-text">
                Use the arrow keys or buttons to slide the selected car. Click any car to select it.
              </div>
            )}
          </div>

          <div className="panel-section">
            <div className="panel-heading">Legend</div>
            <div className="legend-row">
              <div className="legend-item">
                <span
                  className="legend-swatch"
                  style={{ backgroundColor: colorToCss("red") }}
                />
                Red car (target)
              </div>
              <div className="legend-item">
                <span
                  className="legend-swatch"
                  style={{ backgroundColor: colorToCss("blue") }}
                />
                Other cars
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById("root") as HTMLElement | null;
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
