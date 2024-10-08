// Configuration
let ROWS = 10;  // Default grid size
let COLS = 10;  // Default grid size
let MINES = 10; // Default number of mines

// Game State
let grid = [];
let mineLocations = [];
let cellsRevealed = 0;
let flagsPlaced = 0;
let gameOver = false;

// DOM Elements
const gridElement = document.getElementById('grid');
const mineCounter = document.getElementById('mine-count');
const resetButton = document.getElementById('reset-button');
const hintButton = document.getElementById('hint-button'); 
const messageElement = document.getElementById('message');
const gridSizeInput = document.getElementById('grid-size');  // New input for grid size
const mineCountInput = document.getElementById('mine-count');  // New input for mine count

// Initialize Game
initGame();

// Event Listeners
resetButton.addEventListener('click', initGame);
hintButton.addEventListener('click', giveHint);

// Functions

function initGame() {
    // Get user-defined grid size and mine count
    ROWS = parseInt(gridSizeInput.value);
    COLS = parseInt(gridSizeInput.value);
    MINES = parseInt(mineCountInput.value);
    
    // Cap the number of mines to avoid invalid configurations
    if (MINES >= ROWS * COLS) {
        MINES = Math.floor(ROWS * COLS * 0.2);  // Limit mines to 20% of the grid
        mineCountInput.value = MINES;
    }

    // Reset game state
    grid = [];
    mineLocations = [];
    cellsRevealed = 0;
    flagsPlaced = 0;
    gameOver = false;
    mineCounter.textContent = `Mines: ${MINES}`;
    messageElement.textContent = '';
    gridElement.innerHTML = '';
    
    // Create grid data structure
    for (let r = 0; r < ROWS; r++) {
        let row = [];
        for (let c = 0; c < COLS; c++) {
            row.push({
                mine: false,
                revealed: false,
                flagged: false,
                adjacentMines: 0,
            });
        }
        grid.push(row);
    }
    
    // Place mines
    placeMines();
    
    // Calculate adjacent mines
    calculateAdjacentMines();
    
    // Render grid
    renderGrid();
}

function placeMines() {
    let minesPlaced = 0;
    while (minesPlaced < MINES) {
        let r = Math.floor(Math.random() * ROWS);
        let c = Math.floor(Math.random() * COLS);
        if (!grid[r][c].mine) {
            grid[r][c].mine = true;
            mineLocations.push({r, c});
            minesPlaced++;
        }
    }
}

function calculateAdjacentMines() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c].mine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    let nr = r + dr;
                    let nc = c + dc;
                    if (nr >=0 && nr < ROWS && nc >=0 && nc < COLS && grid[nr][nc].mine) {
                        count++;
                    }
                }
            }
            grid[r][c].adjacentMines = count;
        }
    }
}

function renderGrid() {
    // Set grid styles dynamically
    gridElement.style.gridTemplateColumns = `repeat(${COLS}, 40px)`;
    gridElement.style.gridTemplateRows = `repeat(${ROWS}, 40px)`;
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.setAttribute('data-row', r);
            cell.setAttribute('data-col', c);
            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('contextmenu', handleRightClick);
            gridElement.appendChild(cell);
        }
    }
}

function handleCellClick(e) {
    if (gameOver) return;
    const cellElement = e.currentTarget;
    const r = parseInt(cellElement.getAttribute('data-row'));
    const c = parseInt(cellElement.getAttribute('data-col'));
    const cell = grid[r][c];
    
    if (cell.flagged || cell.revealed) return;
    
    if (cell.mine) {
        revealMine(cellElement);
        endGame(false);
    } else {
        revealCell(r, c);
        checkWin();
    }
}

function handleRightClick(e) {
    e.preventDefault();
    if (gameOver) return;
    const cellElement = e.currentTarget;
    const r = parseInt(cellElement.getAttribute('data-row'));
    const c = parseInt(cellElement.getAttribute('data-col'));
    const cell = grid[r][c];
    
    if (cell.revealed) return;
    
    if (!cell.flagged && flagsPlaced >= MINES) return; // Limit flags to number of mines
    
    cell.flagged = !cell.flagged;
    cellElement.classList.toggle('flagged');
    flagsPlaced += cell.flagged ? 1 : -1;
    mineCounter.textContent = `Mines: ${MINES - flagsPlaced}`;
    
    checkWin();
}

function revealCell(r, c) {
    const cell = grid[r][c];
    const cellElement = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    
    if (cell.revealed || cell.flagged) return;
    
    cell.revealed = true;
    cellsRevealed++;
    cellElement.classList.add('revealed');
    
    if (cell.adjacentMines > 0) {
        cellElement.textContent = cell.adjacentMines;
        cellElement.style.color = getNumberColor(cell.adjacentMines);
    } else {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                let nr = r + dr;
                let nc = c + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    revealCell(nr, nc);
                }
            }
        }
    }
    checkWin();
}

function checkWin() {
    if (cellsRevealed === ROWS * COLS - MINES) {
        endGame(true);
    }
}

function revealMine(cellElement) {
    cellElement.classList.add('mine');
}

function endGame(won) {
    gameOver = true;
    if (won) {
        messageElement.textContent = 'Congratulations! You Won!';
    } else {
        messageElement.textContent = 'Game Over! You hit a mine.';
        mineLocations.forEach(location => {
            const mineCell = document.querySelector(`.cell[data-row="${location.r}"][data-col="${location.c}"]`);
            revealMine(mineCell);
        });
    }
}

function getNumberColor(num) {
    switch (num) {
        case 1: return 'blue';
        case 2: return 'green';
        case 3: return 'red';
        case 4: return 'darkblue';
        case 5: return 'darkred';
        case 6: return 'turquoise';
        case 7: return 'black';
        case 8: return 'gray';
        default: return 'black';
    }
}

function giveHint() {
    // Implement a hint function that reveals a non-mine cell
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!grid[r][c].mine && !grid[r][c].revealed) {
                revealCell(r, c);
                return; // Reveal only one cell
            }
        }
    }
}
