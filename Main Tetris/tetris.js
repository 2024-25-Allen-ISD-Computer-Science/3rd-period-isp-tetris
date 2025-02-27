// Canvas setup
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// Next Piece Preview Canvas setup
const nextPieceCanvas = document.getElementById("next-piece-canvas");
const nextCtx = nextPieceCanvas.getContext("2d");

// Game variables
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let currentPiece = null;
let nextPiece = null; // Next piece preview variable
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameOver = false;
let gameInterval = null;  // Track the game interval for consistent speed

// Event listeners
const resetButton = document.getElementById("reset-button"); // reset button
resetButton.addEventListener("click", () => {
  // Close the dropdown and overlay (if open)
  const buttonDropdown = document.getElementById("button-dropdown");
  const overlay = document.getElementById("overlay");
  buttonDropdown.classList.remove("active");
  overlay.classList.remove("active");
  startGame();
});

// Confetti array and related variables
let confettiArray = [];
let confettiSpawnTime = 0;  // Time when confetti should stop spawning
let tetrisMessageShown = false;  // Flag to control Tetris message visibility
let tetrisMessageStartTime = 0;  // Time when Tetris message should disappear

// Draw the game board
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

// Draw the current piece and its shadow
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

// Draw the shadow piece (translucent gray)
function drawShadowPiece() {
  if (!currentPiece) return;
  const shadowPiece = { ...currentPiece, y: currentPiece.y };
  while (!checkCollisionAt(shadowPiece)) {
    shadowPiece.y++;
  }
  shadowPiece.y--;  // Last valid position
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

// Draw the next piece preview
function drawNextPiece() {
  if (!nextPiece) return;
  nextCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
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

// COLLISION CHECK

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

// PIECE GENERATION

function generatePiece() {
  const idx = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[idx],
    color: COLORS[idx],
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[idx][0].length / 2),
    y: 0
  };
}

// PIECE PLACEMENT AND LINES

function movePieceDown() {
  if (gameOver) return;
  currentPiece.y++;
  if (checkCollision()) {
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

// GRID DRAWING

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

// SCORE AND MESSAGES

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

// GAME LOOP AND CONFETTI

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
  drawNextPiece();
  if (tetrisMessageShown && Date.now() - tetrisMessageStartTime < 1000) {
    ctx.fillStyle = 'gold';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Tetris! +800', canvas.width / 2, canvas.height / 2);
  }
}

// UPDATED startGame FUNCTION FOR FASTER RESET
function startGame() {
  clearInterval(gameInterval);
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  currentPiece = generatePiece();
  nextPiece = generatePiece();
  // Immediately redraw the board and grid to clear out old blocks quickly:
  drawBoard();
  drawGrid();
  drawNextPiece();
  score = 0;
  gameOver = false;
  confettiArray = [];
  confettiSpawnTime = Date.now();
  tetrisMessageShown = false;
  drawScore();
  gameInterval = setInterval(gameLoop, GAME_CLOCK);
}

// Trigger the start of the game
startGame();

// User Input
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

// Rotate function with collision check
function rotatePiece() {
  const rotatedShape = currentPiece.shape[0].map((_, idx) =>
    currentPiece.shape.map(row => row[idx]).reverse()
  );
  const testPiece = { ...currentPiece, shape: rotatedShape };
  if (checkCollisionAt(testPiece)) {
    return;
  } else {
    currentPiece.shape = rotatedShape;
  }
}

// Confetti logic
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

// Crazy Blocks Button
const switchBtn = document.getElementById('switch-mode-button');
if (switchBtn) {
  switchBtn.addEventListener('click', function() {
    window.location.href = "http://127.0.0.1:5502/Block%20Blast/index.html";
  });
}

// Gear Button and Dropdown Logic
const gearButton = document.getElementById("gear-button");
const buttonDropdown = document.getElementById("button-dropdown");
gearButton.style.fontSize = "70px";
gearButton.addEventListener("click", function (event) {
  event.stopPropagation();
  gearButton.classList.add("spin");
  setTimeout(() => {
    gearButton.classList.remove("spin");
    buttonDropdown.classList.toggle("active");
  }, 500);
});
document.addEventListener("click", function(event) {
  if (!gearButton.contains(event.target) && !buttonDropdown.contains(event.target)) {
    buttonDropdown.classList.remove("active");
  }
});