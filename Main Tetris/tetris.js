const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));  
let currentPiece = null;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameOver = false;
let gameInterval = null;  // Track the game interval for consistent speed

const resetButton = document.getElementById("reset-button"); // reset button
resetButton.addEventListener("click", () => {  
  startGame();  
});

// Confetti array to store the falling squares
let confettiArray = [];
let confettiSpawnTime = 0;  // Time when confetti should stop spawning
let tetrisMessageShown = false;  // Flag to control Tetris message visibility
let tetrisMessageStartTime = 0;  // Time when Tetris message should disappear

// Draw the game board
function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);  
  
  // Draw the grid
  drawGrid();
  
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const color = board[row][col];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(col * BLOCK_SIDE_LENGTH, row * BLOCK_SIDE_LENGTH, BLOCK_SIDE_LENGTH, BLOCK_SIDE_LENGTH);
      }
    }
  }
}

// Draw the grid lines
function drawGrid() {
  ctx.beginPath();
  ctx.strokeStyle = '#ddd'; // Light gray color for the grid lines
  ctx.lineWidth = 1;

  // Draw vertical lines
  for (let col = 0; col <= COLS; col++) {
    ctx.moveTo(col * BLOCK_SIDE_LENGTH, 0);
    ctx.lineTo(col * BLOCK_SIDE_LENGTH, canvas.height);
  }

  // Draw horizontal lines
  for (let row = 0; row <= ROWS; row++) {
    ctx.moveTo(0, row * BLOCK_SIDE_LENGTH);
    ctx.lineTo(canvas.width, row * BLOCK_SIDE_LENGTH);
  }

  ctx.stroke();
}

function drawPiece() {
  if (!currentPiece) return;

  // Draw the shadow first (gray and translucent)
  drawShadowPiece();

  // Draw the actual piece
  currentPiece.shape.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (cell) {
        ctx.fillStyle = currentPiece.color;
        ctx.fillRect((currentPiece.x + cIdx) * BLOCK_SIDE_LENGTH, (currentPiece.y + rIdx) * BLOCK_SIDE_LENGTH, BLOCK_SIDE_LENGTH, BLOCK_SIDE_LENGTH);
      }
    });
  });
}

function drawShadowPiece() {
  if (!currentPiece) return;

  // Copy the current piece to simulate the shadow piece
  const shadowPiece = { ...currentPiece, y: currentPiece.y };  // Start from the current position
  
  // Move the shadow piece down until it collides with the board
  while (!checkCollisionAt(shadowPiece)) {
    shadowPiece.y++; // Keep moving down until collision
  }

  shadowPiece.y--;  // Step back to the last valid position

  // Draw the shadow piece
  shadowPiece.shape.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (cell) {
        ctx.fillStyle = 'rgba(169, 169, 169, 0.5)';  // Gray with transparency for the shadow
        ctx.fillRect((shadowPiece.x + cIdx) * BLOCK_SIDE_LENGTH, (shadowPiece.y + rIdx) * BLOCK_SIDE_LENGTH, BLOCK_SIDE_LENGTH, BLOCK_SIDE_LENGTH);
      }
    });
  });
}

function checkCollisionAt(piece) {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const newX = piece.x + col;
        const newY = piece.y + row;
        if (newX < 0 || newX >= COLS || newY >= ROWS || board[newY][newX]) return true;
      }
    }
  }
  return false;
}

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

// moves piece down
function movePieceDown() {
  if (gameOver) return;  // Prevent moving if the game is over
  currentPiece.y++;
  if (checkCollision()) {
    currentPiece.y--;
    placePiece();
    clearLines();
    currentPiece = generatePiece();
    if (checkCollision()) gameOver = true; // End the game if new piece collides
  }
}

// drops piece to ground
function dropPieceDown() {
  if (gameOver) return; // Prevent moving if the game is over

  // Teleport the piece to the lowest valid position
  while (!checkCollision()) {
      currentPiece.y++; // Move the piece down until it collides
  }
  currentPiece.y--; // Step back to the last valid position

  // Place the piece and handle game state
  placePiece();
  clearLines();
  currentPiece = generatePiece();
  if (checkCollision()) gameOver = true; // End the game if new piece collides
}

// Check if the current piece collides with the board
function checkCollision() {
  for (let row = 0; row < currentPiece.shape.length; row++) {
    for (let col = 0; col < currentPiece.shape[row].length; col++) {
      if (currentPiece.shape[row][col]) {
        const newX = currentPiece.x + col;
        const newY = currentPiece.y + row;
        if (newX < 0 || newX >= COLS || newY >= ROWS || board[newY][newX]) return true;
      }
    }
  }
  return false;
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

// Clear completed lines and update the score
function clearLines() {
  let linesCleared = 0;  // Track the number of lines cleared
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every(cell => cell)) {  // If the row is completely filled
      board.splice(row, 1);  // Remove the filled row
      board.unshift(Array(COLS).fill(null));  // Add an empty row at the top
      score += SCORE_WORTH;
      linesCleared++;  // Increment linesCleared count
      row++;  // Stay on the same row index after clearing to recheck for consecutive filled rows
    }
  }

  // Trigger confetti effect and "Tetris!" message when 4 lines are cleared
  if (linesCleared === 4) {
    launchConfetti();  // Launch the confetti animation
    showTetrisMessage();  // Show the Tetris message on the screen
    score += 800;  // Increase score by 800 after clearing 4 lines
    drawScore();  // Update score display
  }
}

// Function to display the Tetris message on the canvas
function showTetrisMessage() {
  if (!tetrisMessageShown) {
    tetrisMessageStartTime = Date.now();
    tetrisMessageShown = true;
  }
}

// Update high score in localStorage
function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
  }
}

// Draw the score and high score in HTML 
function drawScore() {
  document.getElementById("score").innerText = "Score: " + score;
  document.getElementById("high-score").innerText = "High Score: " + highScore;
}

// Game loop function
function gameLoop() {
  if (gameOver) {
    clearInterval(gameInterval);
    updateHighScore();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    return;
  }

  movePieceDown();
  drawBoard();
  drawPiece();
  drawScore();
  updateConfetti();  // Update and draw confetti

  // Show the Tetris message for a short period (1 second)
  if (tetrisMessageShown && Date.now() - tetrisMessageStartTime < 1000) {
    ctx.fillStyle = 'gold';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Tetris! +800', canvas.width / 2, canvas.height / 2);
  }
}

// Initialize the game
function startGame() {
  clearInterval(gameInterval);  // Clear any existing intervals to avoid speeding up
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  currentPiece = generatePiece();
  score = 0;
  gameOver = false;
  confettiArray = [];  // Reset confetti
  confettiSpawnTime = Date.now();  // Start tracking confetti spawn time
  tetrisMessageShown = false;  // Reset Tetris message
  gameInterval = setInterval(gameLoop, GAME_CLOCK);  // Restart the game loop
}

// Event listeners for movement (WASD keys)
document.addEventListener("keydown", (event) => {
  if (gameOver) return; // Prevent key actions if the game is over

  switch (event.key) {
    case "a":  // Move left
      currentPiece.x--;
      if (checkCollision()) currentPiece.x++;
      break;
    case "d":  // Move right
      currentPiece.x++;
      if (checkCollision()) currentPiece.x--;
      break;
    case "s":  // Move down
      dropPieceDown();
      break;
    case "w":  // Rotate clockwise
      rotatePiece();
      if (checkCollision()) rotatePiece(true);  // Undo if collision occurs
      break;
  }
  drawBoard();
  drawPiece();
});

// Rotate the piece clockwise
function rotatePiece() {
  const originalShape = currentPiece.shape;
  currentPiece.shape = currentPiece.shape[0].map((_, idx) =>
    currentPiece.shape.map(row => row[idx]).reverse()
  );
  if (checkCollision()) currentPiece.shape = originalShape;  // Revert if collision occurs
}

// Trigger the start of the game
startGame();

// Function to launch the confetti
function launchConfetti() {
  // Set spawn time for 1 second
  confettiSpawnTime = Date.now();

  const confettiCount = 75;  // Increase to 75 confetti pieces
  for (let i = 0; i < confettiCount; i++) {
    const width = Math.random() * 8 + 5;  // Smaller width for each piece
    const height = Math.random() * 8 + 5;  // Smaller height for each piece
    const confettiPiece = {
      x: Math.random() * (canvas.width - width),  // Spread across the whole canvas width, but avoid overflows
      y: Math.random() * canvas.height / 2 + canvas.height / 4,  // Start lower on the screen
      width: width,
      height: height,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`,  // Softer color palette
      speedY: Math.random() * 4 + 4,  // Increased falling speed, but slightly less than before
      speedX: Math.random() * 3 - 1.5,  // Random horizontal movement to spread out
      startTime: Date.now() // Time when confetti started
    };
    confettiArray.push(confettiPiece);
  }
}

// Update and draw confetti
function updateConfetti() {
  const now = Date.now();

  // Remove confetti after 2 seconds
  confettiArray = confettiArray.filter(piece => now - piece.startTime < 2000);  // Keep for 2 seconds

  // Update each piece's position and remove if out of screen
  for (let i = 0; i < confettiArray.length; i++) {
    const piece = confettiArray[i];
    piece.y += piece.speedY;  // Make them fall at a faster speed
    piece.x += piece.speedX;  // Random horizontal movement

    // Draw each confetti piece
    ctx.fillStyle = piece.color;
    ctx.fillRect(piece.x, piece.y, piece.width, piece.height);
  }
}
