// Configuration
const ROWS = 10;
const COLS = 10;
const MINES = 10;

// Game State
let grid = [];
let mineLocations = [];
let cellsRevealed = 0;
let flagsPlaced = 0;
let gameOver = false;

// DOM Elements
const gridElement = document.getElementById('grid');
const mineCounter = document.getElementById('mine-counter');
const resetButton = document.getElementById('reset-button');
const messageElement = document.getElementById('message');

// Initialize Game
initGame();

// Event Listeners
resetButton.addEventListener('click', initGame);

// Functions

function initGame() {
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
            for (let dr = -1; dr <=1; dr++) {
                for (let dc = -1; dc <=1; dc++) {
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
        // Reveal adjacent cells recursively
        for (let dr = -1; dr <=1; dr++) {
            for (let dc = -1; dc <=1; dc++) {
                if (dr === 0 && dc === 0) continue;
                let nr = r + dr;
                let nc = c + dc;
                if (nr >=0 && nr < ROWS && nc >=0 && nc < COLS) {
                    revealCell(nr, nc);
                }
            }
        }
    }
}

function revealMine(cellElement) {
    cellElement.classList.add('revealed', 'mine');
    cellElement.textContent = '💣';
}

function endGame(won) {
    gameOver = true;
    if (won) {
        messageElement.textContent = "Congratulations! You Win!";
    } else {
        messageElement.textContent = "Game Over! You hit a mine.";
        // Reveal all mines
        mineLocations.forEach(loc => {
            const cellElement = document.querySelector(`.cell[data-row="${loc.r}"][data-col="${loc.c}"]`);
            if (!grid[loc.r][loc.c].revealed) {
                revealMine(cellElement);
            }
        });
    }
}

function checkWin() {
    if (cellsRevealed === ROWS * COLS - MINES) {
        endGame(true);
    }
}

function getNumberColor(number) {
    const colors = {
        1: 'blue',
        2: 'green',
        3: 'red',
        4: 'darkblue',
        5: 'brown',
        6: 'cyan',
        7: 'black',
        8: 'gray'
    };
    return colors[number] || 'black';
}
