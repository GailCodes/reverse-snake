// Game configuration
const GRID_SIZE = 15;
const CELL_SIZE = 40;
const GAME_SPEED = 170;
const INITIAL_FOOD_COUNT = 8;
const INITIAL_SNAKE_LENGTH = 10;
const FOOD_CHASE_PROBABILITY = 0.25;

// Game State
let player = { x: 15, y: 15 };
let snake = [];
let foods = [];
let gameTime = 0;
let gameInterval;
let timeInterval;

// Get players highscore from localStorage
let highscore = JSON.parse(localStorage.getItem("reverseSnakeHighscore")) || {
  time: 0,
  snakeLength: 0,
};

// DOM Elements
const gameBoard = document.getElementById("game");
const scoreDisplay = document.getElementById("score");
const highscoreDisplay = document.getElementById("highscore");
const menu = document.getElementById("menu");
const gameContainer = document.getElementById("game-container");
const startButton = document.getElementById("startButton");

const gameOverPopup = document.getElementById("game-over-popup");
const finalScoreDisplay = document.getElementById("final-score");
const finalHighscoreDisplay = document.getElementById("final-highscore");
const playAgainBtn = document.getElementById("play-again-btn");

// Start game when button is clicked
startButton.addEventListener("click", startNewGame);

function startNewGame() {
  menu.style.display = "none";
  gameContainer.style.display = "flex";
  init();
}

function init() {
  gameBoard.innerHTML = "";
  gameBoard.style.gridTemplateColumns = `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`;
  gameBoard.style.width = `${GRID_SIZE * CELL_SIZE}px`;

  // Create grid cells
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.id = `cell-${x}-${y}`;
      cell.style.width = `${CELL_SIZE}px`;
      cell.style.height = `${CELL_SIZE}px`;
      gameBoard.appendChild(cell);
    }
  }

  // Spawn the snake
  snake = [];
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    snake.push({ x: 3 + i, y: 3 });
  }

  // Spawn initial food
  foods = [];
  for (let i = 0; i < INITIAL_FOOD_COUNT; i++) {
    spawnFood();
  }

  gameTime = 0;
  render();
  startGame();
}

// Game Loop
function startGame() {
  if (gameInterval) clearInterval(gameInterval);
  if (timeInterval) clearInterval(timeInterval);

  gameInterval = setInterval(gameLoop, GAME_SPEED);
  timeInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  gameTime++;
  updateScoreDisplay();
}

function gameLoop() {
  moveSnake();
  checkCollisions();
  render();
}

// Snake movement
function moveSnake() {
  const head = { ...snake[0] };
  let target;

  if (foods.length > 0 && Math.random() < FOOD_CHASE_PROBABILITY) {
    let closestFood = foods[0];
    let minDistance = GRID_SIZE * 2;

    foods.forEach((food) => {
      const dist = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestFood = food;
      }
    });

    target = closestFood;
  } else {
    target = player;
  }

  const dx = target.x - head.x;
  const dy = target.y - head.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    head.x += dx > 0 ? 1 : -1;
  } else if (dy !== 0) {
    head.y += dy > 0 ? 1 : -1;
  } else if (dx !== 0) {
    head.x += dx > 0 ? 1 : -1;
  }

  const wouldCollide = snake
    .slice(1)
    .some((segment) => segment.x === head.x && segment.y === head.y);

  if (wouldCollide) {
    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    for (const dir of directions.sort(() => Math.random() - 0.5)) {
      const newX = head.x + dir.x;
      const newY = head.y + dir.y;

      if (
        !snake.some((s) => s.x === newX && s.y === newY) &&
        newX >= 0 &&
        newX < GRID_SIZE &&
        newY >= 0 &&
        newY < GRID_SIZE
      ) {
        head.x = newX;
        head.y = newY;
        break;
      }
    }
  }

  snake.unshift(head);

  const eatenFoodIndex = foods.findIndex(
    (f) => f.x === head.x && f.y === head.y
  );
  if (eatenFoodIndex >= 0) {
    foods.splice(eatenFoodIndex, 1);
    spawnFood();
  } else {
    snake.pop();
  }
}

function spawnFood() {
  let newFood;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    attempts++;
  } while (
    (newFood.x === player.x && newFood.y === player.y) ||
    snake.some((s) => s.x === newFood.x && s.y === newFood.y) ||
    (foods.some((f) => f.x === newFood.x && f.y === newFood.y) &&
      attempts < maxAttempts)
  );

  if (attempts < maxAttempts) {
    foods.push(newFood);
  }
}

function checkCollisions() {
  const head = snake[0];

  snake.forEach((bodyPart, index) => {
    if (bodyPart.x === player.x && bodyPart.y === player.y) {
      gameOver();
      return;
    }
  });

  if (player.x < 0) player.x = 0;
  else if (player.x >= GRID_SIZE) player.x = GRID_SIZE - 1;
  if (player.y < 0) player.y = 0;
  else if (player.y >= GRID_SIZE) player.y = GRID_SIZE - 1;
}

function gameOver() {
  clearInterval(gameInterval);
  clearInterval(timeInterval);

  // Update highscore if needed
  if (gameTime > highscore.time) {
    highscore = {
      time: gameTime,
      snakeLength: snake.length,
    };
    localStorage.setItem("reverseSnakeHighscore", JSON.stringify(highscore));
    updateHighscoreDisplay();
  }

  // Show popup with scores
  finalScoreDisplay.textContent = `Your Score: ${formatTime(
    gameTime
  )} | Snake Length: ${snake.length}`;
  finalHighscoreDisplay.textContent = `Highscore: ${formatTime(
    highscore.time
  )} | Longest Snake: ${highscore.snakeLength}`;

  gameOverPopup.style.display = "flex";
}

// Add play again button handler
playAgainBtn.addEventListener("click", () => {
  gameOverPopup.style.display = "none";
  resetGame();
  startNewGame();
});

function resetGame() {
  player = { x: 15, y: 15 };
  snake = [];
  foods = [];
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

function updateScoreDisplay() {
  const timeScore = formatTime(gameTime);
  const snakeLengthScore = snake.length;

  scoreDisplay.textContent = `Time: ${timeScore} | Snake: ${snakeLengthScore} | Food: ${foods.length}`;
}

function updateHighscoreDisplay() {
  const timeScore = formatTime(highscore.time);
  const snakeLengthScore = highscore.snakeLength;

  // Update the in-game score display
  highscoreDisplay.textContent = `HIGHSCORE | Time: ${timeScore} | Snake: ${snakeLengthScore}`;
}
updateHighscoreDisplay();

function render() {
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.innerHTML = "";
    cell.className = "cell";
    cell.style.boxShadow = "";
  });

  foods.forEach((food) => {
    const cell = document.getElementById(`cell-${food.x}-${food.y}`);
    if (cell) {
      const foodElement = document.createElement("div");
      foodElement.className = "food";
      cell.appendChild(foodElement);
    }
  });

  const playerCell = document.getElementById(`cell-${player.x}-${player.y}`);
  if (playerCell) {
    const playerElement = document.createElement("div");
    playerElement.className = "player";
    playerCell.appendChild(playerElement);
  }

  snake.forEach((segment, index) => {
    const cell = document.getElementById(`cell-${segment.x}-${segment.y}`);
    if (cell) {
      const snakeElement = document.createElement("div");
      snakeElement.className = index === 0 ? "snake-head" : "snake-body";
      cell.appendChild(snakeElement);
    }
  });

  updateScoreDisplay();
}

// Controls
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
      player.y = player.y - 1;
      break;
    case "ArrowDown":
      player.y = player.y + 1;
      break;
    case "ArrowLeft":
      player.x = player.x - 1;
      break;
    case "ArrowRight":
      player.x = player.x + 1;
      break;
  }
  render();
});
