class Piece {
    constructor(shape, ctx, initialX = Math.floor(COLS / 2), initialY = 0) {
        this.shape = shape;
        this.ctx = ctx;
        this.y = initialY; // Allow setting the initial Y position
        this.x = initialX; // Allow setting the initial X position
    }

    renderPiece() {
        this.shape.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell > 0) {
                    this.ctx.fillStyle = COLORS[cell - 1]; // Adjust to match index in COLORS
                    this.ctx.fillRect(this.x + j, this.y + i, 1, 1); // Draw solid color block
                }
            });
        });
    }

    setPosition(x, y) {
        this.x = x; // Set the X position
        this.y = y; // Set the Y position
    }
}
