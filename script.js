
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const SIZE = 30;

const COLORS = [
  "#00ffff",
  "#ffff00",
  "#bb44ff",
  "#4488ff",
  "#ff9900",
  "#00ff88",
  "#ff3366"
];

const SHAPES = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]]
];

let board;
let piece;
let nextPiece;
let score;
let lines;
let level;
let running = false;
let paused = false;
let lastTime = 0;
let dropCounter = 0;

function randomPiece() {
  const i = Math.floor(Math.random() * SHAPES.length);

  return {
    shape: SHAPES[i].map(row => [...row]),
    color: COLORS[i],
    x: 3,
    y: 0
  };
}

function resetGame() {
  board = Array.from(
    { length: ROWS },
    () => Array(COLS).fill(null)
  );

  score = 0;
  lines = 0;
  level = 1;

  piece = randomPiece();
  nextPiece = randomPiece();

  running = true;
  paused = false;

  document.getElementById("overlay").classList.add("hidden");
  document.getElementById("gameStatus").textContent = "PLAYING";

  updateInfo();
  draw();
}

function drawCell(context, x, y, color, size = SIZE) {
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 12;

  context.fillRect(
    x * size + 1,
    y * size + 1,
    size - 2,
    size - 2
  );

  context.shadowBlur = 0;

  context.strokeStyle = "#ffffff88";
  context.lineWidth = 1;
  context.strokeRect(
    x * size + 2,
    y * size + 2,
    size - 4,
    size - 4
  );
}

function drawGrid() {
  ctx.strokeStyle = "#00ffff18";
  ctx.lineWidth = 1;

  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * SIZE, 0);
    ctx.lineTo(x * SIZE, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * SIZE);
    ctx.lineTo(canvas.width, y * SIZE);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#080817";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();

  board.forEach((row, y) => {
    row.forEach((color, x) => {
      if (color) drawCell(ctx, x, y, color);
    });
  });

  if (piece) {
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          drawCell(
            ctx,
            piece.x + x,
            piece.y + y,
            piece.color
          );
        }
      });
    });
  }

  drawNext();
}

function drawNext() {
  nextCtx.clearRect(0, 0, 120, 120);
  nextCtx.fillStyle = "#080817";
  nextCtx.fillRect(0, 0, 120, 120);

  const shape = nextPiece.shape;
  const size = 24;

  const offsetX =
    (120 - shape[0].length * size) / 2;

  const offsetY =
    (120 - shape.length * size) / 2;

  shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;

      nextCtx.fillStyle = nextPiece.color;
      nextCtx.shadowColor = nextPiece.color;
      nextCtx.shadowBlur = 12;

      nextCtx.fillRect(
        offsetX + x * size + 1,
        offsetY + y * size + 1,
        size - 2,
        size - 2
      );
    });
  });

  nextCtx.shadowBlur = 0;
}

function collision(dx, dy, shape = piece.shape) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;

      const nx = piece.x + x + dx;
      const ny = piece.y + y + dy;

      if (nx < 0 || nx >= COLS || ny >= ROWS) {
        return true;
      }

      if (ny >= 0 && board[ny][nx]) {
        return true;
      }
    }
  }

  return false;
}

function move(dx, dy) {
  if (!running || paused) return;

  if (!collision(dx, dy)) {
    piece.x += dx;
    piece.y += dy;
    draw();
    return true;
  }

  return false;
}

function rotate() {
  if (!running || paused) return;

  const rotated = piece.shape[0].map((_, i) =>
    piece.shape.map(row => row[i]).reverse()
  );

  if (!collision(0, 0, rotated)) {
    piece.shape = rotated;
  }

  draw();
}

function lockPiece() {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        const py = piece.y + y;
        const px = piece.x + x;

        if (py >= 0) {
          board[py][px] = piece.color;
        }
      }
    });
  });

  clearLines();

  piece = nextPiece;
  nextPiece = randomPiece();

  if (collision(0, 0)) {
    gameOver();
  }

  draw();
}

function clearLines() {
  let cleared = 0;

  board = board.filter(row => {
    if (row.every(cell => cell !== null)) {
      cleared++;
      return false;
    }

    return true;
  });

  for (let i = 0; i < cleared; i++) {
    board.unshift(Array(COLS).fill(null));
  }

  const points = [0, 100, 300, 500, 800];

  score += points[cleared] * level;
  lines += cleared;
  level = Math.floor(lines / 10) + 1;

  updateInfo();
}

function updateInfo() {
  document.getElementById("score").textContent =
    String(score).padStart(6, "0");

  document.getElementById("level").textContent =
    String(level).padStart(2, "0");

  document.getElementById("lines").textContent =
    String(lines).padStart(2, "0");
}

function hardDrop() {
  if (!running || paused) return;

  let distance = 0;

  while (!collision(0, 1)) {
    piece.y++;
    distance++;
  }

  score += distance * 2;
  updateInfo();

  lockPiece();
}

function gameOver() {
  running = false;

  document.getElementById("gameStatus").textContent =
    "GAME OVER";

  document.getElementById("overlayTitle").textContent =
    "GAME OVER";

  document.getElementById("overlayText").textContent =
    "FINAL SCORE: " + score;

  document.getElementById("startBtn").textContent =
    "PLAY AGAIN";

  document.getElementById("overlay").classList.remove("hidden");
}

function togglePause() {
  if (!running) return;

  paused = !paused;

  document.getElementById("gameStatus").textContent =
    paused ? "PAUSED" : "PLAYING";

  document.getElementById("pauseBtn").textContent =
    paused ? "RESUME" : "PAUSE";

  if (paused) {
    document.getElementById("overlayTitle").textContent =
      "PAUSED";

    document.getElementById("overlayText").textContent =
      "TAKE A BREATH";

    document.getElementById("startBtn").textContent =
      "RESUME";

    document.getElementById("overlay").classList.remove("hidden");
  } else {
    document.getElementById("overlay").classList.add("hidden");
  }
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  if (running && !paused) {
    dropCounter += delta;

    const speed = Math.max(80, 600 - (level - 1) * 50);

    if (dropCounter > speed) {
      if (!move(0, 1)) {
        lockPiece();
      }

      dropCounter = 0;
    }
  }

  requestAnimationFrame(update);
}

// キーボード操作
document.addEventListener("keydown", e => {
  if (
    ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "]
      .includes(e.key)
  ) {
    e.preventDefault();
  }

  if (e.key.toLowerCase() === "p") {
    togglePause();
    return;
  }

  if (!running || paused) return;

  switch (e.key) {
    case "ArrowLeft":
      move(-1, 0);
      break;

    case "ArrowRight":
      move(1, 0);
      break;

    case "ArrowDown":
      if (move(0, 1)) {
        score++;
        updateInfo();
      }
      break;

    case "ArrowUp":
      rotate();
      break;

    case " ":
      hardDrop();
      break;
  }
});

// スマホ操作
document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;

    switch (action) {
      case "left":
        move(-1, 0);
        break;

      case "right":
        move(1, 0);
        break;

      case "down":
        if (move(0, 1)) {
          score++;
          updateInfo();
        }
        break;

      case "rotate":
        rotate();
        break;

      case "drop":
        hardDrop();
        break;
    }
  });
});

// ボタン
document.getElementById("startBtn").addEventListener("click", () => {
  if (paused) {
    togglePause();
  } else {
    resetGame();
  }
});

document.getElementById("pauseBtn").addEventListener("click", togglePause);
document.getElementById("restartBtn").addEventListener("click", resetGame);

// 初期表示
board = Array.from(
  { length: ROWS },
  () => Array(COLS).fill(null)
);

piece = randomPiece();
nextPiece = randomPiece();

draw();
requestAnimationFrame(update);
