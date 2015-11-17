// A sudoku solver inspired by the Peter Norvig's constraint 
// satisfaction technique at http://norvig.com/sudoku.html

/*
***********************************************************************
*************************UI/Utility Functions**************************
*/

var evilExample = [[ 0,0,0, 6,0,0, 0,0,1], 
					[7,0,0, 0,9,4, 5,0,0], 
					[4,0,0, 0,0,2, 0,0,0], 

					[0,5,0, 0,1,0, 7,0,2], 
					[0,2,0, 0,0,0, 0,6,0], 
					[3,0,6, 0,8,0, 0,9,0], 

					[0,0,0, 8,0,0, 0,0,7], 
					[0,0,3, 7,6,0, 0,0,8], 
					[9,0,0, 0,0,3, 0,0,0]];

var easyExample = [[ 3,0,0, 9,0,0, 7,0,1], 
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
			if (board[i][j] != null && board[i][j] != 0) {
				document.getElementById('sq'+(i*9+j)).value = board[i][j];
			}
		}
	}
}

function clearBoard() {
	for (i = 0; i < 9; i++) {
		for (j = 0; j < 9; j++) {
			document.getElementById('sq'+(i*9+j)).value = "";
		}
	}
	document.getElementById('sudokuInfo').innerHTML = "<br/>";
}

function attemptSolve() {
	document.getElementById('sudokuInfo').innerHTML = '<br>';

	try {
		var board = populateBoardBuffer();
		validBoard(board);
	} catch(err) {
		document.getElementById('sudokuInfo').innerHTML = err + '<br/><br/>';
		return;
	}
	
	document.getElementById('sudokuInfo').innerHTML = 'Working...<br/><br/>';

	solve(board);

	for(var i = 0; i < 81; i++) {
		document.getElementById('sq'+i).value = board[i];
	}
	document.getElementById('sudokuInfo').innerHTML = 'Done!<br/><br/>';
}






/*
***********************************************************************
***************************Board Validation****************************
*/






function populateBoardBuffer() {
	var board = new Array(9*9);
	var count = 0;

	for(idx = 0; idx < 81; idx++) {
		board[idx] = document.getElementById('sq'+idx).value;

		if(!isValidInput(board[idx])) {
			throw('Invalid Board State (only use numbers between 1 and 9, or blanks)');
		} else if(!isBlank(board[idx])) {
			count++;
		}
	}

	if(count < 17) {
		throw ('Not Enough Givens (min 17)');
	}
	return board;
}

function isValidInput(square) {
	return isBlank(square) || (square > 0 && square <= 9);
}

function isBlank(square) {
	return square == '';
}

function validBoard(board) {
	for (var i = 0; i < 9; i++) {
		for (var j = 0; j < 9; j++) {
			if (board[i*9+j] != '' &&
				(checkRowForNum(board, i, j, board[i*9+j]) ||
				checkColForNum(board, i, j, board[i*9+j]) ||
				checkSubBoardForNum(board, i, j, board[i*9+j]))) {
				throw ('There is a conflict on the board');
			}
		}
	}
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
			if(i !=	a) {
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
		if(board[i] != '') {
			puzzle[i].state = new Array(null, false, false, false, false, false, false, false, false, false);
			puzzle[i].state[board[i]] = true;
			puzzle[i].solution = board[i];
			puzzle[i].count = 1;
			puzzle[i].justSolved = true;
			solutionsFound.val++;
		}
		else {
			puzzle[i].state = new Array(null, true, true, true, true, true, true, true, true, true);
			puzzle[i].solution = null;
			puzzle[i].count = 9;
		}
	}

	while(removeConflicts(solutionsFound, puzzle, {}));

	if(solutionsFound.val != 81) {
		puzzle = depthFirstSearch(solutionsFound, puzzle)
	}

	for (i = 0; i < 81; i++) {
		board[i] = puzzle[i].solution;
	}
}

function removeConflicts(solutionsFound, puzzle, conflictErrorOccured) {
	var anyChangeMade = false;
	for(var i = 0; i < 81; i++) {
		if(puzzle[i].justSolved) {
			peers[i].forEach(function(peer){
				if(puzzle[peer].solution == puzzle[i].solution) {
					conflictErrorOccured.val = true;
					return false;
				}
				if(puzzle[peer].state[puzzle[i].solution]) {
					puzzle[peer].state[puzzle[i].solution] = false;
					puzzle[peer].count--;
					if(puzzle[peer].count == 1) {
						applyOnlySolution(puzzle[peer]);
						solutionsFound.val++;
					}
					anyChangeMade = true;
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

function depthFirstSearch(solutionsFound, puzzle) {
	var stack = new Array();
	stack.push({solutionsFound: solutionsFound, puzzle: puzzle});
	for(;;) {
		var tempPuzzle = stack.pop();
		for(var i = 0; i < 81; i++) {
			for(var j = 1; j < 10; j++) {
				var  workingSet = JSON.parse(JSON.stringify(tempPuzzle));
				if(workingSet.puzzle[i].state[j]) {
					workingSet.puzzle[i].solution = j;
					workingSet.puzzle[i].state = new Array(null, false, false, false, false, false, false, false, false, false);
					workingSet.puzzle[i].state[j] = true;
					workingSet.puzzle[i].count = 1;
					workingSet.puzzle[i].justSolved = true;
					workingSet.solutionsFound.val++;

					var conflictErrorOccured = {val: false};
					while(removeConflicts(workingSet.solutionsFound, workingSet.puzzle, conflictErrorOccured));
					
					if(workingSet.solutionsFound.val == 81) {
						return workingSet.puzzle;
					} else if (!conflictErrorOccured) {
						stack.push(workingSet);
						break;
					}
				}
			}
		}
	}
}


