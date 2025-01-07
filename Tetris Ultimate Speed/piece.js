class Piece {
    constructor(shape, ctx, initialX = Math.floor(COLS / 2), initialY = -2) {
        this.shape = shape;
        this.ctx = ctx;
        this.y = initialY; 
        this.x = initialX; 
    }

    renderPiece() {
        this.shape.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell > 0) {
                    const renderY = this.y + i;
                    if (renderY < ROWS) {  // Allow rendering even with negative `y`
                        this.ctx.fillStyle = COLORS[cell - 1];
                        this.ctx.fillRect(this.x + j, renderY, 1, 1); 
                    }
                }
            });
        });
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
}
