class Piece {
    constructor(shape, ctx) {
        this.shape = shape;
        this.ctx = ctx; 
        this.y = 0;
        this.x = Math.floor(COLS / 2);
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
}
