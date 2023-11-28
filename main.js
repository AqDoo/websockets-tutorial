import { createBoard, playMove } from "./connect4.js";

function initGame(websocket) {
  websocket.addEventListener("open", () => {
    // Send an "init" event according to who is connecting.
    const params = new URLSearchParams(window.location.search);
    let event = { type: "init" };
    if (params.has("join")) {
      // Second player joins an existing game.
      event.join = params.get("join");
    } else if (params.has("watch")) {
      // Spectator watches an existing game.
      event.watch = params.get("watch");
    } else {
      // First player starts a new game.
    }
    websocket.send(JSON.stringify(event));
  });
}

function showMessage(message) {
  window.setTimeout(() => window.alert(message), 50);
}

function receiveMoves(board, websocket) {
  let moveCounter = 0;

  websocket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
    switch (event.type) {
      case "init":
        document.querySelector(".join").href = "?join=" + event.join;
        document.querySelector(".watch").href = "?watch=" + event.watch;
        break;
      case "play":
        playMove(board, event.player, event.column, event.row);
        moveCounter = event.move_counter;
        updateMoveCounter(moveCounter); // Вызываем функцию обновления счетчика
        break;
      case "win":
        showMessage(`Player ${event.player} wins!`);
        websocket.close(1000);
        break;
      case "error":
        showMessage(event.message);
        break;
      default:
        throw new Error(`Unsupported event type: ${event.type}.`);
    }
  });

  // Добавляем функцию для обновления счетчика ходов в HTML
  function updateMoveCounter(counter) {
    document.getElementById("move-counter").innerText = `Move Counter: ${counter}`;
  }
}



function sendMoves(board, websocket) {
  // Don't send moves for a spectator watching a game.
  const params = new URLSearchParams(window.location.search);
  if (params.has("watch")) {
    return;
  }

  // When clicking a column, send a "play" event for a move in that column.
  board.addEventListener("click", ({ target }) => {
    const column = target.dataset.column;
    // Ignore clicks outside a column.
    if (column === undefined) {
      return;
    }
    const event = {
      type: "play",
      column: parseInt(column, 10),
    };
    websocket.send(JSON.stringify(event));
  });
}

window.addEventListener("DOMContentLoaded", () => {
  // Initialize the UI.
  const board = document.querySelector(".board");
  createBoard(board);
  // Open the WebSocket connection and register event handlers.
  const websocket = new WebSocket("ws://localhost:8001/");
  initGame(websocket);
  receiveMoves(board, websocket);
  sendMoves(board, websocket);
});