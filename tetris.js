// setup
let canvas = document.getElementById("game-canvas");
let scoreboard = document.getElementById("scoreboard");
let ctx = canvas.getContext("2d");
ctx.scale(BLOCK_SIDE_LENGTH, BLOCK_SIDE_LENGTH);
let model = new GameModel(ctx);

let score = 0;
let showTetrisMessage = false;
let confettiParticles = [];

// Run the game state periodically based on GAME_CLOCK interval
setInterval(() => {
    newGameState();
}, GAME_CLOCK);

// Main game state function
let newGameState = () => {
    ctx.clearRect(0, 0, COLS, ROWS); // Clear canvas before each render
    fullSend();

    if (model.fallingPiece === null) {
        const rand = Math.floor(Math.random() * SHAPES.length); // Randomize shape
        const newPiece = new Piece(SHAPES[rand], ctx, Math.floor(COLS / 2), -1);
        model.fallingPiece = newPiece;
    }
    model.moveDown();

    drawConfetti(); // Render confetti particles each game state update

    // Render "Tetris!" message if triggered by clearing exactly 4 rows
    if (showTetrisMessage) {
        ctx.font = "1px Arial"; // Smaller font for "Tetris!"
        ctx.fillStyle = "yellow";
        ctx.textAlign = "center";
        ctx.fillText("Tetris!", COLS / 2, ROWS / 2);

        // Display points scored in smaller font
        ctx.font = "0.5px Arial"; // Smaller font for points
        ctx.fillText("Score: 800", COLS / 2, (ROWS / 2) + 0.5); // Position it below "Tetris!"
    }
};

// Handle row clearing and score updates
const fullSend = () => {
    const allFilled = (row) => row.every((x) => x > 0);

    let rowsCleared = 0;
    for (let i = 0; i < model.grid.length; i++) {
        if (allFilled(model.grid[i])) {
            rowsCleared++;
            model.grid.splice(i, 1);
            model.grid.unshift(new Array(COLS).fill(0));
        }
    }

    if (rowsCleared === 4) {  // Trigger "Tetris!" message and confetti if exactly 4 rows cleared
        score += 800;
        showTetrisMessage = true;
        createConfetti();

        // Remove the message after a short delay, while allowing the game to continue
        setTimeout(() => {
            showTetrisMessage = false;
            confettiParticles = [];  // Clear confetti after message disappears
        }, 1000);
    } else if (rowsCleared > 0) {  // Standard scoring for other clears
        score += rowsCleared * SCORE_WORTH;
    }

    scoreboard.innerHTML = "Score: " + score;
};

// Create confetti particles
const createConfetti = () => {
    confettiParticles = Array.from({ length: 100 }, () => ({
        x: Math.random() * COLS,               // Random x position across the width of the canvas
        y: Math.random() * (ROWS / 2),         // Random y position in the top half of the canvas
        size: Math.random() * 0.2 + 0.1,       // Random size for each particle
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        speedY: Math.random() * 0.5 + 0.5      // Speed for falling effect
    }));
};

// Draw confetti particles on the canvas
const drawConfetti = () => {
    confettiParticles.forEach((particle) => {
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        particle.y += particle.speedY; // Update y position for falling

        // Reset particle when it goes out of bounds
        if (particle.y > ROWS) {
            particle.y = Math.random() * (ROWS / 2) * -1; // Start from above the canvas
            particle.x = Math.random() * COLS; // Random x position
        }
    });
};

// Handle keyboard inputs
document.addEventListener("keydown", (e) => {
    e.preventDefault();
    switch (e.key) {
        case "w":
            model.rotate();
            break;
        case "d":
            model.move(true);
            break;
        case "s":
            model.moveDown();
            break;
        case "a":
            model.move(false);
            break;
    }
});

// Start the game loop
newGameState();
