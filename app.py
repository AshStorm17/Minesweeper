from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__)

def generate_minesweeper_grid(rows, cols, mines):
    grid = [[0 for _ in range(cols)] for _ in range(rows)]
    mine_positions = random.sample(range(rows * cols), mines)
    
    for pos in mine_positions:
        r, c = divmod(pos, cols)
        grid[r][c] = -1  # -1 indicates a mine

        # Update numbers around the mine
        for dr in range(-1, 2):
            for dc in range(-1, 2):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != -1:
                    grid[nr][nc] += 1
    return grid

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/new_game", methods=["POST"])
def new_game():
    data = request.json
    rows = data.get("rows", 8)
    cols = data.get("cols", 8)
    mines = data.get("mines", 10)
    grid = generate_minesweeper_grid(rows, cols, mines)
    return jsonify({"grid": grid})

from sympy import symbols, Eq, solve

@app.route("/api/solver", methods=["POST"])
def solver():
    data = request.json
    grid = data.get("grid")
    revealed = data.get("revealed")  # 2D list showing revealed cells (True/False)
    flagged = data.get("flagged", [])
    rows = len(grid)
    cols = len(grid[0])
    variables = {}
    equations = []
    flagged_set = set()

    # Initialize flagged cells
    for cell in flagged:
        r, c = cell["row"], cell["col"]
        variables[(r, c)] = symbols(f"x_{r}_{c}")
        flagged_set.add((r, c))

    # Create variables for hidden cells and formulate equations
    for r in range(rows):
        for c in range(cols):
            if revealed[r][c] and (r, c) not in flagged_set:  # Only process revealed cells
                value = grid[r][c]
                neighbors = []
                flag_neighbors = []
                for dr in range(-1, 2):
                    for dc in range(-1, 2):
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < rows and 0 <= nc < cols:
                            if not revealed[nr][nc]:
                                if (nr, nc) not in variables:
                                    variables[(nr, nc)] = symbols(f"x_{nr}_{nc}")
                                neighbors.append(variables[(nr, nc)])
                            if (nr,nc) in flagged_set:
                                neighbors.append(variables[(nr, nc)])
                                flag_neighbors.append(variables[(nr, nc)])

                # Check if the sum of neighbors equals the cell value
                if len(flag_neighbors) == value:
                    for neighbor in neighbors:
                        if (neighbor not in flag_neighbors):
                            equations.append(Eq(neighbor, 0))
                        else:
                            equations.append(Eq(neighbor, 1))
                elif len(neighbors) == value:
                    # All neighbors are mines
                    for neighbor in neighbors:
                        equations.append(Eq(neighbor, 1))
                else:
                    # Formulate a general equation
                    equations.append(Eq(sum(neighbors), value))

    # Solve the CSP
    print(equations)
    solution = solve(equations, list(variables.values()))
    hints = []

    # Generate hints based on the solution
    for (r, c), var in variables.items():
        if var in solution:
            if solution[var] == 1:  # Guaranteed mine
                hints.append({"row": r, "col": c, "type": "mine"})
            elif solution[var] == 0:  # Guaranteed safe
                hints.append({"row": r, "col": c, "type": "safe"})
    return jsonify({"hints": hints, "equations": [str(eq) for eq in equations]})


if __name__ == "__main__":
    app.run(debug=True)
