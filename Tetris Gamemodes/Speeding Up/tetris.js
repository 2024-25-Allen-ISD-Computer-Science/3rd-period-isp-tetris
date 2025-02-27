// ===========================
// Canvas Setup
// ===========================
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const nextPieceCanvas = document.getElementById("next-piece-canvas");
const nextCtx = nextPieceCanvas.getContext("2d");

// ===========================
// Game Variables & Speed Control
// ===========================
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let currentPiece = null;
let nextPiece = null; // Global variable for the upcoming piece
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameOver = false;
let gameInterval = null;  // Interval ID for the game loop

// Speed control variables: currentGameClock starts at GAME_CLOCK and decreases by 2% each cycle
let speedIncreaseFactor = 0.98; // Multiply game clock by 0.98 each cycle (2% faster)
let currentGameClock = GAME_CLOCK;

// ===========================
// Event Listeners
// ===========================
const resetButton = document.getElementById("reset-button");
resetButton.addEventListener("click", () => {
  // Close dropdown and overlay if open before resetting
  const buttonDropdown = document.getElementById("button-dropdown");
  const overlay = document.getElementById("overlay");
  buttonDropdown.classList.remove("active");
  overlay.classList.remove("active");
  startGame();
});

// ===========================
// Confetti Variables
// ===========================
let confettiArray = [];
let confettiSpawnTime = 0;
let tetrisMessageShown = false;
let tetrisMessageStartTime = 0;

// ===========================
// DRAWING FUNCTIONS
// ===========================

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const color = board[row][col];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(
          col * BLOCK_SIDE_LENGTH,
          row * BLOCK_SIDE_LENGTH,
          BLOCK_SIDE_LENGTH,
          BLOCK_SIDE_LENGTH
        );
      }
    }
  }
}

function drawPiece() {
  if (!currentPiece) return;
  drawShadowPiece();
  currentPiece.shape.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (cell) {
        ctx.fillStyle = currentPiece.color;
        ctx.fillRect(
          (currentPiece.x + cIdx) * BLOCK_SIDE_LENGTH,
          (currentPiece.y + rIdx) * BLOCK_SIDE_LENGTH,
          BLOCK_SIDE_LENGTH,
          BLOCK_SIDE_LENGTH
        );
      }
    });
  });
}

function drawShadowPiece() {
  if (!currentPiece) return;
  const shadowPiece = { ...currentPiece, y: currentPiece.y };
  while (!checkCollisionAt(shadowPiece)) {
    shadowPiece.y++;
  }
  shadowPiece.y--; // Step back to the last valid position
  shadowPiece.shape.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (cell) {
        ctx.fillStyle = 'rgba(169, 169, 169, 0.5)';
        ctx.fillRect(
          (shadowPiece.x + cIdx) * BLOCK_SIDE_LENGTH,
          (shadowPiece.y + rIdx) * BLOCK_SIDE_LENGTH,
          BLOCK_SIDE_LENGTH,
          BLOCK_SIDE_LENGTH
        );
      }
    });
  });
}

function drawNextPiece() {
  if (!nextPiece) return;
  nextCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
  
  // Optional border for preview
  nextCtx.strokeStyle = "#000";
  nextCtx.strokeRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
  
  const shape = nextPiece.shape;
  const rows = shape.length;
  const cols = shape[0].length;
  const previewBlockSize = BLOCK_SIDE_LENGTH;
  const offsetX = (nextPieceCanvas.width - cols * previewBlockSize) / 2;
  const offsetY = (nextPieceCanvas.height - rows * previewBlockSize) / 2;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shape[r][c]) {
        nextCtx.fillStyle = nextPiece.color;
        nextCtx.fillRect(
          offsetX + c * previewBlockSize,
          offsetY + r * previewBlockSize,
          previewBlockSize,
          previewBlockSize
        );
      }
    }
  }
}

// ===========================
// COLLISION CHECK FUNCTIONS
// ===========================

function checkCollisionAt(piece) {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const newX = piece.x + col;
        const newY = piece.y + row;
        if (newX < 0 || newX >= COLS || newY >= ROWS || board[newY][newX]) {
          return true;
        }
      }
    }
  }
  return false;
}

function checkCollision() {
  return checkCollisionAt(currentPiece);
}

// ===========================
// PIECE GENERATION
// ===========================

function generatePiece() {
  const idx = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[idx],
    color: COLORS[idx],
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[idx][0].length / 2),
    y: 0
  };
}

// ===========================
// PIECE PLACEMENT & LINE CLEARING
// ===========================

function movePieceDown() {
  if (gameOver) return;
  currentPiece.y++;
  if (checkCollision()) {
    currentPiece.y--;
    placePiece();
    clearLines();
    // Promote next piece
    currentPiece = nextPiece;
    nextPiece = generatePiece();
    drawNextPiece();
    if (checkCollision()) {
      gameOver = true;
    }
  }
}

function dropPieceDown() {
  if (gameOver) return;
  while (!checkCollision()) {
    currentPiece.y++;
  }
  currentPiece.y--;
  placePiece();
  clearLines();
  currentPiece = nextPiece;
  nextPiece = generatePiece();
  drawNextPiece();
  if (checkCollision()) {
    gameOver = true;
  }
}

function placePiece() {
  currentPiece.shape.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (cell) {
        board[currentPiece.y + rIdx][currentPiece.x + cIdx] = currentPiece.color;
      }
    });
  });
}

function clearLines() {
  let linesCleared = 0;
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every(cell => cell)) {
      board.splice(row, 1);
      board.unshift(Array(COLS).fill(null));
      score += SCORE_WORTH;
      linesCleared++;
      row++;
    }
  }
  if (linesCleared === 4) {
    launchConfetti();
    showTetrisMessage();
    score += 800;
    drawScore();
  }
}

// ===========================
// GRID DRAWING
// ===========================

function drawGrid() {
  ctx.beginPath();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  for (let col = 0; col <= COLS; col++) {
    ctx.moveTo(col * BLOCK_SIDE_LENGTH, 0);
    ctx.lineTo(col * BLOCK_SIDE_LENGTH, ROWS * BLOCK_SIDE_LENGTH);
  }
  for (let row = 0; row <= ROWS; row++) {
    ctx.moveTo(0, row * BLOCK_SIDE_LENGTH);
    ctx.lineTo(COLS * BLOCK_SIDE_LENGTH, row * BLOCK_SIDE_LENGTH);
  }
  ctx.stroke();
}

// ===========================
// SCORE & MESSAGES
// ===========================

function showTetrisMessage() {
  if (!tetrisMessageShown) {
    tetrisMessageStartTime = Date.now();
    tetrisMessageShown = true;
  }
}

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
  }
}

function drawScore() {
  document.getElementById("score").innerText = "Score: " + score;
  document.getElementById("high-score").innerText = "High Score: " + highScore;
}

// ===========================
// GAME LOOP & CONFETTI
// ===========================

function gameLoop() {
  if (gameOver) {
    clearInterval(gameInterval);
    updateHighScore();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  movePieceDown();
  drawBoard();
  drawGrid();
  drawPiece();
  drawScore();
  updateConfetti();

  if (tetrisMessageShown && Date.now() - tetrisMessageStartTime < 1000) {
    ctx.fillStyle = 'gold';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Tetris! +800', canvas.width / 2, canvas.height / 2);
  }

  // Gradually decrease the game loop interval for faster piece movement
  currentGameClock = Math.max(100, currentGameClock * speedIncreaseFactor);
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, currentGameClock);
}

function launchConfetti() {
  confettiSpawnTime = Date.now();
  const confettiCount = 75;
  for (let i = 0; i < confettiCount; i++) {
    const width = Math.random() * 8 + 5;
    const height = Math.random() * 8 + 5;
    const confettiPiece = {
      x: Math.random() * (canvas.width - width),
      y: Math.random() * (canvas.height / 2) + (canvas.height / 4),
      width: width,
      height: height,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`,
      speedY: Math.random() * 4 + 4,
      speedX: Math.random() * 3 - 1.5,
      startTime: Date.now()
    };
    confettiArray.push(confettiPiece);
  }
}

function updateConfetti() {
  const now = Date.now();
  confettiArray = confettiArray.filter(piece => now - piece.startTime < 2000);
  for (let i = 0; i < confettiArray.length; i++) {
    const piece = confettiArray[i];
    piece.y += piece.speedY;
    piece.x += piece.speedX;
    ctx.fillStyle = piece.color;
    ctx.fillRect(piece.x, piece.y, piece.width, piece.height);
  }
}

// ===========================
// OTHER BUTTONS & INPUT
// ===========================
const switchBtn = document.getElementById('switch-mode-button');
if (switchBtn) {
  switchBtn.addEventListener('click', function() {
    window.location.href = "http://127.0.0.1:5502/Main%20Tetris/index.html";
  });
}

// Rotate function (with collision check and undo if necessary)
function rotatePiece(undo = false) {
  const originalShape = JSON.parse(JSON.stringify(currentPiece.shape));
  currentPiece.shape = currentPiece.shape[0].map((_, idx) =>
    currentPiece.shape.map(row => row[idx]).reverse()
  );
  if (checkCollision()) {
    if (undo) {
      currentPiece.shape = originalShape;
    } else {
      rotatePiece(true); // Undo rotation if collision
    }
  }
}

// ===========================
// GAME INITIALIZATION
// ===========================

function startGame() {
  clearInterval(gameInterval);
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  currentPiece = generatePiece();
  nextPiece = generatePiece();
  // Quick visual reset: immediately redraw board, grid, and next piece preview
  drawBoard();
  drawGrid();
  drawNextPiece();
  score = 0;
  gameOver = false;
  confettiArray = [];
  confettiSpawnTime = Date.now();
  tetrisMessageShown = false;
  drawScore();
  
  // Reset game speed
  currentGameClock = GAME_CLOCK;
  gameInterval = setInterval(gameLoop, currentGameClock);
}

startGame();

// ===========================
// USER INPUT
// ===========================
document.addEventListener("keydown", (event) => {
  if (gameOver) return;

  switch (event.key) {
    case "a":
    case "A":
    case "ArrowLeft":
      currentPiece.x--;
      if (checkCollision()) currentPiece.x++;
      break;
    case "d":
    case "D":
    case "ArrowRight":
      currentPiece.x++;
      if (checkCollision()) currentPiece.x--;
      break;
    case "s":
    case "S":
    case "ArrowDown":
      dropPieceDown();
      break;
    case "w":
    case "W":
    case "ArrowUp":
      rotatePiece();
      break;
  }

  drawBoard();
  drawGrid();
  drawPiece();
});

// ===========================
// GEAR BUTTON & DROPDOWN LOGIC
// ===========================
const gearButton = document.getElementById("gear-button");
const buttonDropdown = document.getElementById("button-dropdown");
const overlay = document.getElementById("overlay");
gearButton.style.fontSize = "70px";
gearButton.addEventListener("click", function (event) {
  event.stopPropagation();
  gearButton.classList.add("spin");
  setTimeout(() => {
    gearButton.classList.remove("spin");
    buttonDropdown.classList.toggle("active");
    overlay.classList.toggle("active");
  }, 500);
});
document.addEventListener("click", function(event) {
  if (!gearButton.contains(event.target) && !buttonDropdown.contains(event.target)) {
    buttonDropdown.classList.remove("active");
    overlay.classList.remove("active");
  }
});