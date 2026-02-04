// Flappy Bird - Game Logic

// ============================================
// GAME SETUP
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreEl = document.getElementById('finalScore');

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;

// ============================================
// BIRD
// ============================================

const bird = {
    x: 80,
    y: 300,
    width: 40,
    height: 30,
    velocity: 0,
    gravity: 0.5,
    jumpStrength: -9,
    
    reset() {
        this.y = 300;
        this.velocity = 0;
    },
    
    jump() {
        this.velocity = this.jumpStrength;
    },
    
    update() {
        this.velocity += this.gravity;
        this.y += this.velocity;
    },
    
    draw() {
        // Bird body (yellow)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2, 
                    this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird eye (white + black)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 28, this.y + 10, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 30, this.y + 10, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird beak (orange)
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.moveTo(this.x + 35, this.y + 15);
        ctx.lineTo(this.x + 50, this.y + 18);
        ctx.lineTo(this.x + 35, this.y + 22);
        ctx.closePath();
        ctx.fill();
        
        // Wing
        ctx.fillStyle = '#E6B800';
        ctx.beginPath();
        ctx.ellipse(this.x + 15, this.y + 18, 10, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }
};

// ============================================
// PIPES
// ============================================

const pipes = {
    list: [],
    width: 60,
    gap: 160,        // Vertical gap between top and bottom pipe
    spacing: 220,    // Horizontal spacing between pipes
    speed: 3,
    
    reset() {
        this.list = [];
    },
    
    spawn() {
        // Random gap position (leaving room at top and bottom)
        const minY = 80;
        const maxY = canvas.height - this.gap - 80;
        const gapY = Math.random() * (maxY - minY) + minY;
        
        this.list.push({
            x: canvas.width,
            gapY: gapY,
            scored: false
        });
    },
    
    update() {
        // Spawn new pipes
        if (this.list.length === 0 || 
            this.list[this.list.length - 1].x < canvas.width - this.spacing) {
            this.spawn();
        }
        
        // Move and clean up pipes
        for (let i = this.list.length - 1; i >= 0; i--) {
            this.list[i].x -= this.speed;
            
            // Remove off-screen pipes
            if (this.list[i].x + this.width < 0) {
                this.list.splice(i, 1);
            }
        }
    },
    
    draw() {
        ctx.fillStyle = '#2ECC71';
        
        for (const pipe of this.list) {
            // Top pipe
            ctx.fillRect(pipe.x, 0, this.width, pipe.gapY);
            // Top pipe cap
            ctx.fillStyle = '#27AE60';
            ctx.fillRect(pipe.x - 5, pipe.gapY - 25, this.width + 10, 25);
            ctx.fillStyle = '#2ECC71';
            
            // Bottom pipe
            const bottomY = pipe.gapY + this.gap;
            ctx.fillRect(pipe.x, bottomY, this.width, canvas.height - bottomY);
            // Bottom pipe cap
            ctx.fillStyle = '#27AE60';
            ctx.fillRect(pipe.x - 5, bottomY, this.width + 10, 25);
            ctx.fillStyle = '#2ECC71';
        }
    },
    
    checkCollision() {
        for (const pipe of this.list) {
            // Check if bird is horizontally aligned with pipe
            if (bird.x + bird.width > pipe.x && bird.x < pipe.x + this.width) {
                // Check collision with top or bottom pipe
                if (bird.y < pipe.gapY || bird.y + bird.height > pipe.gapY + this.gap) {
                    return true;
                }
            }
            
            // Score when passing a pipe
            if (!pipe.scored && pipe.x + this.width < bird.x) {
                pipe.scored = true;
                score++;
            }
        }
        return false;
    }
};

// ============================================
// GROUND
// ============================================

const ground = {
    y: canvas.height - 50,
    
    draw() {
        // Grass
        ctx.fillStyle = '#8BC34A';
        ctx.fillRect(0, this.y, canvas.width, 20);
        
        // Dirt
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, this.y + 20, canvas.width, 30);
    },
    
    checkCollision() {
        return bird.y + bird.height > this.y || bird.y < 0;
    }
};

// ============================================
// SCORE DISPLAY
// ============================================

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeText(score, canvas.width / 2, 60);
    ctx.fillText(score, canvas.width / 2, 60);
}

// ============================================
// GAME LOOP
// ============================================

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky gradient (already set as background, but we can add clouds)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(100, 80, 30, 0, Math.PI * 2);
    ctx.arc(130, 70, 40, 0, Math.PI * 2);
    ctx.arc(170, 80, 30, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(300, 120, 25, 0, Math.PI * 2);
    ctx.arc(330, 110, 35, 0, Math.PI * 2);
    ctx.arc(360, 120, 25, 0, Math.PI * 2);
    ctx.fill();
    
    if (gameState === 'playing') {
        // Update game objects
        bird.update();
        pipes.update();
        
        // Check collisions
        if (pipes.checkCollision() || ground.checkCollision()) {
            gameState = 'gameover';
            finalScoreEl.textContent = score;
            gameOverScreen.classList.remove('hidden');
        }
    }
    
    // Draw everything
    pipes.draw();
    ground.draw();
    bird.draw();
    drawScore();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// ============================================
// INPUT HANDLING
// ============================================

function handleInput() {
    if (gameState === 'start') {
        gameState = 'playing';
        startScreen.classList.add('hidden');
        bird.jump();
    } else if (gameState === 'playing') {
        bird.jump();
    } else if (gameState === 'gameover') {
        // Reset game
        gameState = 'playing';
        score = 0;
        bird.reset();
        pipes.reset();
        gameOverScreen.classList.add('hidden');
        bird.jump();
    }
}

// Keyboard input
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        handleInput();
    }
});

// Mouse/touch input
canvas.addEventListener('click', handleInput);
document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput();
});

// ============================================
// START GAME
// ============================================

gameLoop();
