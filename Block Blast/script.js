/******************************************************************************
 * 1) GLOBAL GAME STATE
 ******************************************************************************/

const boardSize = 10;
let board = [];
let score = 0;
let highScore = 0;
let shapesInPlay = [];
let selectedShape = null;

/******************************************************************************
 * 2) SHAPES ARRAY WITH MULTIPLE SHAPES & ORIENTATIONS
 ******************************************************************************/
const SHAPES = [
  // L-shape, color = "red"
  ['#ff3b30',   [[0,0],[1,0],[2,0],[2,1],[2,2]] ],
  ['#ff3b30',   [[0,2],[0,1],[0,0],[1,0],[2,0]] ],
  ['#ff3b30',   [[2,2],[1,2],[0,2],[0,1],[0,0]] ],
  ['#ff3b30',   [[2,0],[2,1],[2,2],[1,2],[0,2]] ],

  // O-shape (2x2), color = "yellow"
  ['#ffcc00', [[0,0],[1,0],[0,1],[1,1]] ],
  ['#ffcc00', [[0,0],[1,0],[0,1],[1,1]] ],
  ['#ffcc00', [[0,0],[1,0],[0,1],[1,1]] ],
  ['#ffcc00', [[0,0],[1,0],[0,1],[1,1]] ],

  // I-shape (4 in a row), color = "pink"
  ['pink', [[0,0],[1,0],[2,0],[3,0]] ],
  ['pink', [[0,0],[0,1],[0,2],[0,3]] ],
  ['pink', [[0,0],[1,0],[2,0],[3,0]] ],
  ['pink', [[0,0],[0,1],[0,2],[0,3]] ],

  // T-shape, color = "purple"
  ['#8e44ad', [[0,0],[1,0],[2,0],[1,1]] ],
  ['#8e44ad', [[1,0],[1,1],[1,2],[0,1]] ],
  ['#8e44ad', [[0,1],[1,1],[2,1],[1,0]] ],
  ['#8e44ad', [[0,0],[0,1],[0,2],[1,1]] ],

  // S-shape, color = "green"
  ['#4cd137', [[1,0],[2,0],[0,1],[1,1]] ],
  ['#4cd137', [[0,0],[0,1],[1,1],[1,2]] ],
  ['#4cd137', [[1,0],[2,0],[0,1],[1,1]] ],
  ['#4cd137', [[0,0],[0,1],[1,1],[1,2]] ],

  // Z-shape, color = "orange"
  ['#f39c12', [[0,0],[1,0],[1,1],[2,1]] ],
  ['#f39c12', [[1,0],[0,1],[1,1],[0,2]] ],
  ['#f39c12', [[0,0],[1,0],[1,1],[2,1]] ],
  ['#f39c12', [[1,0],[0,1],[1,1],[0,2]] ],

  // J-shape, color = "blue"
  ['#2980b9', [[0,0],[0,1],[1,1],[2,1]] ],
  ['#2980b9', [[1,0],[1,1],[1,2],[0,2]] ],
  ['#2980b9', [[0,0],[1,0],[2,0],[2,1]] ],
  ['#2980b9', [[0,0],[0,1],[0,2],[1,0]] ],
];

/******************************************************************************
 * 3) INITIALIZE THE BOARD
 * We'll store 0 for empty, or a color string if filled.
 ******************************************************************************/
function initBoard() {
  board = [];
  for (let r = 0; r < boardSize; r++) {
    const row = [];
    for (let c = 0; c < boardSize; c++) {
      row.push(0);
    }
    board.push(row);
  }
}

/******************************************************************************
 * 4) RENDER THE BOARD
 ******************************************************************************/
function renderBoard() {
  const boardDiv = document.getElementById('board');
  boardDiv.innerHTML = '';

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');

      // If not 0, it's a color string => fill that cell
      if (board[r][c] !== 0) {
        cell.classList.add('filled');
        cell.style.backgroundColor = board[r][c];
      }

      // Mouse hover for placement preview
      cell.addEventListener('mouseover', () => {
        if (selectedShape) {
          highlightPlacement(r, c, selectedShape, true);
        }
      });
      cell.addEventListener('mouseout', () => {
        if (selectedShape) {
          highlightPlacement(r, c, selectedShape, false);
        }
      });

      // Click => attempt to place shape
      cell.addEventListener('click', () => {
        if (selectedShape) {
          placeShapeIfValid(r, c, selectedShape);
        }
      });

      boardDiv.appendChild(cell);
    }
  }
}

/******************************************************************************
 * 5) GENERATE SHAPES (pick 3 random shapes)
 ******************************************************************************/
function generateShapes() {
  shapesInPlay = [];
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * SHAPES.length);
    // shapeData = [ color, [ [x,y], [x,y], ... ] ]
    const shapeData = SHAPES[randomIndex];
    const cloned = JSON.parse(JSON.stringify(shapeData)); // deep copy
    shapesInPlay.push(cloned);
  }
}

/******************************************************************************
 * 6) RENDER THE SHAPES PANEL
 ******************************************************************************/
function renderShapesPanel() {
  const panel = document.getElementById('shapes-panel');
  panel.innerHTML = '';

  shapesInPlay.forEach((shape) => {
    const [color, coords] = shape;

    const shapeContainer = document.createElement('div');
    shapeContainer.classList.add('shape-container');

    // bounding box
    const rows = coords.map(coord => coord[1]);
    const cols = coords.map(coord => coord[0]);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    const shapeHeight = maxRow - minRow + 1;
    const shapeWidth  = maxCol - minCol + 1;

    // CSS grid for shape
    shapeContainer.style.display = 'grid';
    shapeContainer.style.gridTemplateColumns = `repeat(${shapeWidth}, 30px)`;
    shapeContainer.style.gridTemplateRows    = `repeat(${shapeHeight}, 30px)`;
    shapeContainer.style.margin = '10px';

    // fill bounding box
    for (let r = 0; r < shapeHeight; r++) {
      for (let c = 0; c < shapeWidth; c++) {
        const blockCell = document.createElement('div');
        blockCell.classList.add('shape-empty');
        shapeContainer.appendChild(blockCell);
      }
    }

    // Mark actual shape squares
    coords.forEach(([x, y]) => {
      const index = (y - minRow) * shapeWidth + (x - minCol);
      const cellDiv = shapeContainer.children[index];
      cellDiv.classList.remove('shape-empty');
      cellDiv.classList.add('shape-block');
      cellDiv.style.backgroundColor = color;
    });

    // Click => select shape
    shapeContainer.addEventListener('click', () => {
      selectedShape = shape;
      document.querySelectorAll('.shape-container').forEach(el => {
        el.classList.remove('selected');
      });
      shapeContainer.classList.add('selected');
    });

    panel.appendChild(shapeContainer);
  });
}

/******************************************************************************
 * 7) CHECK IF SHAPE CAN BE PLACED
 ******************************************************************************/
function canPlaceShape(board, row, col, shape) {
  const coords = shape[1];
  for (const [x, y] of coords) {
    const targetRow = row + y;
    const targetCol = col + x;

    // Out of bounds?
    if (
      targetRow < 0 ||
      targetRow >= boardSize ||
      targetCol < 0 ||
      targetCol >= boardSize
    ) {
      return false;
    }

    // Occupied?
    if (board[targetRow][targetCol] !== 0) {
      return false;
    }
  }
  return true;
}

/******************************************************************************
 * 8) HOVER HIGHLIGHT FOR POTENTIAL PLACEMENT
 ******************************************************************************/
function highlightPlacement(row, col, shape, highlight) {
  const boardDiv = document.getElementById('board');
  const cells = boardDiv.children;
  const coords = shape[1];
  const valid = canPlaceShape(board, row, col, shape);

  coords.forEach(([x, y]) => {
    const targetRow = row + y;
    const targetCol = col + x;

    if (
      targetRow < 0 ||
      targetRow >= boardSize ||
      targetCol < 0 ||
      targetCol >= boardSize
    ) {
      return;
    }

    const cellIndex = targetRow * boardSize + targetCol;
    const cellDiv = cells[cellIndex];

    if (highlight) {
      if (valid) {
        cellDiv.classList.add('hover-valid');
      } else {
        cellDiv.classList.add('hover-invalid');
      }
    } else {
      cellDiv.classList.remove('hover-valid');
      cellDiv.classList.remove('hover-invalid');
    }
  });
}

/******************************************************************************
 * 9) PLACE SHAPE IF VALID
 *
 * +10 for placing a shape, +100 per cleared line.
 ******************************************************************************/
function placeShapeIfValid(row, col, shape) {
  const [color, coords] = shape;

  if (!canPlaceShape(board, row, col, shape)) {
    alert('Invalid placement!');
    return;
  }

  // +10 points for placing the shape
  score += 10;

  // Fill board cells
  coords.forEach(([x, y]) => {
    board[row + y][col + x] = color;
  });

  // Update scoreboard
  document.getElementById('score').textContent = 'Score: ' + score;

  // Remove shape from in-play
  removeShapeFromPlay(shape);

  // Clear lines if any
  clearFullLines();

  // Re-render
  renderBoard();
  renderShapesPanel();

  // Deselect
  selectedShape = null;

  // If we ran out of shapes, generate a new set
  if (shapesInPlay.length === 0) {
    generateShapes();
    renderShapesPanel();
  }

  // Update high score if needed
  updateHighScore();

  // Check game over
  if (isGameOver()) {
    document.getElementById('status').innerText = 'Game Over! No valid moves left.';
  }
}

/******************************************************************************
 * 10) REMOVE SHAPE FROM SHAPESINPLAY
 ******************************************************************************/
function removeShapeFromPlay(shape) {
  shapesInPlay = shapesInPlay.filter(s => s !== shape);
}

/******************************************************************************
 * 11) CLEAR FULL ROWS & COLUMNS
 * Each line cleared => +100
 ******************************************************************************/
function clearFullLines() {
  let linesCleared = 0;

  // Clear full rows
  for (let r = 0; r < boardSize; r++) {
    if (board[r].every(cell => cell !== 0)) {
      board[r] = board[r].map(() => 0);
      linesCleared++;
    }
  }

  // Clear full columns
  for (let c = 0; c < boardSize; c++) {
    let isFull = true;
    for (let r = 0; r < boardSize; r++) {
      if (board[r][c] === 0) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      for (let r = 0; r < boardSize; r++) {
        board[r][c] = 0;
      }
      linesCleared++;
    }
  }

  if (linesCleared > 0) {
    score += linesCleared * 100;
    document.getElementById('score').textContent = 'Score: ' + score;
    updateHighScore();
  }
}

/******************************************************************************
 * 12) CHECK IF ANY VALID MOVE EXISTS => GAME OVER?
 ******************************************************************************/
function isGameOver() {
  if (shapesInPlay.length === 0) return false; // no shapes => not game over

  for (const shape of shapesInPlay) {
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        if (canPlaceShape(board, r, c, shape)) {
          return false;
        }
      }
    }
  }
  return true; // no valid moves => game over
}

/******************************************************************************
 * 13) INIT / START THE GAME
 ******************************************************************************/
function initGame() {
  // Load high score from localStorage if present
  const savedHighScore = localStorage.getItem('blockBlastHighScore');
  if (savedHighScore) {
    highScore = parseInt(savedHighScore, 10) || 0;
  } else {
    highScore = 0;
  }
  document.getElementById('high-score').textContent = 'High Score: ' + highScore;

  initBoard();
  renderBoard();
  generateShapes();
  renderShapesPanel();

  score = 0;
  document.getElementById('score').textContent = 'Score: ' + score;
  document.getElementById('status').innerText = '';
}

/******************************************************************************
 * 14) UPDATE HIGH SCORE
 ******************************************************************************/
function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('blockBlastHighScore', highScore);
    document.getElementById('high-score').textContent = 'High Score: ' + highScore;
  }
}

/******************************************************************************
 * 15) RESET THE GAME
 ******************************************************************************/
function resetGame() {
  score = 0;
  document.getElementById('score').textContent = 'Score: ' + score;
  document.getElementById('status').innerText = '';

  initBoard();
  renderBoard();
  generateShapes();
  renderShapesPanel();
}

/******************************************************************************
 * 16) ON LOAD
 ******************************************************************************/
window.addEventListener('load', () => {
  initGame();

  // Reset button
  document.getElementById('reset-button').addEventListener('click', resetGame);

  // If you still have a "switch-mode-button" for Tetris mode:
  const switchBtn = document.getElementById('switch-mode-button');
  if (switchBtn) {
    switchBtn.addEventListener('click', function() {
      window.location.href = "http://127.0.0.1:5500/Main%20Tetris/index.html";
    });
  }
});