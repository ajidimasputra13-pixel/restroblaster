// Dapatkan elemen kanvas dan konteks 2D
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ukuran kanvas
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// Objek pemain (pesawat)
let player = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 50,
    width: 50,
    height: 50,
    speed: 5,
    bullets: []
};

// Objek asteroid
let asteroids = [];

// Skor dan status game
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let lives = 3;
let gameOver = false;
let isGameStarted = false;
let isLeaderboardVisible = false;
let asteroidInterval;

// Variabel baru untuk nama pemain dan leaderboard
let playerName = '';
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

// Elemen HTML untuk menampilkan skor dan tombol
const currentScoreElement = document.getElementById('currentScore');
const highScoreElement = document.getElementById('highScore');
const livesDisplayElement = document.getElementById('livesDisplay').querySelector('span');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const startButton = document.getElementById('startButton');
const retryButton = document.getElementById('retryButton');
const returnToStartButton = document.getElementById('returnToStartButton');
const twitterInput = document.getElementById('twitterInput');
const leaderboardContainer = document.getElementById('leaderboardContainer');
const leaderboardList = document.getElementById('leaderboardList');
const showLeaderboardButton = document.getElementById('showLeaderboardButton');
const closeLeaderboardButton = document.getElementById('closeLeaderboardButton');

highScoreElement.innerText = highScore;

// --- MUAT ASET (GAMBAR) ---
const spaceshipImage = new Image();
spaceshipImage.src = 'pesawat.png';

const backgroundImage = new Image();
backgroundImage.src = 'background.png';

const enemyImage = new Image();
enemyImage.src = 'enemy.png';

// --- FUNGSI UTAMA GAME ---

function resetGame() {
    clearInterval(asteroidInterval);
    score = 0;
    lives = 3;
    gameOver = false;
    isGameStarted = false;
    isLeaderboardVisible = false;
    asteroids = [];
    player.bullets = [];
    player.x = CANVAS_WIDTH / 2;
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    leaderboardContainer.style.display = 'none';
    updateScoreDisplay();
    updateLivesDisplay();
}

function saveScore() {
    if (playerName) {
        leaderboard.push({ name: playerName, score: score });
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10);
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }
}

function displayLeaderboard() {
    leaderboardList.innerHTML = '';
    leaderboard.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.innerText = `${index + 1}. ${item.name}: ${item.score}`;
        leaderboardList.appendChild(listItem);
    });
}

function drawBackground() {
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
}

function drawPlayer() {
    if (spaceshipImage.complete) {
        ctx.drawImage(spaceshipImage, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    } else {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - 15);
        ctx.lineTo(player.x - 15, player.y + 15);
        ctx.lineTo(player.x + 15, player.y + 15);
        ctx.closePath();
        ctx.fill();
    }
}

function drawAsteroids() {
    asteroids.forEach(asteroid => {
        if (enemyImage.complete) {
            ctx.drawImage(enemyImage, asteroid.x - asteroid.radius, asteroid.y - asteroid.radius, asteroid.radius * 2, asteroid.radius * 2);
        } else {
            ctx.fillStyle = 'gray';
            ctx.beginPath();
            ctx.arc(asteroid.x, asteroid.y, asteroid.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawBullets() {
    player.bullets.forEach(bullet => {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateBullets() {
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        player.bullets[i].y -= player.bullets[i].speed;
        if (player.bullets[i].y < 0) {
            player.bullets.splice(i, 1);
        }
    }
}

function fireBullet() {
    player.bullets.push({
        x: player.x,
        y: player.y - 15,
        radius: 3,
        speed: 7
    });
}

function spawnAsteroid() {
    let radius = Math.random() * 20 + 10;
    let x = Math.random() * (CANVAS_WIDTH - radius * 2) + radius;
    let y = -radius;
    let speed = Math.random() * 2 + 1;

    asteroids.push({x, y, radius, speed});
}

function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].y += asteroids[i].speed;
        if (asteroids[i].y > CANVAS_HEIGHT + asteroids[i].radius) {
            lives--;
            updateLivesDisplay();
            asteroids.splice(i, 1);
            if (lives <= 0) {
                gameOver = true;
            }
        }
    }
}

function checkCollisions() {
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
            let bullet = player.bullets[i];
            let asteroid = asteroids[j];
            let distance = Math.sqrt(
                Math.pow(bullet.x - asteroid.x, 2) + Math.pow(bullet.y - asteroid.y, 2)
            );
            if (distance < bullet.radius + asteroid.radius) {
                score += Math.floor(asteroid.radius);
                player.bullets.splice(i, 1);
                asteroids.splice(j, 1);
                break;
            }
        }
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        let asteroid = asteroids[i];
        let distance = Math.sqrt(
            Math.pow(player.x - asteroid.x, 2) + Math.pow(player.y - asteroid.y, 2)
        );
        if (distance < player.width / 2 + asteroid.radius) {
            gameOver = true;
            break;
        }
    }

    if (gameOver) {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }
        saveScore();
    }
}

function updateScoreDisplay() {
    currentScoreElement.innerText = score;
    highScoreElement.innerText = highScore;
}

function updateLivesDisplay() {
    livesDisplayElement.innerText = lives;
}

function gameLoop() {
    requestAnimationFrame(gameLoop);

    if (!isGameStarted) {
        if (isLeaderboardVisible) {
            startScreen.style.display = 'none';
            gameOverScreen.style.display = 'none';
            leaderboardContainer.style.display = 'flex';
            displayLeaderboard();
        } else {
            startScreen.style.display = 'flex';
            gameOverScreen.style.display = 'none';
            leaderboardContainer.style.display = 'none';
        }
        return;
    }

    if (gameOver) {
        clearInterval(asteroidInterval);
        gameOverScreen.style.display = 'flex';
        finalScoreElement.innerText = score;
        return;
    }

    drawBackground();
    updateBullets();
    updateAsteroids();
    checkCollisions();
    drawPlayer();
    drawBullets();
    drawAsteroids();
    updateScoreDisplay();
    updateLivesDisplay();
}

document.addEventListener('keydown', (e) => {
    if (!isGameStarted || gameOver || isLeaderboardVisible) return;
    
    if (e.key === 'ArrowLeft' && player.x > player.width / 2) {
        player.x -= player.speed;
    }
    if (e.key === 'ArrowRight' && player.x < CANVAS_WIDTH - player.width / 2) {
        player.x += player.speed;
    }
    if (e.key === ' ' && !gameOver) {
        fireBullet();
    }
});

startButton.addEventListener('click', () => {
    const inputName = twitterInput.value.trim();
    if (inputName) {
        playerName = inputName;
        isGameStarted = true;
        startScreen.style.display = 'none';
        asteroidInterval = setInterval(spawnAsteroid, 1000);
    } else {
        alert('Mohon masukkan nama Twitter Anda untuk memulai!');
    }
});

retryButton.addEventListener('click', () => {
    resetGame();
    twitterInput.value = '';
    isGameStarted = true;
    asteroidInterval = setInterval(spawnAsteroid, 1000);
});

returnToStartButton.addEventListener('click', () => {
    resetGame();
    twitterInput.value = '';
});

showLeaderboardButton.addEventListener('click', () => {
    isLeaderboardVisible = true;
});

closeLeaderboardButton.addEventListener('click', () => {
    isLeaderboardVisible = false;
});

gameLoop();