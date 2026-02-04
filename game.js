// Flappy Bird - Game Logic (Enhanced Edition)

// ============================================
// GAME SETUP
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreEl = document.getElementById('finalScore');
const highScoreEl = document.getElementById('highScore');

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;

// Milestone celebration
let milestoneText = '';
let milestoneTimer = 0;

// Power-up state
let activePowerUp = null; // 'slowmo', 'invincible', '2x'
let powerUpTimer = 0;
const POWERUP_DURATION = 300; // frames (~5 seconds)

// ============================================
// BIRD
// ============================================

const bird = {
    x: 80,
    y: 300,
    width: 40,
    height: 30,
    velocity: 0,
    baseGravity: 0.25,
    baseJumpStrength: -6,
    
    get gravity() {
        return activePowerUp === 'slowmo' ? this.baseGravity * 0.5 : this.baseGravity;
    },
    
    get jumpStrength() {
        return activePowerUp === 'slowmo' ? this.baseJumpStrength * 0.7 : this.baseJumpStrength;
    },
    
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
        // Glow effect when powered up
        if (activePowerUp === 'invincible') {
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 20;
        } else if (activePowerUp === '2x') {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
        } else if (activePowerUp === 'slowmo') {
            ctx.shadowColor = '#FF00FF';
            ctx.shadowBlur = 15;
        }
        
        // Bird body (yellow)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2, 
                    this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
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
// PIPES (with progressive difficulty & moving pipes)
// ============================================

const pipes = {
    list: [],
    width: 60,
    baseGap: 180,
    baseSpacing: 250,
    baseSpeed: 2,
    
    get gap() {
        // Shrink gap slightly every 10 points (min 120)
        const reduction = Math.floor(score / 10) * 5;
        return Math.max(120, this.baseGap - reduction);
    },
    
    get speed() {
        if (activePowerUp === 'slowmo') {
            return this.baseSpeed * 0.5;
        }
        // Speed up every 10 points
        const increase = Math.floor(score / 10) * 0.3;
        return this.baseSpeed + increase;
    },
    
    get spacing() {
        // Reduce spacing slightly as difficulty increases (min 180)
        const reduction = Math.floor(score / 10) * 10;
        return Math.max(180, this.baseSpacing - reduction);
    },
    
    reset() {
        this.list = [];
    },
    
    spawn() {
        const minY = 80;
        const maxY = canvas.height - this.gap - 80;
        const gapY = Math.random() * (maxY - minY) + minY;
        
        // Moving pipes after score 30 (20% chance)
        const isMoving = score >= 30 && Math.random() < 0.2;
        
        this.list.push({
            x: canvas.width,
            gapY: gapY,
            originalGapY: gapY,
            scored: false,
            moving: isMoving,
            moveDirection: 1,
            moveSpeed: 0.5
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
            const pipe = this.list[i];
            pipe.x -= this.speed;
            
            // Moving pipe logic
            if (pipe.moving) {
                pipe.gapY += pipe.moveDirection * pipe.moveSpeed;
                // Bounce between limits
                if (pipe.gapY < 60 || pipe.gapY > canvas.height - this.gap - 100) {
                    pipe.moveDirection *= -1;
                }
            }
            
            // Remove off-screen pipes
            if (pipe.x + this.width < 0) {
                this.list.splice(i, 1);
            }
        }
    },
    
    draw() {
        for (const pipe of this.list) {
            // Different color for moving pipes
            ctx.fillStyle = pipe.moving ? '#E74C3C' : '#2ECC71';
            
            // Top pipe
            ctx.fillRect(pipe.x, 0, this.width, pipe.gapY);
            // Top pipe cap
            ctx.fillStyle = pipe.moving ? '#C0392B' : '#27AE60';
            ctx.fillRect(pipe.x - 5, pipe.gapY - 25, this.width + 10, 25);
            
            // Bottom pipe
            ctx.fillStyle = pipe.moving ? '#E74C3C' : '#2ECC71';
            const bottomY = pipe.gapY + this.gap;
            ctx.fillRect(pipe.x, bottomY, this.width, canvas.height - bottomY);
            // Bottom pipe cap
            ctx.fillStyle = pipe.moving ? '#C0392B' : '#27AE60';
            ctx.fillRect(pipe.x - 5, bottomY, this.width + 10, 25);
        }
    },
    
    checkCollision() {
        if (activePowerUp === 'invincible') return false;
        
        for (const pipe of this.list) {
            if (bird.x + bird.width > pipe.x && bird.x < pipe.x + this.width) {
                if (bird.y < pipe.gapY || bird.y + bird.height > pipe.gapY + this.gap) {
                    return true;
                }
            }
            
            // Score when passing a pipe
            if (!pipe.scored && pipe.x + this.width < bird.x) {
                pipe.scored = true;
                const points = activePowerUp === '2x' ? 2 : 1;
                score += points;
                checkMilestone();
            }
        }
        return false;
    }
};

// ============================================
// COINS
// ============================================

const coins = {
    list: [],
    size: 20,
    
    reset() {
        this.list = [];
    },
    
    spawn(pipeGapY, pipeX) {
        // 40% chance to spawn a coin in the gap
        if (Math.random() < 0.4) {
            this.list.push({
                x: pipeX + pipes.width / 2,
                y: pipeGapY + pipes.gap / 2,
                collected: false
            });
        }
    },
    
    update() {
        const speed = activePowerUp === 'slowmo' ? pipes.baseSpeed * 0.5 : pipes.speed;
        
        for (let i = this.list.length - 1; i >= 0; i--) {
            this.list[i].x -= speed;
            
            // Remove off-screen or collected coins
            if (this.list[i].x < -this.size || this.list[i].collected) {
                this.list.splice(i, 1);
            }
        }
    },
    
    draw() {
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        
        for (const coin of this.list) {
            if (!coin.collected) {
                ctx.beginPath();
                ctx.arc(coin.x, coin.y, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Dollar sign
                ctx.fillStyle = '#B8860B';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('$', coin.x, coin.y + 4);
                ctx.fillStyle = '#FFD700';
            }
        }
    },
    
    checkCollision() {
        for (const coin of this.list) {
            if (coin.collected) continue;
            
            const dx = bird.x + bird.width/2 - coin.x;
            const dy = bird.y + bird.height/2 - coin.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < bird.width/2 + this.size/2) {
                coin.collected = true;
                const points = activePowerUp === '2x' ? 4 : 2;
                score += points;
                checkMilestone();
            }
        }
    }
};

// ============================================
// POWER-UPS
// ============================================

const powerUps = {
    list: [],
    size: 25,
    types: ['slowmo', 'invincible', '2x'],
    colors: {
        'slowmo': '#FF00FF',
        'invincible': '#00FFFF', 
        '2x': '#FFD700'
    },
    labels: {
        'slowmo': 'SLO',
        'invincible': 'INV',
        '2x': '2X'
    },
    
    reset() {
        this.list = [];
    },
    
    spawn(pipeGapY, pipeX) {
        // 15% chance to spawn a power-up (only if no active power-up)
        if (!activePowerUp && Math.random() < 0.15) {
            const type = this.types[Math.floor(Math.random() * this.types.length)];
            this.list.push({
                x: pipeX + pipes.width / 2,
                y: pipeGapY + pipes.gap / 2 + (Math.random() - 0.5) * 60,
                type: type,
                collected: false
            });
        }
    },
    
    update() {
        const speed = activePowerUp === 'slowmo' ? pipes.baseSpeed * 0.5 : pipes.speed;
        
        for (let i = this.list.length - 1; i >= 0; i--) {
            this.list[i].x -= speed;
            
            if (this.list[i].x < -this.size || this.list[i].collected) {
                this.list.splice(i, 1);
            }
        }
        
        // Update active power-up timer
        if (activePowerUp) {
            powerUpTimer--;
            if (powerUpTimer <= 0) {
                activePowerUp = null;
            }
        }
    },
    
    draw() {
        for (const pu of this.list) {
            if (pu.collected) continue;
            
            // Glowing box
            ctx.fillStyle = this.colors[pu.type];
            ctx.shadowColor = this.colors[pu.type];
            ctx.shadowBlur = 10;
            ctx.fillRect(pu.x - this.size/2, pu.y - this.size/2, this.size, this.size);
            ctx.shadowBlur = 0;
            
            // Label
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.labels[pu.type], pu.x, pu.y + 4);
        }
    },
    
    checkCollision() {
        for (const pu of this.list) {
            if (pu.collected) continue;
            
            const dx = bird.x + bird.width/2 - pu.x;
            const dy = bird.y + bird.height/2 - pu.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < bird.width/2 + this.size/2) {
                pu.collected = true;
                activePowerUp = pu.type;
                powerUpTimer = POWERUP_DURATION;
            }
        }
    }
};

// ============================================
// MILESTONES
// ============================================

function checkMilestone() {
    const milestones = {
        10: 'Nice! 🎉',
        25: 'Amazing! 🔥',
        50: 'Incredible! ⭐',
        75: 'Legendary! 👑',
        100: 'GODLIKE! 🏆'
    };
    
    if (milestones[score]) {
        milestoneText = milestones[score];
        milestoneTimer = 120; // Show for ~2 seconds
    }
}

function drawMilestone() {
    if (milestoneTimer > 0) {
        milestoneTimer--;
        
        // Fade effect
        const alpha = Math.min(1, milestoneTimer / 30);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeText(milestoneText, canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText(milestoneText, canvas.width / 2, canvas.height / 2 - 50);
    }
}

// ============================================
// GROUND
// ============================================

const ground = {
    y: canvas.height - 50,
    
    draw() {
        ctx.fillStyle = '#8BC34A';
        ctx.fillRect(0, this.y, canvas.width, 20);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, this.y + 20, canvas.width, 30);
    },
    
    checkCollision() {
        if (activePowerUp === 'invincible') return false;
        return bird.y + bird.height > this.y || bird.y < 0;
    }
};

// ============================================
// SCORE & POWER-UP DISPLAY
// ============================================

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeText(score, canvas.width / 2, 60);
    ctx.fillText(score, canvas.width / 2, 60);
    
    // Show active power-up
    if (activePowerUp) {
        const barWidth = 100;
        const barHeight = 10;
        const barX = canvas.width / 2 - barWidth / 2;
        const barY = 75;
        const progress = powerUpTimer / POWERUP_DURATION;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = powerUps.colors[activePowerUp];
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.fillText(activePowerUp.toUpperCase(), canvas.width / 2, barY + 25);
    }
}

// ============================================
// GAME LOOP
// ============================================

let lastPipeCount = 0;

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
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
        bird.update();
        pipes.update();
        coins.update();
        powerUps.update();
        
        // Spawn coins and power-ups with new pipes
        if (pipes.list.length > lastPipeCount) {
            const newPipe = pipes.list[pipes.list.length - 1];
            coins.spawn(newPipe.gapY, newPipe.x);
            powerUps.spawn(newPipe.gapY, newPipe.x);
        }
        lastPipeCount = pipes.list.length;
        
        // Check collisions
        coins.checkCollision();
        powerUps.checkCollision();
        
        if (pipes.checkCollision() || ground.checkCollision()) {
            gameState = 'gameover';
            finalScoreEl.textContent = score;
            
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('flappyHighScore', highScore);
                highScoreEl.textContent = highScore + ' (NEW!)';
            } else {
                highScoreEl.textContent = highScore;
            }
            
            gameOverScreen.classList.remove('hidden');
        }
    }
    
    // Draw everything
    pipes.draw();
    coins.draw();
    powerUps.draw();
    ground.draw();
    bird.draw();
    drawScore();
    drawMilestone();
    
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
        gameState = 'playing';
        score = 0;
        lastPipeCount = 0;
        activePowerUp = null;
        powerUpTimer = 0;
        bird.reset();
        pipes.reset();
        coins.reset();
        powerUps.reset();
        gameOverScreen.classList.add('hidden');
        bird.jump();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        handleInput();
    }
});

document.addEventListener('click', handleInput);
document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput();
});

// ============================================
// START GAME
// ============================================

document.getElementById('startHighScore').textContent = highScore;
gameLoop();
