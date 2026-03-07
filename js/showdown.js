// Clase para la modalidad Showdown (2 jugadores)
export class ShowdownGame {
    constructor() {
        console.log('=== INICIO CONSTRUCTOR SHOWDOWN GAME ===');
        
        // Configuración del juego
        this.config = {
            width: window.innerWidth,
            height: window.innerHeight,
            playerSpeed: 5,
            jumpPower: 12,
            gravity: 0.5,
            groundLevel: 100
        };

        // Canvas 2D
        this.canvas = document.getElementById('showdown-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;

        // Estado del juego
        this.gameOver = false;
        this.paused = false;
        this.keys = {};

        // Jugadores
        this.players = {
            p1: {
                x: this.config.width * 0.3,
                y: this.config.height - 200,
                width: 40,
                height: 60,
                velocityX: 0,
                velocityY: 0,
                health: 100,
                gems: 0,
                color: '#4169E1', // Azul
                isJumping: false,
                isGrounded: false,
                facing: 1 // 1 = derecha, -1 = izquierda
            },
            p2: {
                x: this.config.width * 0.7,
                y: this.config.height - 200,
                width: 40,
                height: 60,
                velocityX: 0,
                velocityY: 0,
                health: 100,
                gems: 0,
                color: '#DC143C', // Rojo
                isJumping: false,
                isGrounded: false,
                facing: -1
            }
        };

        // Plataformas
        this.platforms = [
            { x: 0, y: this.config.height - 50, width: this.config.width, height: 50, color: '#8B4513' }, // Suelo
            { x: 200, y: this.config.height - 200, width: 150, height: 20, color: '#654321' },
            { x: this.config.width - 350, y: this.config.height - 200, width: 150, height: 20, color: '#654321' },
            { x: this.config.width / 2 - 75, y: this.config.height - 350, width: 150, height: 20, color: '#654321' },
            { x: 100, y: this.config.height - 450, width: 100, height: 20, color: '#654321' },
            { x: this.config.width - 200, y: this.config.height - 450, width: 100, height: 20, color: '#654321' }
        ];

        // Enemigos
        this.enemies = [];
        this.maxEnemies = 3;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 3000; // 3 segundos

        // Gemas
        this.gems = [];
        this.maxGems = 5;
        this.gemSpawnTimer = 0;
        this.gemSpawnInterval = 2000; // 2 segundos

        // Proyectiles
        this.projectiles = [];

        // Efectos visuales
        this.particles = [];

        // Inicialización
        this.setupControls();
        this.updateHUD();
        this.gameLoop();
        
        console.log('Constructor ShowdownGame completado');
    }

    setupControls() {
        // Controles P1 (WASD + Espacio + F)
        // Controles P2 (Flechas + Enter + Shift)

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Pausar con P o Escape
            if ((e.code === 'KeyP' || e.code === 'Escape') && !this.gameOver) {
                this.paused = !this.paused;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    handleInput() {
        if (this.gameOver || this.paused) return;

        // Jugador 1 (WASD)
        const p1 = this.players.p1;
        
        // Movimiento horizontal P1
        if (this.keys['KeyA']) {
            p1.velocityX = -this.config.playerSpeed;
            p1.facing = -1;
        } else if (this.keys['KeyD']) {
            p1.velocityX = this.config.playerSpeed;
            p1.facing = 1;
        } else {
            p1.velocityX *= 0.8; // Fricción
        }

        // Salto P1
        if ((this.keys['KeyW'] || this.keys['Space']) && p1.isGrounded) {
            p1.velocityY = -this.config.jumpPower;
            p1.isJumping = true;
            p1.isGrounded = false;
        }

        // Ataque P1
        if (this.keys['KeyF']) {
            this.playerAttack(p1);
            this.keys['KeyF'] = false; // Evitar disparo continuo
        }

        // Jugador 2 (Flechas)
        const p2 = this.players.p2;
        
        // Movimiento horizontal P2
        if (this.keys['ArrowLeft']) {
            p2.velocityX = -this.config.playerSpeed;
            p2.facing = -1;
        } else if (this.keys['ArrowRight']) {
            p2.velocityX = this.config.playerSpeed;
            p2.facing = 1;
        } else {
            p2.velocityX *= 0.8; // Fricción
        }

        // Salto P2
        if ((this.keys['ArrowUp'] || this.keys['Enter']) && p2.isGrounded) {
            p2.velocityY = -this.config.jumpPower;
            p2.isJumping = true;
            p2.isGrounded = false;
        }

        // Ataque P2
        if (this.keys['ArrowRight'] || this.keys['ShiftRight'] || this.keys['ShiftLeft']) {
            this.playerAttack(p2);
            this.keys['ArrowRight'] = false;
            this.keys['ShiftRight'] = false;
            this.keys['ShiftLeft'] = false;
        }
    }

    playerAttack(player) {
        // Crear proyectil
        const projectile = {
            x: player.x + (player.facing > 0 ? player.width / 2 : -player.width / 2),
            y: player.y,
            width: 10,
            height: 5,
            velocityX: player.facing * 8,
            velocityY: 0,
            color: player.color,
            owner: player === this.players.p1 ? 'p1' : 'p2'
        };
        this.projectiles.push(projectile);
    }

    updatePhysics() {
        // Actualizar jugadores
        for (const playerId in this.players) {
            const player = this.players[playerId];
            
            // Aplicar gravedad
            if (!player.isGrounded) {
                player.velocityY += this.config.gravity;
            }

            // Actualizar posición
            player.x += player.velocityX;
            player.y += player.velocityY;

            // Límites de pantalla
            if (player.x < 0) player.x = 0;
            if (player.x + player.width > this.config.width) player.x = this.config.width - player.width;

            // Colisión con plataformas
            player.isGrounded = false;
            for (const platform of this.platforms) {
                if (this.checkCollision(player, platform)) {
                    // Colisión desde arriba
                    if (player.velocityY > 0 && player.y < platform.y) {
                        player.y = platform.y - player.height;
                        player.velocityY = 0;
                        player.isGrounded = true;
                        player.isJumping = false;
                    }
                }
            }
        }

        // Actualizar proyectiles
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.x += projectile.velocityX;
            projectile.y += projectile.velocityY;

            // Eliminar si sale de pantalla
            if (projectile.x < 0 || projectile.x > this.config.width) {
                return false;
            }

            // Colisión con jugadores
            for (const playerId in this.players) {
                const player = this.players[playerId];
                if (projectile.owner !== playerId && this.checkCollision(projectile, player)) {
                    player.health -= 10;
                    this.createParticles(player.x + player.width / 2, player.y + player.height / 2, '#FF0000');
                    return false;
                }
            }

            // Colisión con enemigos
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (this.checkCollision(projectile, enemy)) {
                    this.enemies.splice(i, 1);
                    this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#FF00FF');
                    
                    // Dar gemas al jugador que atacó
                    const player = projectile.owner === 'p1' ? this.players.p1 : this.players.p2;
                    player.gems += 1;
                    
                    return false;
                }
            }

            return true;
        });

        // Actualizar enemigos
        this.updateEnemies();

        // Actualizar gemas
        this.updateGems();

        // Actualizar partículas
        this.updateParticles();

        // Verificar condición de victoria
        this.checkWinCondition();
    }

    updateEnemies() {
        // Spawn de enemigos
        this.enemySpawnTimer += 16; // Aproximadamente 60 FPS
        if (this.enemySpawnTimer >= this.enemySpawnInterval && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }

        // Actualizar posición de enemigos
        for (const enemy of this.enemies) {
            // Movimiento simple hacia el jugador más cercano
            const p1 = this.players.p1;
            const p2 = this.players.p2;
            
            const distToP1 = Math.abs(enemy.x - p1.x);
            const distToP2 = Math.abs(enemy.x - p2.x);
            const target = distToP1 < distToP2 ? p1 : p2;
            
            if (enemy.x < target.x) {
                enemy.x += 1;
            } else {
                enemy.x -= 1;
            }

            // Colisión con jugadores
            if (this.checkCollision(enemy, p1)) {
                p1.health -= 1;
                this.createParticles(p1.x + p1.width / 2, p1.y + p1.height / 2, '#FF0000');
            }
            if (this.checkCollision(enemy, p2)) {
                p2.health -= 1;
                this.createParticles(p2.x + p2.width / 2, p2.y + p2.height / 2, '#FF0000');
            }
        }
    }

    updateGems() {
        // Spawn de gemas
        this.gemSpawnTimer += 16;
        if (this.gemSpawnTimer >= this.gemSpawnInterval && this.gems.length < this.maxGems) {
            this.spawnGem();
            this.gemSpawnTimer = 0;
        }

        // Verificar recolección de gemas
        for (let i = this.gems.length - 1; i >= 0; i--) {
            const gem = this.gems[i];
            
            for (const playerId in this.players) {
                const player = this.players[playerId];
                if (this.checkCollision(gem, player)) {
                    player.gems += 5;
                    this.createParticles(gem.x + gem.width / 2, gem.y + gem.height / 2, '#00FF00');
                    this.gems.splice(i, 1);
                    break;
                }
            }
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityY += 0.2; // Gravedad
            particle.life -= 2;
            return particle.life > 0;
        });
    }

    spawnEnemy() {
        const enemy = {
            x: Math.random() < 0.5 ? 50 : this.config.width - 50,
            y: this.config.height - 150,
            width: 30,
            height: 30,
            velocityX: 0,
            velocityY: 0,
            color: '#9400D3' // Púrpura
        };
        this.enemies.push(enemy);
    }

    spawnGem() {
        const gem = {
            x: Math.random() * (this.config.width - 20) + 10,
            y: Math.random() * 200 + 100,
            width: 20,
            height: 20,
            color: '#FFD700' // Dorado
        };
        this.gems.push(gem);
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 5,
                velocityY: (Math.random() - 0.5) * 5,
                color: color,
                life: 100
            });
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    checkWinCondition() {
        const p1 = this.players.p1;
        const p2 = this.players.p2;

        if (p1.health <= 0 || p2.health <= 0) {
            this.gameOver = true;
        }
    }

    updateHUD() {
        document.getElementById('p1-health').textContent = Math.max(0, this.players.p1.health);
        document.getElementById('p1-gems').textContent = this.players.p1.gems;
        document.getElementById('p2-health').textContent = Math.max(0, this.players.p2.health);
        document.getElementById('p2-gems').textContent = this.players.p2.gems;
    }

    render() {
        // Limpiar canvas
        this.ctx.fillStyle = '#87CEEB'; // Cielo azul
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar plataformas
        for (const platform of this.platforms) {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }

        // Dibujar gemas
        for (const gem of this.gems) {
            this.ctx.fillStyle = gem.color;
            this.ctx.beginPath();
            this.ctx.arc(gem.x + gem.width / 2, gem.y + gem.height / 2, gem.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Dibujar enemigos
        for (const enemy of this.enemies) {
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }

        // Dibujar proyectiles
        for (const projectile of this.projectiles) {
            this.ctx.fillStyle = projectile.color;
            this.ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
        }

        // Dibujar jugadores
        for (const playerId in this.players) {
            const player = this.players[playerId];
            this.ctx.fillStyle = player.color;
            this.ctx.fillRect(player.x, player.y, player.width, player.height);
            
            // Dibujar dirección
            this.ctx.fillStyle = '#FFFFFF';
            const eyeX = player.facing > 0 ? player.x + player.width - 10 : player.x + 5;
            this.ctx.fillRect(eyeX, player.y + 10, 5, 5);
        }

        // Dibujar partículas
        for (const particle of this.particles) {
            this.ctx.globalAlpha = particle.life / 100;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, 3, 3);
        }
        this.ctx.globalAlpha = 1.0;

        // Dibujar UI de pausa
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSA', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Presiona P para continuar', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }

        // Dibujar game over
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            
            const winner = this.players.p1.health > 0 ? 'JUGADOR 1' : 'JUGADOR 2';
            this.ctx.fillText(`${winner} GANA!`, this.canvas.width / 2, this.canvas.height / 2);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Presiona ESC para volver al menú', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }

    gameLoop() {
        const loop = () => {
            if (!this.gameOver) {
                this.handleInput();
                this.updatePhysics();
                this.updateHUD();
            }
            
            this.render();
            requestAnimationFrame(loop);
        };
        
        loop();
    }

    stop() {
        this.gameOver = true;
    }
}
