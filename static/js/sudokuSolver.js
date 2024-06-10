// A sudoku solver inspired by the Peter Norvig's constraint 
// satisfaction technique at http://norvig.com/sudoku.html

/*
***********************************************************************
*************************UI/Utility Functions**************************
*/

var extraEvilExample = [[0,4,0, 3,5,0, 0,1,8],
                        [0,2,0, 7,4,0, 0,0,0], 
                        [0,0,0, 0,0,0, 0,4,0],

                        [0,0,3, 0,6,0, 0,0,1],
                        [5,6,0, 0,3,0, 0,7,0],
                        [1,0,0, 4,0,0, 0,0,0],

                        [0,3,0, 2,0,0, 0,6,0],
                        [0,0,7, 0,0,0, 0,0,9],
                        [0,0,0, 6,8,0, 0,0,0]];

var evilExample =  [[0,0,0, 6,0,0, 0,0,1], 
                    [7,0,0, 0,9,4, 5,0,0], 
                    [4,0,0, 0,0,2, 0,0,0], 

                    [0,5,0, 0,1,0, 7,0,2], 
                    [0,2,0, 0,0,0, 0,6,0], 
                    [3,0,6, 0,8,0, 0,9,0], 

                    [0,0,0, 8,0,0, 0,0,7], 
                    [0,0,3, 7,6,0, 0,0,8], 
                    [9,0,0, 0,0,3, 0,0,0]];

var easyExample =  [[3,0,0, 9,0,0, 7,0,1], 
                    [1,0,0, 0,0,4, 5,0,9], 
                    [9,8,4, 0,0,0, 0,0,0], 

                    [0,0,9, 0,2,6, 8,0,0], 
                    [4,0,0, 0,9,0, 0,0,5], 
                    [0,0,2, 4,1,0, 6,0,0], 

                    [0,0,0, 0,0,0, 4,1,2], 
                    [2,0,3, 8,0,0, 0,0,7], 
                    [6,0,1, 0,0,9, 0,0,8]];

function loadBoard(board) {
    clearBoard();
    for (i = 0; i < 9; i++) {
        for (j = 0; j < 9; j++) {
            if (board[i][j] != null && board[i][j] != "") {
                document.getElementById("sq"+(i*9+j)).value = board[i][j];
            }
        }
    }
}

function clearBoard() {
    for (i = 0; i < 9; i++) {
        for (j = 0; j < 9; j++) {
            document.getElementById("sq"+(i*9+j)).value = "";
        }
    }
    document.getElementById("sudokuInfo").innerHTML = "<br/>";
}

function attemptSolve() {
    document.getElementById("sudokuInfo").innerHTML = "<br>";

    try {
        var board = populateBoardBuffer();
    } catch (err) {
        document.getElementById("sudokuInfo").innerHTML = err + "<br/><br/>";
        return;
    }
    if (!validBoard(board)) {
        document.getElementById("sudokuInfo").innerHTML = "There is a conflict on the board.<br/><br/>";
        return;
    }

    document.getElementById("sudokuInfo").innerHTML = "Working...<br/><br/>";

    solve(board);

    if (!validBoard(board)) {
        document.getElementById("sudokuInfo").innerHTML = "Failed to solve the Sudoku." + "<br/><br/>";
        return;
    }

    for(var i = 0; i < 81; i++) {
        document.getElementById("sq"+i).value = board[i];
    }
    document.getElementById("sudokuInfo").innerHTML = "Done!<br/><br/>";
}



/*
***********************************************************************
***************************Board Validation****************************
*/



function populateBoardBuffer() {
    var board = new Array(9*9);
    var count = 0;

    for(idx = 0; idx < 81; idx++) {
        let square = parseInt(document.getElementById("sq"+idx).value);
        if (!(square >= 1 || square <= 9)) {
            square = "";
        }
        board[idx] = square;

        if(!isBlank(board[idx])) {
            count++;
        }
    }

    if(count < 17) {
        throw ("Not Enough Givens (min 17)");
    }
    return board;
}

function isBlank(square) {
    return square == "";
}

function validBoard(board) {
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            let square = board[i*9+j];
            let evaluate_square = square >= 1 && square <= 9;
            let valid_square = (evaluate_square || square == "");
            if (!valid_square) { 
                return false;
            }
            if (evaluate_square &&
                (checkRowForNum(board, i, j, square) ||
                checkColForNum(board, i, j, square) ||
                checkSubBoardForNum(board, i, j, square))) {
                return false;
            }
        }
    }
    return true;
}

function checkRowForNum(board, row, col, val) {
    for(var j = 0; j < 9; j++) {
        if(board[row*9 + j] == val && j != col) {
            return true;
        }
    }
    return false;
}

function checkColForNum(board, row, col, val) {
    for(var i = 0; i < 9; i++) {
        if(board[i*9 + col] == val && i != row) {
            return true;
        }
    }
    return false;
}

function checkSubBoardForNum(board, row, col, val) {
    subBoardRow = Math.floor(row/3);
    subBoardCol = Math.floor(col/3);
    for(var i = subBoardRow * 3; i < (subBoardRow + 1) * 3; i++) {
        for(var j = subBoardCol * 3; j < (subBoardCol + 1) * 3; j++) {
            if(i != row && j != col && board[i*9 + j] == val) {
                return true;
            }
        }
    }
    return false;
}



/*
***********************************************************************
******************************THE SOLVER*******************************
*/



/*
"Peers" track a square's counterparts that cannot contradict it's solution.
When a square gets a definate answer, its peers have that possibility removed.
*/
var peers = Array(81);
for(var i = 0; i < 9; i++) {
    for (var j = 0; j < 9; j++){
        peers[i*9+j] = [];
        // Row and Col peers
        for(var a = 0; a < 9; a++) {
            if(i != a) {
                peers[i*9+j].push(a*9+j);
            }
            if(j != a) {
                peers[i*9+j].push(i*9+a);
            }           
        }
        // Sub-board peers
        subBoardRow = Math.floor(i/3);
        subBoardCol = Math.floor(j/3);
        for(var a = subBoardRow * 3; a < (subBoardRow + 1) * 3; a++) {
            for(var b = subBoardCol * 3; b < (subBoardCol + 1) * 3; b++) {
                if(i != a && j != b) {
                    peers[i*9+j].push(a*9+b);
                }
            }
        }
    }
}

function solve(board) {
    var solutionsFound = {val: 0};
    var puzzle = new Array();
    for(var i = 0; i < 81; i++) {
        puzzle[i] = {};
        if(board[i] != "") {
            puzzle[i].state = new Array(null, false, false, false, false, false, false, false, false, false);
            puzzle[i].state[board[i]] = true;
            puzzle[i].solution = board[i];
            puzzle[i].count = 1;
            puzzle[i].justSolved = true;
            solutionsFound.val++;
        }
        else {
            puzzle[i].state = new Array(null, true, true, true, true, true, true, true, true, true);
            puzzle[i].solution = "";
            puzzle[i].count = 9;
        }
    }

    while(removeConflicts(solutionsFound, puzzle, {}));

    for (i = 0; i < 81; i++) {
        board[i] = puzzle[i].solution;
    }

    if (!validBoard(board)) {
        throw "Invalid board state after standard solver loop!";
    }

    if(solutionsFound.val != 81) {
        result = branchAndBoundSearch(solutionsFound.val, puzzle);
        solutionsFound.val = result.solutionsFound;
        puzzle = result.puzzle;
    }

    for (i = 0; i < 81; i++) {
        board[i] = puzzle[i].solution;
    }

    if (!validBoard(board)) {
        throw "Invalid board state after guess-and-check solver loop!";
    }
}

function removeConflicts(solutionsFound, puzzle, conflictErrorOccurred) {
    var anyChangeMade = false;
    for(var i = 0; i < 81; i++) {
        if(puzzle[i].justSolved) {
            peers[i].forEach(function(peer){
                // Remove this solution as a possibility for peers.
                if(puzzle[peer].state[puzzle[i].solution]) {
                    puzzle[peer].state[puzzle[i].solution] = false;
                    puzzle[peer].count--;
                    if(puzzle[peer].count == 1) {
                        applyOnlySolution(puzzle[peer]);
                        solutionsFound.val++;
                        anyChangeMade = true;
                    } else if (puzzle[peer].count == 0) {
                        // If this peer can't be solved, something is wrong.
                        conflictErrorOccurred.val = true;
                    }
                }
            });
            puzzle[i].justSolved = false;
        }
    }
    return anyChangeMade;
}

function applyOnlySolution(square) {
    for(var i = 1; i < 10; i++) {
        if(square.state[i]) {
            square.solution = i;
            square.justSolved = true;
        }
    }
}

function branchAndBoundSearch(solutionsFound, puzzle) {
    let queue = new Array();
    queue.push({
        solutionsFound: solutionsFound,
        puzzle: puzzle,
        i: 0
    });
    while (queue.length > 0 ) {
        // Get the next state to consider.
        let cur = queue.pop();
        let solutionsFound = cur.solutionsFound;
        let puzzle = cur.puzzle;
        let i = cur.i;

        // Scan forward to the next unsolved square.
        while (puzzle[i].solution >= 1 && puzzle[i].solution <= 9) {
            ++i;
        }

        // Make some guesses.
        for (var j = 1; j < 10; j++) {
            // Skip possibilities that have already been ruled out.
            if (!puzzle[i].state[j]) {
                continue;
            }

            // Clone the current state.
            let guess_puzzle = JSON.parse(JSON.stringify(puzzle));
            let guess_solutionsFound = { val: solutionsFound };

            // Make a guess.
            guess_puzzle[i].solution = j;
            guess_puzzle[i].state = new Array(null, false, false, false, false, false, false, false, false, false);
            guess_puzzle[i].state[j] = true;
            guess_puzzle[i].count = 1;
            guess_puzzle[i].justSolved = true;
            guess_solutionsFound.val++;

            // Propagate constraints (repeatedly), stop if it turns out the guess put us in an invalid state.
            var conflictErrorOccurred = {val: false};
            while(removeConflicts(guess_solutionsFound, guess_puzzle, conflictErrorOccurred));
            // If there's any conflicts, don't pursue this guess.
            if (conflictErrorOccurred.val) {
                continue;
            }

            // Check if we're done.
            if (guess_solutionsFound.val == 81) {
                return {
                    solutionsFound: guess_solutionsFound.val,
                    puzzle: guess_puzzle
                };
            }

            // If we're not done yet, keep pursuing this branch.
            queue.push({
                solutionsFound: guess_solutionsFound.val,
                puzzle: guess_puzzle,
                i: i+1
            });
        }
    }
    throw "No solution found after an exhaustive search!";
}
