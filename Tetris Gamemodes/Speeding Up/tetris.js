// Canvas setup for the main game board
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// Next Piece Preview Canvas setup
const nextPieceCanvas = document.getElementById("next-piece-canvas");
const nextCtx = nextPieceCanvas.getContext("2d");

// Game variables
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));  
let currentPiece = null;
let nextPiece = null; // Global variable for the upcoming piece
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameOver = false;
let gameInterval = null;  // Track the game interval for consistent speed

let speedIncreaseFactor = 0.98; // 2% faster each cycle
let currentGameClock = GAME_CLOCK;

// Event listeners
const resetButton = document.getElementById("reset-button"); // reset button
resetButton.addEventListener("click", () => {  
  startGame();  
});

// Confetti array to store the falling squares
let confettiArray = [];
let confettiSpawnTime = 0;  // Time when confetti should stop spawning
let tetrisMessageShown = false;  // Flag to control Tetris message visibility
let tetrisMessageStartTime = 0;  // Time when Tetris message should disappear

// DRAWING FUNCTIONS

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

  // Draw the shadow first (gray and translucent)
  drawShadowPiece();

  // Draw the actual piece
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

// Draw the shadow piece
function drawShadowPiece() {
  if (!currentPiece) return;

  // Copy the current piece for simulating the shadow
  const shadowPiece = { ...currentPiece, y: currentPiece.y };
  
  // Move the shadow piece down until it collides with the board
  while (!checkCollisionAt(shadowPiece)) {
    shadowPiece.y++;
  }
  shadowPiece.y--;  // Step back to the last valid position

  // Draw the shadow piece (gray with transparency)
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

// Draw the next piece preview on its canvas
function drawNextPiece() {
  if (!nextPiece) return;
  
  // Clear the next piece canvas
  nextCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
  
  // Optionally, draw a border around the preview area
  nextCtx.strokeStyle = "#000";
  nextCtx.strokeRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
  
  const shape = nextPiece.shape;
  const rows = shape.length;
  const cols = shape[0].length;
  
  // Use the same block size as the main game
  const previewBlockSize = BLOCK_SIDE_LENGTH;
  
  // Center the next piece in the preview canvas
  const offsetX = (nextPieceCanvas.width - cols * previewBlockSize) / 2;
  const offsetY = (nextPieceCanvas.height - rows * previewBlockSize) / 2;
  
  // Draw each block of the next piece
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

// Check collision at a hypothetical piece position
function checkCollisionAt(piece) {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const newX = piece.x + col;
        const newY = piece.y + row;
        if (
          newX < 0 || newX >= COLS || 
          newY >= ROWS || 
          board[newY][newX]
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

// Check collision for the current piece
function checkCollision() {
  return checkCollisionAt(currentPiece);
}

// PIECE GENERATION

// Generate a new piece
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

// Move piece down
function movePieceDown() {
  if (gameOver) return;  // Prevent moving if the game is over
  currentPiece.y++;
  if (checkCollision()) {
    currentPiece.y--;
    placePiece();
    clearLines();
    // Promote the next piece to be the current piece,
    // then generate a new next piece and update the preview
    currentPiece = nextPiece;
    nextPiece = generatePiece();
    drawNextPiece();
    if (checkCollision()) {
      gameOver = true; // End the game if new piece collides on spawn
    }
  }
}

// Drop piece down instantly
function dropPieceDown() {
  if (gameOver) return; 

  while (!checkCollision()) {
    currentPiece.y++;
  }
  currentPiece.y--;

  placePiece();
  clearLines();
  // Promote the next piece and update the preview
  currentPiece = nextPiece;
  nextPiece = generatePiece();
  drawNextPiece();
  if (checkCollision()) {
    gameOver = true;
  }
}

// Place the current piece onto the board
function placePiece() {
  currentPiece.shape.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (cell) {
        board[currentPiece.y + rIdx][currentPiece.x + cIdx] = currentPiece.color;
      }
    });
  });
}

// Clear completed lines and update score
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
    score += 800; // Tetris bonus
    drawScore();
  }
}

// GRID DRAWING

// Draw the grid lines on the canvas
function drawGrid() {
  ctx.beginPath();
  ctx.strokeStyle = '#555'; // Grid line color
  ctx.lineWidth = 1;        // Grid line thickness

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

  // Decrease speed gradually
  currentGameClock = Math.max(100, currentGameClock * speedIncreaseFactor); 

  clearInterval(gameInterval); // Reset interval
  gameInterval = setInterval(gameLoop, currentGameClock); // Restart with new speed
}

  if (tetrisMessageShown && Date.now() - tetrisMessageStartTime < 1000) {
    ctx.fillStyle = 'gold';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Tetris! +800', canvas.width / 2, canvas.height / 2);
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

const switchBtn = document.getElementById('switch-mode-button');
if (switchBtn) {
  switchBtn.addEventListener('click', function() {
    window.location.href = "http://127.0.0.1:5501/Main%20Tetris/index.html";
  });
}

// Rotate function (disables rotation if collision occurs)
function rotatePiece(undo = false) {
  const originalShape = JSON.parse(JSON.stringify(currentPiece.shape));
  currentPiece.shape = currentPiece.shape[0].map((_, idx) =>
    currentPiece.shape.map(row => row[idx]).reverse()
  );
  if (checkCollision()) {
    if (undo) {
      currentPiece.shape = originalShape;
    } else {
      rotatePiece(true); // Undo rotation
    }
  }
}

function startGame() {
  clearInterval(gameInterval); // Stop any previous game loop
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  currentPiece = generatePiece();
  nextPiece = generatePiece();
  drawNextPiece();
  score = 0;
  gameOver = false;
  confettiArray = [];
  confettiSpawnTime = Date.now();
  tetrisMessageShown = false;
  drawScore();

  // Reset game speed when restarting
  currentGameClock = GAME_CLOCK;
  
  // Start the game loop with adjustable speed
  gameInterval = setInterval(gameLoop, currentGameClock);
}
startGame();

// User Input
document.addEventListener("keydown", (event) => {
  if (gameOver) return; // Prevent key actions if game is over

  switch (event.key) {
    case "a": // left (WASD)
    case "A":
    case "ArrowLeft":
      currentPiece.x--;
      if (checkCollision()) currentPiece.x++;
      break;
    case "d": // right (WASD)
    case "D":
    case "ArrowRight":
      currentPiece.x++;
      if (checkCollision()) currentPiece.x--;
      break;
    case "s": // drop (WASD)
    case "S": 
    case "ArrowDown":
      dropPieceDown();
      break;
    case "w": // rotate (WASD)
    case "W":
    case "ArrowUp":
      rotatePiece();
      break;
  }

  drawBoard();
  drawGrid();
  drawPiece();
});