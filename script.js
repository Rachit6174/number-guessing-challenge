"use strict";

const LEVELS = {
  easy: { label: "Easy", max: 50, attempts: 10 },
  medium: { label: "Medium", max: 100, attempts: 7 },
  hard: { label: "Hard", max: 200, attempts: 5 },
};

const $ = (selector) => document.querySelector(selector);
const startPanel = $("#start-panel");
const gamePanel = $("#game-panel");
const resultPanel = $("#result-panel");
const difficultySelect = $("#difficulty");
const guessInput = $("#guess-input");
const playerNameInput = $("#player-name");
const guessForm = $("#guess-form");
const feedback = $("#feedback");

let secretNumber = null;
let currentLevel = LEVELS.medium;
let attemptsLeft = 0;
let guesses = [];
let gameFinished = false;

function showPanel(panel) {
  [startPanel, gamePanel, resultPanel].forEach((item) => item.classList.add("hidden"));
  panel.classList.remove("hidden");
}

function updateDifficultyPreview() {
  const level = LEVELS[difficultySelect.value];
  $("#range-preview").textContent = `1 to ${level.max}`;
  $("#tries-preview").textContent = `${level.attempts} ${level.attempts === 1 ? "chance" : "chances"}`;
}

function createAttemptDots() {
  const container = $("#attempt-dots");
  container.replaceChildren();

  for (let i = 0; i < currentLevel.attempts; i += 1) {
    const dot = document.createElement("span");
    dot.className = "attempt-dot";
    dot.setAttribute("aria-hidden", "true");
    container.append(dot);
  }

  container.setAttribute("aria-label", `${attemptsLeft} chances remaining`);
}

function updateAttempts() {
  $("#attempts-left").textContent = attemptsLeft;
  $("#attempts-total").textContent = currentLevel.attempts;

  $("#attempt-dots").querySelectorAll(".attempt-dot").forEach((dot, index) => {
    dot.classList.toggle("used", index >= attemptsLeft);
  });

  $("#attempt-dots").setAttribute("aria-label", `${attemptsLeft} chances remaining`);
}

function startGame() {
  currentLevel = LEVELS[difficultySelect.value];
  secretNumber = Math.floor(Math.random() * currentLevel.max) + 1;
  attemptsLeft = currentLevel.attempts;
  guesses = [];
  gameFinished = false;

  $("#level-badge").textContent = currentLevel.label.toUpperCase();
  $("#range-label").textContent = `01 — ${String(currentLevel.max).padStart(3, "0")}`;
  $("#guess-history").replaceChildren();

  const empty = document.createElement("span");
  empty.className = "empty-history";
  empty.textContent = "Your guesses will appear here";
  $("#guess-history").append(empty);

  feedback.textContent = "Make your first guess. You’ve got this.";
  feedback.className = "feedback";
  guessInput.min = "1";
  guessInput.max = String(currentLevel.max);
  guessInput.value = "";

  createAttemptDots();
  updateAttempts();
  showPanel(gamePanel);
  guessInput.focus();
}

function addGuessToHistory(guess, direction) {
  const history = $("#guess-history");

  if (!guesses.length) {
    history.replaceChildren();
  }

  const chip = document.createElement("span");
  chip.className = `guess-chip ${direction}`;
  chip.textContent = String(guess);
  history.append(chip);
}

function setFeedback(message, type = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`.trim();
}

function getBestScore() {
  try {
    return Number(localStorage.getItem(`number-guess-best-${difficultySelect.value}`)) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score) {
  const best = getBestScore();

  if (score <= best) {
    return best;
  }

  try {
    localStorage.setItem(`number-guess-best-${difficultySelect.value}`, String(score));
  } catch {
    // The game still works if browser storage is unavailable.
  }

  return score;
}

function endGame(won) {
  gameFinished = true;

  const score = won
    ? Math.max(100, (currentLevel.max * 10) - ((guesses.length - 1) * 75))
    : 0;

  const best = won ? saveBestScore(score) : getBestScore();

  $("#result-icon").textContent = won ? "✦" : "↗️";
  $("#result-icon").classList.toggle("loss", !won);
  resultPanel.classList.toggle("loss", !won);
  $("#result-kicker").textContent = won ? "WELL PLAYED" : "ROUND COMPLETE";

  const playerName = playerNameInput.value.trim();

  $("#result-title").textContent = won
    ? (playerName ? `You did it, ${playerName}!` : "You found it!")
    : (playerName ? `So close, ${playerName}!` : "So close!");

  $("#result-message").textContent = won
    ? (playerName
      ? `Congratulations, ${playerName}! Your sharp guessing paid off.`
      : "Congratulations! Your sharp guessing paid off.")
    : (playerName
      ? `Great effort, ${playerName}. Try again and beat your score!`
      : "Great effort. Try again and beat your score!");

  $("#secret-number").textContent = secretNumber;
  $("#result-guesses").textContent = guesses.length;
  $("#result-score").textContent = score.toLocaleString();
  $("#best-score").textContent = best ? best.toLocaleString() : "—";

  showPanel(resultPanel);
  $("#play-again-button").focus();
}

guessForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (gameFinished) {
    return;
  }

  const raw = guessInput.value.trim();
  const guess = Number(raw);

  if (!raw || !Number.isInteger(guess) || guess < 1 || guess > currentLevel.max) {
    setFeedback(`Enter a whole number from 1 to ${currentLevel.max}.`, "error");
    guessInput.focus();
    return;
  }

  if (guesses.includes(guess)) {
    setFeedback("You already tried that number. Give another one a go.", "warning");
    guessInput.select();
    return;
  }

  guesses.push(guess);
  attemptsLeft -= 1;

  if (guess === secretNumber) {
    addGuessToHistory(guess, "");
    updateAttempts();
    endGame(true);
    return;
  }

  const isLow = guess < secretNumber;
  addGuessToHistory(guess, isLow ? "low" : "high");
  updateAttempts();

  if (attemptsLeft === 0) {
    endGame(false);
    return;
  }

  setFeedback(
    isLow ? "Too low. Try a higher number ↑" : "Too high. Try a lower number ↓",
    isLow ? "success" : "warning"
  );

  guessInput.value = "";
  guessInput.focus();
});

difficultySelect.addEventListener("change", updateDifficultyPreview);
$("#start-button").addEventListener("click", startGame);
$("#play-again-button").addEventListener("click", startGame);
$("#quit-button").addEventListener("click", () => showPanel(startPanel));
$("#change-level-button").addEventListener("click", () => showPanel(startPanel));

updateDifficultyPreview();
