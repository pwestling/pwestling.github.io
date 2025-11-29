import type { Car, Color, Orientation } from "./grid.ts";
import type { GameState } from "./game.ts";

interface RawPuzzle {
  moves: number;
  board: string;
  index: number;
}

const INPUT_PATH = Bun.argv[2] ?? "rush1000.txt";
const OUTPUT_PATH = Bun.argv[3] ?? "puzzles.ts";

const DEFAULT_MIN_MOVES = 4;
const DEFAULT_MAX_MOVES = 10;
const DEFAULT_TARGET_COUNT = 40;

let minMoves = DEFAULT_MIN_MOVES;
let maxMoves = DEFAULT_MAX_MOVES;
let targetCount = DEFAULT_TARGET_COUNT;

const argMinMoves = Bun.argv[4];
const argMaxMoves = Bun.argv[5];
const argTargetCount = Bun.argv[6];

if (argMinMoves !== undefined) {
  const parsed = Number.parseInt(argMinMoves, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    minMoves = parsed;
  }
}

if (argMaxMoves !== undefined) {
  const parsed = Number.parseInt(argMaxMoves, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    maxMoves = parsed;
  }
}

if (minMoves > maxMoves) {
  const tmp = minMoves;
  minMoves = maxMoves;
  maxMoves = tmp;
}

if (argTargetCount !== undefined) {
  const parsed = Number.parseInt(argTargetCount, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    targetCount = parsed;
  }
}

async function main(): Promise<void> {
  const file = Bun.file(INPUT_PATH);
  if (!(await file.exists())) {
    console.error(`Input file not found: ${INPUT_PATH}`);
    console.error("Place rush1000.txt from https://www.michaelfogleman.com/rush/ in the project root.");
    process.exit(1);
  }

  const text = await file.text();
  const rawPuzzles: RawPuzzle[] = [];

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
      continue;
    }

    const moves = Number.parseInt(parts[0] ?? "", 10);
    const board = parts[1] ?? "";

    if (!Number.isFinite(moves) || board.length !== 36) {
      continue;
    }

    if (board.includes("x")) {
      continue;
    }

    if (moves < minMoves || moves > maxMoves) {
      continue;
    }

    rawPuzzles.push({ moves, board, index });
  }

  rawPuzzles.sort((a, b) => {
    if (a.moves !== b.moves) {
      return a.moves - b.moves;
    }

    return a.index - b.index;
  });

  const selected = pickRandomSubset(rawPuzzles, targetCount);

  if (selected.length === 0) {
    console.warn(
      `No puzzles found in ${INPUT_PATH} with between ${minMoves} and ${maxMoves} moves (and no walls).`
    );
  } else if (selected.length < targetCount) {
    console.warn(
      `Only ${selected.length} puzzles found with between ${minMoves} and ${maxMoves} moves (and no walls).`
    );
  }

  const gameStates = selected.map((entry, i) => ({
    raw: entry,
    state: boardToGameState(entry, i + 1)
  }));

  const output = renderPuzzlesModule(gameStates);
  await Bun.write(OUTPUT_PATH, output);

  console.log(
    `Wrote ${gameStates.length} puzzle(s) to ${OUTPUT_PATH} from ${INPUT_PATH} (moves ${minMoves}-${maxMoves}, random selection).`
  );
}

function pickRandomSubset<T>(items: T[], count: number): T[] {
  if (items.length <= count) {
    return items.slice();
  }

  const copy = items.slice();

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }

  return copy.slice(0, count);
}

function boardToGameState(entry: RawPuzzle, puzzleId: number): GameState {
  const width = 6;
  const height = 6;
  const board = entry.board;

  type Position = { row: number; col: number };

  const positionsById = new Map<string, Position[]>();

  for (let i = 0; i < board.length; i += 1) {
    const ch = board[i] ?? "";
    const row = Math.floor(i / width);
    const col = i % width;

    if (ch === "o" || ch === "x") {
      continue;
    }

    let list = positionsById.get(ch);
    if (!list) {
      list = [];
      positionsById.set(ch, list);
    }

    list.push({ row, col });
  }

  const cars: Car[] = [];

  const palette: Color[] = ["blue", "green", "yellow", "purple", "orange", "gray"];

  const letterToColor = (letter: string): Color => {
    if (letter === "A") {
      return "red";
    }

    const index = letter.charCodeAt(0) - "B".charCodeAt(0);
    const paletteIndex = ((index % palette.length) + palette.length) % palette.length;

    return palette[paletteIndex]!;
  };

  let exitRow = 2;

  for (const [letter, positions] of positionsById.entries()) {
    if (positions.length < 2) {
      throw new Error(`Puzzle ${puzzleId}: piece ${letter} has fewer than 2 cells.`);
    }

    positions.sort((a, b) => {
      if (a.row !== b.row) {
        return a.row - b.row;
      }

      return a.col - b.col;
    });

    const first = positions[0]!;
    const second = positions[1]!;

    const orientation: Orientation =
      second.row === first.row ? "horizontal" : "vertical";

    const length = positions.length;

    const car: Car = {
      id: letter,
      color: letterToColor(letter),
      length,
      orientation,
      row: first.row,
      col: first.col
    };

    cars.push(car);

    if (letter === "A") {
      exitRow = car.row;
    }
  }

  return {
    width,
    height,
    exitRow,
    exitCol: width - 1,
    cars
  };
}

function renderPuzzlesModule(entries: { raw: RawPuzzle; state: GameState }[]): string {
  const lines: string[] = [];

  lines.push("// This file is generated by generate-puzzles-from-rush.ts.");
  lines.push("// Source data: rush1000.txt from https://www.michaelfogleman.com/rush/");
  lines.push("");
  lines.push('import type { GameState } from "./game.ts";');
  lines.push("");
  lines.push("export interface Puzzle {");
  lines.push("  id: number;");
  lines.push("  name: string;");
  lines.push("  moves: number;");
  lines.push("  initialState: GameState;");
  lines.push("}");
  lines.push("");
  lines.push("export const PUZZLES: Puzzle[] = [");

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i]!;
    const puzzleId = i + 1;

    lines.push("  {");
    lines.push(`    id: ${puzzleId},`);
    lines.push(`    name: "Puzzle ${puzzleId}",`);
    lines.push(`    moves: ${entry.raw.moves},`);
    lines.push(`    initialState: ${serializeGameState(entry.state)},`);
    lines.push("  },");
  }

  lines.push("];");
  lines.push("");

  return lines.join("\n");
}

function serializeGameState(state: GameState): string {
  const cars = state.cars
    .map(
      (car) =>
        `{ id: ${JSON.stringify(car.id)}, color: ${JSON.stringify(
          car.color
        )}, length: ${car.length}, orientation: ${JSON.stringify(
          car.orientation
        )}, row: ${car.row}, col: ${car.col} }`
    )
    .join(", ");

  return `{ width: ${state.width}, height: ${state.height}, exitRow: ${state.exitRow}, exitCol: ${
    state.exitCol
  }, cars: [${cars}] }`;
}

void main();
