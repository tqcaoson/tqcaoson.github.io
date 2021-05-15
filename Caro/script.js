let origBoard;
let huPlayer ='O';
let aiPlayer = 'X';
const winCombos =[
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 4, 8],
  [6, 4, 2],
  [2, 5, 8],
  [1, 4, 7],
  [0, 3, 6]
];

const cells = document.querySelectorAll('.cell');
document.querySelector('.btn').addEventListener('click', startGame, false);
startGame();

function selectSym(sym){
  document.querySelector('.play-board').classList.remove("hide");
  document.querySelector('.play-board').classList.add("show");
  document.querySelector('.select-box').classList.remove("show");
  document.querySelector('.select-box').classList.add("hide");
  huPlayer = sym;
  aiPlayer = sym==='O' ? 'X' :'O';
  origBoard = Array.from(Array(9).keys());
  for (let i = 0; i < cells.length; i++) {
    cells[i].addEventListener('click', turnClick, false);
  }
  if (aiPlayer === 'X') {
    
    turn(bestSpot(),aiPlayer);
  }
}
//document.querySelector(".players").classList.remove("active");
function startGame() {
    document.querySelector('.result-box').classList.remove("show");
    document.querySelector('.result-box').classList.add("hide");
    document.querySelector('.play-board').classList.remove("show");
    document.querySelector('.play-board').classList.add("hide");
    document.querySelector('.select-box').classList.remove("hide");
    document.querySelector('.select-box').classList.add("show");
  for (let i = 0; i < cells.length; i++) {
    cells[i].innerText = '';
    cells[i].style.removeProperty('background-color');
  }
}

function turnClick(square) {
  if (typeof origBoard[square.target.id] ==='number') {
    if(huPlayer == 'X') {
        document.querySelector(".players").classList.add("active");
    } else {
        document.querySelector(".players").classList.remove("active");
    }
    
    turn(square.target.id, huPlayer);
    if (!checkWin(origBoard, huPlayer) && !checkTie())  
      setTimeout(()=>{
        turn(bestSpot(), aiPlayer);
        if(huPlayer == 'X') {
            document.querySelector(".players").classList.remove("active");
        } else {
            document.querySelector(".players").classList.add("active");
        }
      },200);
  }
}

function turn(squareId, player) {
  origBoard[squareId] = player;
  document.getElementById(squareId).innerHTML = (player=='X') ? `<i class="fas fa-times"></i>` : `<i class="far fa-circle"></i>`; 
  let gameWon = checkWin(origBoard, player);
  if (gameWon) gameOver(gameWon);
  else checkTie();
}

function checkWin(board, player) {
  let plays = board.reduce((a, e, i) => (e === player) ? a.concat(i) : a, []);
  let gameWon = null;
  for (let [index, win] of winCombos.entries()) {
    if (win.every(elem => plays.indexOf(elem) > -1)) {
      gameWon = {index: index, player: player};
      break;
    }
  }
  return gameWon;
}

function gameOver(gameWon){
  for (let index of winCombos[gameWon.index]) {
    document.getElementById(index).style.backgroundColor = 
      gameWon.player === huPlayer ? "blue" : "red";
  }
  for (let i=0; i < cells.length; i++) {
    cells[i].removeEventListener('click', turnClick, false);
  }
  declareWinner(gameWon.player === huPlayer ? "You win!" : "You lose");
}

function declareWinner(who) {
    document.querySelector(".won-text").textContent = who;
    document.querySelector(".result-box").classList.add("show");
}
function emptySquares() {
  return origBoard.filter((elm, i) => i===elm);
}
  
function bestSpot(){
  return minimax(origBoard, aiPlayer).index;
}
  
function checkTie() {
  if (emptySquares().length === 0){
    for (cell of cells) {
      cell.style.backgroundColor = "green";
      cell.removeEventListener('click',turnClick, false);
    }
    declareWinner("Tie game");
    return true;
  } 
  return false;
}

function minimax(newBoard, player) {
  var availSpots = emptySquares(newBoard);
  
  if (checkWin(newBoard, huPlayer)) {
    return {score: -10};
  } else if (checkWin(newBoard, aiPlayer)) {
    return {score: 10};
  } else if (availSpots.length === 0) {
    return {score: 0};
  }
  
  var moves = [];
  for (let i = 0; i < availSpots.length; i ++) {
    var move = {};
    move.index = newBoard[availSpots[i]];
    newBoard[availSpots[i]] = player;
    
    if (player === aiPlayer)
      move.score = minimax(newBoard, huPlayer).score;
    else
       move.score =  minimax(newBoard, aiPlayer).score;
    newBoard[availSpots[i]] = move.index;
    if ((player === aiPlayer && move.score === 10) || (player === huPlayer && move.score === -10))
      return move;
    else 
      moves.push(move);
  }
  
  let bestMove, bestScore;
  if (player === aiPlayer) {
    bestScore = -1000;
    for(let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    bestScore = 1000;
    for(let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }
  
  return moves[bestMove];
}
