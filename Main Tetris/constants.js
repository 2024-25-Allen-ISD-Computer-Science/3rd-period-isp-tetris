const GAME_CLOCK = 600;
const BLOCK_SIDE_LENGTH = 30;
const ROWS = 20;
const COLS = 10;
const SCORE_WORTH = 100;

const tetrisContainer = document.getElementById("game-container");
const buttonContainer = document.getElementById("button-container")
const switchModeButton = document.getElementById("switch-mode-button");
const modeButton = document.getElementById('toggle-mode');
const themeButton = document.getElementById('theme-button');

const SHAPES = [
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],

    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0],
    ],

    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0],
    ],

    [
        [4, 4],
        [4, 4],
    ],

    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0],
    ],

    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0],
    ],

    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
    ],
    
];

const COLORS = [
    '#FF0C08', // shape 1
    '#FF6D08', // shape 2
    '#FFDA08', // shape 3
    '#30E70B', // shape 4
    '#0B72E7', // shape 5
    '#A80BE7', // shape 6
    '#F879A0'  // shape 7
];

