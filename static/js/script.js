document.getElementById("start-game").addEventListener("click", () => {
    const rows = parseInt(document.getElementById("rows").value);
    const cols = parseInt(document.getElementById("cols").value);
    const mines = parseInt(document.getElementById("mines").value);

    fetch("/api/new_game", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows, cols, mines }),
    })
        .then((response) => response.json())
        .then((data) => {
            renderGrid(data.grid);
        });
});

function renderGrid(grid) {
    const gameContainer = document.getElementById("game-container");
    gameContainer.innerHTML = ""; // Clear previous game

    grid.forEach((row, r) => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "row";

        row.forEach((cell, c) => {
            const cellDiv = document.createElement("div");
            cellDiv.className = "cell hidden";

            // Store coordinates in attributes for reference
            cellDiv.dataset.row = r;
            cellDiv.dataset.col = c;

            if (cell === -1) {
                cellDiv.dataset.mine = true;
            } else {
                cellDiv.dataset.value = cell;
            }

            cellDiv.addEventListener("click", () => revealCell(cellDiv, grid));
            rowDiv.appendChild(cellDiv);
        });

        gameContainer.appendChild(rowDiv);
    });
}

function revealCell(cell, grid) {
    // Check if the cell is already revealed
    if (cell.classList.contains("revealed") || cell.classList.contains("mine")) return;

    // Remove the 'hidden' class (if present) and hint-related classes
    cell.classList.remove("hidden", "hint", "hint-safe", "hint-mine");

    // If the cell is a mine
    if (cell.dataset.mine) {
        cell.classList.add("mine");
        alert("Game Over!");
        revealAll(grid); // Reveal all cells when the game ends
        return;
    }

    // Mark the cell as revealed
    cell.classList.add("revealed");
    cell.textContent = cell.dataset.value > 0 ? cell.dataset.value : "";

    // If the cell's value is 0, automatically reveal its neighbors
    if (cell.dataset.value == 0) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue; // Skip the current cell
                const nr = row + dr;
                const nc = col + dc;
                const neighbor = document.querySelector(
                    `.cell[data-row='${nr}'][data-col='${nc}']`
                );
                if (neighbor) revealCell(neighbor, grid);
            }
        }
    }
    checkWinCondition()
}

function revealAll(grid) {
    document.querySelectorAll(".cell").forEach((cell) => {
        cell.classList.remove("hidden");
        if (cell.dataset.mine) {
            cell.classList.add("mine");
        } else {
            cell.classList.add("revealed");
            cell.textContent = cell.dataset.value > 0 ? cell.dataset.value : "";
        }
    });
}

document.getElementById("solver-button").addEventListener("click", () => {
    const grid = [];
    const revealed = [];
    const flagged = []; // Collect hint-mine cells as flagged

    // Extract the current state of the grid, revealed cells, and flagged cells
    document.querySelectorAll(".row").forEach((rowDiv, r) => {
        const gridRow = [];
        const revealedRow = [];

        rowDiv.querySelectorAll(".cell").forEach((cellDiv, c) => {
            // Extract cell value (-1 for mines or actual number)
            const value = cellDiv.dataset.mine ? -1 : parseInt(cellDiv.dataset.value || 0);
            gridRow.push(value);

            // Is the cell revealed?
            revealedRow.push(!cellDiv.classList.contains("hidden"));

            // Track `hint-mine` cells as flagged
            if (cellDiv.classList.contains("hint-mine")) {
                flagged.push({ row: r, col: c });
            }
        });

        grid.push(gridRow);
        revealed.push(revealedRow);
    });

    // Send the updated grid, revealed, and flagged cells to the solver
    fetch("/api/solver", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ grid, revealed, flagged }),
    })
        .then((response) => response.json())
        .then((data) => {
            // Visualize equations
            renderEquations(data.equations);

            // Highlight new hints based on the solver's response
            highlightHints(data.hints);
        });
});

function renderEquations(equations) {
    const equationsContainer = document.getElementById("equations");
    equationsContainer.innerHTML = ""; // Clear previous equations

    equations.forEach((eq, index) => {
        const eqDiv = document.createElement("div");
        eqDiv.className = "equation";
        eqDiv.textContent = `Equation ${index + 1}: ${eq}`;
        equationsContainer.appendChild(eqDiv);
    });
}

// function highlightHints(hints) {
//     hints.forEach((hint, index) => {
//             const cell = document.querySelector(
//                 `.cell[data-row='${hint.row}'][data-col='${hint.col}']`
//             );
//             cell.classList.remove("hidden");
//             if (hint.type === "mine") {
//                 cell.classList.add("hint-mine");
//             } else if (hint.type === "safe") {
//                 cell.classList.add("hint-safe");
//                 revealCell(cell, grid); // Automatically reveal safe cells
//             }
//             if (index === hints.length - 1) {
//                 // Check for win condition after solver finishes
//                 checkWinCondition();
//             }
//     });
// }
function highlightHints(hints) {
    const gameContainer = document.getElementById("game-container");
    let noSafeMoveMessage = document.getElementById("no-safe-move-message");

    // Count how many hints are of type 'safe'
    const safeHintsCount = hints.filter(hint => hint.type === 'safe').length;

    if (safeHintsCount === 0) {
        // Show the "No safe move found" message if there are no safe hints
        if (!noSafeMoveMessage) {
            noSafeMoveMessage = document.createElement("div");
            noSafeMoveMessage.id = "no-safe-move-message";
            noSafeMoveMessage.textContent = "No safe move found";
            noSafeMoveMessage.style.color = "red";
            noSafeMoveMessage.style.fontSize = "18px";
            noSafeMoveMessage.style.fontWeight = "bold";
            noSafeMoveMessage.style.marginTop = "20px"; // Add some margin for spacing
            gameContainer.appendChild(noSafeMoveMessage);
        }
    } else {
        // Hide the message if there are safe hints
        if (noSafeMoveMessage) {
            noSafeMoveMessage.remove();
        }

        hints.forEach((hint, index) => {
            const cell = document.querySelector(
                `.cell[data-row='${hint.row}'][data-col='${hint.col}']`
            );
            cell.classList.remove("hidden");
            if (hint.type === "mine") {
                cell.classList.add("hint-mine");
            } else if (hint.type === "safe") {
                cell.classList.add("hint-safe");
                revealCell(cell, grid); // Automatically reveal safe cells
            }
            if (index === hints.length - 1) {
                // Check for win condition after solver finishes
                checkWinCondition();
            }
        });
    }
}




function checkWinCondition() {
    const allCells = document.querySelectorAll(".cell");
    const isWin = Array.from(allCells).every((cell) => {
        return (
            cell.classList.contains("revealed") ||
            (cell.dataset.mine && cell.classList.contains("hidden"))
        );
    });

    if (isWin) {
        alert("Congratulations! You Win!");
    }
}

