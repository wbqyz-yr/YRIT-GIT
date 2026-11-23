"use strict";

(() => {
  const SIZE = 15; // 15x15 board
  const CELL = 36; // pixels per cell
  const PAD = 18; // padding around the board
  const WIN_LEN = 5;

  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = 2;

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const undoBtn = document.getElementById("undo");
  const restartBtn = document.getElementById("restart");
  const overlayRestartBtn = document.getElementById("overlay-restart");
  const modeBtns = document.querySelectorAll(".mode-btn");

  // Game state
  let board = [];
  let current = BLACK; // who plays next
  let mode = "pvp"; // pvp | ai-black | ai-white
  let history = []; // stack of {x, y, player}
  let winner = 0;
  let winLine = []; // winning cells [{x, y}]
  let aiThinking = false;

  function reset() {
    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
    current = BLACK;
    history = [];
    winner = 0;
    winLine = [];
    aiThinking = false;
    updateUI();
    draw();
    maybeAiMove();
  }

  function inBounds(x, y) {
    return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
  }

  function cellAt(row, col) {
    return board[row][col];
  }

  // Place a stone; returns true on success.
  function place(row, col, player) {
    if (!inBounds(row, col) || cellAt(row, col) !== EMPTY || winner) {
      return false;
    }
    board[row][col] = player;
    history.push({ row, col, player });
    const line = findWin(row, col, player);
    if (line) {
      winner = player;
      winLine = line;
    } else {
      current = player === BLACK ? WHITE : BLACK;
    }
    updateUI();
    draw();
    return true;
  }

  // Directions: horizontal, vertical, two diagonals.
  const DIRS = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  function findWin(row, col, player) {
    for (const [dr, dc] of DIRS) {
      const line = [{ row, col }];
      // extend in one direction
      let r = row + dr;
      let c = col + dc;
      while (inBounds(r, c) && cellAt(r, c) === player) {
        line.push({ row: r, col: c });
        r += dr;
        c += dc;
      }
      // extend in the opposite direction
      r = row - dr;
      c = col - dc;
      while (inBounds(r, c) && cellAt(r, c) === player) {
        line.unshift({ row: r, col: c });
        r -= dr;
        c -= dc;
      }
      if (line.length >= WIN_LEN) {
        return line;
      }
    }
    return null;
  }

  function undo() {
    if (!history.length || aiThinking) return;
    // In AI mode, revert back to the human's turn: pop two moves.
    const steps = isAiTurn() ? 2 : 1;
    for (let i = 0; i < steps && history.length; i++) {
      const last = history.pop();
      board[last.row][last.col] = EMPTY;
    }
    winner = 0;
    winLine = [];
    current = BLACK;
    updateUI();
    draw();
  }

  function isAiTurn() {
    if (mode === "pvp") return false;
    const aiColor = mode === "ai-black" ? BLACK : WHITE;
    return current === aiColor;
  }

  // ---- AI ---------------------------------------------------------

  function opponentOf(player) {
    return player === BLACK ? WHITE : BLACK;
  }

  // Count a run of `player` stones through (row,col) along (dr,dc),
  // returning {count, openEnds} where openEnds is 0..2.
  function runInfo(row, col, dr, dc, player) {
    let count = 1;
    let openEnds = 0;

    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c) && cellAt(r, c) === player) {
      count++;
      r += dr;
      c += dc;
    }
    if (inBounds(r, c) && cellAt(r, c) === EMPTY) openEnds++;

    r = row - dr;
    c = col - dc;
    while (inBounds(r, c) && cellAt(r, c) === player) {
      count++;
      r -= dr;
      c -= dc;
    }
    if (inBounds(r, c) && cellAt(r, c) === EMPTY) openEnds++;

    return { count, openEnds };
  }

  // Heuristic score for placing `player` at (row,col).
  function scoreMove(row, col, player) {
    let total = 0;
    for (const [dr, dc] of DIRS) {
      const { count, openEnds } = runInfo(row, col, dr, dc, player);
      if (count >= WIN_LEN) total += 1_000_000;
      else if (count === 4) total += openEnds === 2 ? 50_000 : 5_000;
      else if (count === 3) total += openEnds === 2 ? 3_000 : 300;
      else if (count === 2) total += openEnds === 2 ? 200 : 20;
      else if (count === 1) total += 1;
    }
    return total;
  }

  function emptyCells() {
    const cells = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (cellAt(r, c) === EMPTY) cells.push({ row: r, col: c });
      }
    }
    return cells;
  }

  function aiMove() {
    const ai = current;
    const human = opponentOf(ai);
    let best = null;
    let bestScore = -Infinity;

    for (const { row, col } of emptyCells()) {
      const attack = scoreMove(row, col, ai);
      const defense = scoreMove(row, col, human);
      // Weight defense slightly higher to prioritize blocking.
      const score = attack * 1.0 + defense * 1.1;
      if (score > bestScore) {
        bestScore = score;
        best = { row, col };
      }
    }
    if (best) {
      place(best.row, best.col, ai);
    }
  }

  function maybeAiMove() {
    if (winner || mode === "pvp" || !isAiTurn()) return;
    aiThinking = true;
    updateUI();
    // Defer so the board repaints before the AI "thinks".
    setTimeout(() => {
      aiMove();
      aiThinking = false;
      updateUI();
    }, 120);
  }

  // ---- Rendering ---------------------------------------------------

  function draw() {
    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = "#d7a862";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "#5b4320";
    ctx.lineWidth = 1;
    for (let i = 0; i < SIZE; i++) {
      const p = PAD + i * CELL;
      ctx.beginPath();
      ctx.moveTo(PAD, p);
      ctx.lineTo(PAD + (SIZE - 1) * CELL, p);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p, PAD);
      ctx.lineTo(p, PAD + (SIZE - 1) * CELL);
      ctx.stroke();
    }

    // Star points (5 standard points on a 15x15 board)
    const stars = [
      [3, 3],
      [3, 11],
      [11, 3],
      [11, 11],
      [7, 7],
    ];
    ctx.fillStyle = "#5b4320";
    for (const [r, c] of stars) {
      ctx.beginPath();
      ctx.arc(PAD + c * CELL, PAD + r * CELL, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stones
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = cellAt(r, c);
        if (v === EMPTY) continue;
        drawStone(PAD + c * CELL, PAD + r * CELL, v);
      }
    }

    // Win line highlight
    if (winLine.length) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      winLine.forEach(({ row, col }, i) => {
        const x = PAD + col * CELL;
        const y = PAD + row * CELL;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }

  function drawStone(x, y, player) {
    ctx.save();
    // Drop shadow
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    const grad = ctx.createRadialGradient(x - 4, y - 5, 2, x, y, CELL / 2 - 2);
    if (player === BLACK) {
      grad.addColorStop(0, "#3b3b3b");
      grad.addColorStop(1, "#0a0a0a");
    } else {
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(1, "#cfcfcf");
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, CELL / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function updateUI() {
    const statuses = {
      pvp: current === BLACK ? "黑方落子" : "白方落子",
      "ai-black":
        current === BLACK ? "电脑思考中…" : "轮到你（白方）落子",
      "ai-white":
        current === WHITE ? "电脑思考中…" : "轮到你（黑方）落子",
    };

    if (winner) {
      const name = winner === BLACK ? "黑方" : "白方";
      statusEl.textContent = `${name}获胜`;
      statusEl.className = "status";
      overlayTitle.textContent = `${name}获胜`;
      overlay.hidden = false;
    } else if (isDraw()) {
      statusEl.textContent = "平局";
      statusEl.className = "status";
      overlayTitle.textContent = "平局";
      overlay.hidden = false;
    } else {
      statusEl.textContent = statuses[mode];
      statusEl.className = "status " + (current === BLACK ? "black-turn" : "white-turn");
      overlay.hidden = true;
    }

    undoBtn.disabled = history.length === 0 || aiThinking || winner !== 0;
  }

  function isDraw() {
    return !winner && history.length === SIZE * SIZE;
  }

  // ---- Input -------------------------------------------------------

  function toCell(evt) {
    const rect = canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    // Scale for the displayed (possibly CSS-scaled) canvas.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const col = Math.round((x * scaleX - PAD) / CELL);
    const row = Math.round((y * scaleY - PAD) / CELL);
    if (!inBounds(row, col)) return null;
    return { row, col };
  }

  function onClick(evt) {
    if (aiThinking || winner) return;
    const cell = toCell(evt);
    if (!cell) return;
    if (mode !== "pvp" && isAiTurn()) return;
    const placed = place(cell.row, cell.col, current);
    if (placed) maybeAiMove();
  }

  function setMode(next) {
    mode = next;
    modeBtns.forEach((b) =>
      b.classList.toggle("active", b.dataset.mode === next)
    );
    reset();
  }

  // ---- Wire up -----------------------------------------------------

  canvas.addEventListener("click", onClick);
  restartBtn.addEventListener("click", reset);
  overlayRestartBtn.addEventListener("click", reset);
  undoBtn.addEventListener("click", undo);
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => setMode(b.dataset.mode))
  );

  // Test/introspection hook (unused in normal play).
  if (typeof window !== "undefined") {
    window.__gomoku = {
      SIZE,
      board: () => board,
      current: () => current,
      winner: () => winner,
      winLine: () => winLine,
      place,
      findWin,
      runInfo,
      scoreMove,
      aiMove,
      undo,
      reset,
      setMode,
      emptyCells,
    };
  }

  reset();
})();
