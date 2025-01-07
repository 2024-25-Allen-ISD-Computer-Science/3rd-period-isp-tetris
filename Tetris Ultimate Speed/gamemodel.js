class GameModel {
    constructor(ctx) {
        this.ctx = ctx;
        this.fallingPiece = null;
        this.grid = this.makeStartingGrid();
        this.gameOver = false; // Add game over flag
    }

    makeStartingGrid() {
        let grid = [];
        for (var i = 0; i < ROWS; i++) {
            grid.push([]);
            for (var j = 0; j < COLS; j++) {
                grid[grid.length - 1].push(0);
            }
        }
        return grid;
    }

    collision(x, y) {
        const shape = this.fallingPiece.shape;
        const n = shape.length;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (shape[i][j] > 0) {
                    let p = x + j;
                    let q = y + i;
                    if (p >= 0 && p < COLS && q < ROWS) {
                        if (this.grid[q][p] > 0) {
                            return true;
                        }
                    } else {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    renderGameState() {
        this.ctx.clearRect(0, 0, COLS, ROWS); // Clear the canvas before rendering
        for (let i = 0; i < this.grid.length; i++) {
            for (let j = 0; j < this.grid[i].length; j++) {
                let cell = this.grid[i][j];
                if (cell > 0) { // Only render filled cells
                    this.ctx.fillStyle = COLORS[cell - 1]; // Use -1 for 0-based index
                    this.ctx.fillRect(j, i, 1, 1);
                }
            }
        }

        if (this.fallingPiece !== null) {
            this.fallingPiece.renderPiece();
        }
    }

    moveDown() {
        if (this.fallingPiece === null || this.gameOver) {
            this.renderGameState();
            return; // No more movement if game is over
        } else if (this.collision(this.fallingPiece.x, this.fallingPiece.y + 1)) {
            const shape = this.fallingPiece.shape;
            const x = this.fallingPiece.x;
            const y = this.fallingPiece.y;
            shape.map((row, i) => {
                row.map((cell, j) => {
                    let p = x + j;
                    let q = y + i;
                    if (p >= 0 && p < COLS && q < ROWS && cell > 0) {
                        this.grid[q][p] = shape[i][j];
                    }
                });
            });

            // check game over
            if (this.fallingPiece.y === 0) {
                this.gameOver = true; // Set game over flag
                alert("Game over!");
                return; // Stop the game immediately when game over
            }
            this.fallingPiece = null;
        } else {
            this.fallingPiece.y += 1;
        }
        this.renderGameState();
    }

    move(right) {
        if (this.fallingPiece === null || this.gameOver) {
            return; // No more movement if game is over
        }

        let x = this.fallingPiece.x;
        let y = this.fallingPiece.y;
        if (right) {
            // move right
            if (!this.collision(x + 1, y)) {
                this.fallingPiece.x += 1;
            }
        } else {
            // move left
            if (!this.collision(x - 1, y)) {
                this.fallingPiece.x -= 1;
            }
        }
        this.renderGameState();
    }

    rotate() {
        if (this.fallingPiece !== null && !this.gameOver) {
            let shape = this.fallingPiece.shape;
            for (let y = 0; y < shape.length; ++y) {
                for (let x = 0; x < y; ++x) {
                    [this.fallingPiece.shape[x][y], this.fallingPiece.shape[y][x]] =
                        [this.fallingPiece.shape[y][x], this.fallingPiece.shape[x][y]];
                }
            }
            // Reverse order of rows
            this.fallingPiece.shape.forEach((row) => row.reverse());
        }
        this.renderGameState();
    }

    resetGame() {
        this.grid = this.makeStartingGrid();
        this.fallingPiece = null;
        this.gameOver = false; // Reset game over flag
    }
}

//Back to normal tetris game mode button
document.getElementById("switch-mode-button").addEventListener("click", function() {
    window.location.href = "http://127.0.0.1:5513/Main%20Tetris/index.html"; 
});


