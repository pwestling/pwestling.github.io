import React from "react";
import { render, Box, Text, useApp, useInput } from "ink";
import type { Color } from "./grid.ts";
import { buildGridFromState, type GameState, type MoveDirection, applyMove, cloneGameState, createDemoGameState, isSolved } from "./game.ts";
import { PUZZLES } from "./puzzles.ts";

function colorToChar(color: Color): string {
  switch (color) {
    case "red":
      return "R";
    case "blue":
      return "B";
    case "green":
      return "G";
    case "yellow":
      return "Y";
    case "purple":
      return "P";
    case "orange":
      return "O";
    case "gray":
      return "X";
  }
}

function colorToInk(color: Color): React.ComponentProps<typeof Text>["color"] {
  switch (color) {
    case "red":
      return "red";
    case "blue":
      return "blue";
    case "green":
      return "green";
    case "yellow":
      return "yellow";
    case "purple":
      return "magenta";
    case "orange":
      return "yellow";
    case "gray":
      return "gray";
  }
}

function highlightColorFor(color: Color): React.ComponentProps<typeof Text>["backgroundColor"] {
  switch (color) {
    case "red":
      return "redBright";
    case "blue":
      return "blueBright";
    case "green":
      return "greenBright";
    case "yellow":
      return "yellowBright";
    case "purple":
      return "magentaBright";
    case "orange":
      return "white";
    case "gray":
      return "white";
  }
}

interface GridViewProps {
  state: GameState;
  selectedCarId?: string;
}

const GridView = ({ state, selectedCarId }: GridViewProps) => {
  const grid = buildGridFromState(state);

  return (
    <Box flexDirection="column">
      {grid.map((row, rowIndex) => (
        <Box key={rowIndex} flexDirection="row">
          {row.map((cell, colIndex) => {
            const isSelected = cell && selectedCarId && cell.id === selectedCarId;
            const bg =
              cell && isSelected
                ? highlightColorFor(cell.color)
                : cell
                  ? colorToInk(cell.color)
                  : undefined;
            return (
              <Text key={colIndex} backgroundColor={bg}>
                {"  "}
              </Text>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};

function createFallbackState(): GameState {
  return cloneGameState(createDemoGameState());
}

const App: React.FC = () => {
  const { exit } = useApp();
  const [puzzleIndex, setPuzzleIndex] = React.useState(0);
  const [state, setState] = React.useState<GameState>(() =>
    cloneGameState(PUZZLES[0]?.initialState ?? createFallbackState())
  );
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const selectedCar = state.cars[selectedIndex] ?? state.cars[0] ?? null;
  const solved = isSolved(state);

  useInput((input: string, key: any) => {
    if (input === "q") {
      exit();
      return;
    }

    if (input === "r") {
      const puzzle = PUZZLES[puzzleIndex] ?? PUZZLES[0];
      if (puzzle) {
        setState(cloneGameState(puzzle.initialState));
      }
      setSelectedIndex(0);
      return;
    }

    if (input === "]") {
      const nextIndex = PUZZLES.length === 0 ? 0 : (puzzleIndex + 1) % PUZZLES.length;
      const puzzle = PUZZLES[nextIndex] ?? PUZZLES[0];
      if (puzzle) {
        setPuzzleIndex(nextIndex);
        setState(cloneGameState(puzzle.initialState));
        setSelectedIndex(0);
      }
      return;
    }

    if (input === "[") {
      const nextIndex =
        PUZZLES.length === 0 ? 0 : (puzzleIndex - 1 + PUZZLES.length) % PUZZLES.length;
      const puzzle = PUZZLES[nextIndex] ?? PUZZLES[0];
      if (puzzle) {
        setPuzzleIndex(nextIndex);
        setState(cloneGameState(puzzle.initialState));
        setSelectedIndex(0);
      }
      return;
    }

    if (key.tab) {
      setSelectedIndex((previous: number) => {
        if (state.cars.length === 0) {
          return 0;
        }

        return (previous + 1) % state.cars.length;
      });

      return;
    }

    if (!selectedCar) {
      return;
    }

    let direction: MoveDirection | null = null;

    if (key.leftArrow) {
      direction = "left";
    } else if (key.rightArrow) {
      direction = "right";
    } else if (key.upArrow) {
      direction = "up";
    } else if (key.downArrow) {
      direction = "down";
    }

    if (!direction) {
      return;
    }

    setState((previous: GameState) => {
      try {
        return applyMove(previous, { carId: selectedCar.id, direction: direction as MoveDirection });
      } catch {
        return previous;
      }
    });
  });

  return (
    <Box flexDirection="column">
      <Text>Traffic Jam (Rush Hour)</Text>
      <Text>
        Controls: Tab = next car, arrows = move selected car, r = reset puzzle, [ / ] = previous / next puzzle, q = quit
      </Text>
      {PUZZLES.length > 0 && (
        <Text>
          Puzzle: {PUZZLES[puzzleIndex]?.name ?? "Unknown"} ({puzzleIndex + 1}/{PUZZLES.length})
        </Text>
      )}
      {selectedCar && (
        <Text>
          Selected car: {selectedCar.id} ({selectedCar.color})
        </Text>
      )}
      {solved && (
        <Text color="green">
          Solved! The red car has reached the exit.
        </Text>
      )}
      <Box marginTop={1}>
        <GridView state={state} selectedCarId={selectedCar ? selectedCar.id : undefined} />
      </Box>
    </Box>
  );
};

render(<App />);
