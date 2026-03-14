// Clase para el Modo Historia
export class StoryMode {
    constructor() {
        console.log('=== INICIO CONSTRUCTOR STORY MODE ===');
        
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
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas game-canvas no encontrado');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('No se pudo obtener el contexto 2D del canvas');
            return;
        }

        // Video de fondo para nivel 1
        this.castleVideo = document.getElementById('castle-background');
        if (this.castleVideo) {
            this.castleVideo.style.display = 'none'; // Ocultar por defecto
            // Forzar reproducción del video
            this.castleVideo.play().catch(e => console.log('Error reproduciendo video:', e));
        }
        
        // Configurar dimensiones del canvas
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
        
        // Forzar que el canvas ocupe toda la pantalla
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        
        console.log('Canvas configurado - Dimensiones:', this.canvas.width, 'x', this.canvas.height);

        // Estado del juego
        this.gameOver = false;
        this.paused = false;
        this.keys = {};
        this.currentLevel = 1;
        this.maxLevel = 5;
        this.score = 0;
        this.storyProgress = 0;

        // Sistema de scroll (manual - cámara sigue al jugador)
        this.camera = {
            x: 0,
            y: 0,
            width: this.config.width,
            height: this.config.height
        };
        this.worldWidth = 3000; // Mundo más ancho que la pantalla
        this.autoScroll = false; // Scroll manual controlado por el jugador

        // Sistema de historia
        this.storyTexts = [
            {
                level: 1,
                title: "El Comienzo",
                text: "Eres un caballero valiente en tu reino. Debes defenderte de las criaturas que amenazan tu tierra.",
                objective: "Sobrevive y recolecta 10 gemas"
            },
            {
                level: 2,
                title: "El Bosque Oscuro",
                text: "Las criaturas se vuelven más agresivas. El rey necesita tu ayuda para proteger el castillo.",
                objective: "Derrota a 15 enemigos"
            },
            {
                level: 3,
                title: "El Asedio",
                text: "El castillo está bajo ataque. Eres la última esperanza del reino.",
                objective: "Sobrevive 2 minutos"
            },
            {
                level: 4,
                title: "El Confrontación",
                text: "El líder de las criaturas aparece. Debes enfrentarlo para salvar a todos.",
                objective: "Derrota al jefe"
            },
            {
                level: 5,
                title: "El Héroe",
                text: "Has salvado el reino. Ahora eres una leyenda. ¡Felicidades, valiente caballero!",
                objective: "Completa la misión final"
            }
        ];

        // Sistema de escenarios por nivel
        this.levelEnvironments = [
            {
                level: 1,
                name: "Reino Pacífico",
                skyColor: '#87CEEB', // Azul cielo claro
                groundColor: '#8B4513', // Tierra marrón
                platformColor: '#654321', // Madera oscura
                decorationColor: '#228B22', // Verde bosque
                timeOfDay: 'dia'
            },
            {
                level: 2,
                name: "Bosque Oscuro",
                skyColor: '#2F4F4F', // Gris oscuro
                groundColor: '#3E2723', // Tierra muy oscura
                platformColor: '#1B0F0A', // Madera carbonizada
                decorationColor: '#8B0000', // Rojo oscuro
                timeOfDay: 'atardecer'
            },
            {
                level: 3,
                name: "Castillo en Llamas",
                skyColor: '#8B0000', // Rojo sangre
                groundColor: '#4A4A4A', // Piedra gris
                platformColor: '#2C2C2C', // Piedra oscura
                decorationColor: '#FF4500', // Naranja fuego
                timeOfDay: 'noche'
            },
            {
                level: 4,
                name: "Trono Oscuro",
                skyColor: '#191970', // Azul medianoche
                groundColor: '#000000', // Negro absoluto
                platformColor: '#4B0082', // Índigo
                decorationColor: '#9400D3', // Violeta
                timeOfDay: 'medianoche'
            },
            {
                level: 5,
                name: "Reino Restaurado",
                skyColor: '#FFD700', // Dorado amanecer
                groundColor: '#DAA520', // Oro oscuro
                platformColor: '#B8860B', // Dorado oscuro
                decorationColor: '#FF69B4', // Rosa brillante
                timeOfDay: 'amanecer'
            }
        ];

        // Jugador
        this.player = {
            x: 200, // Posición inicial más a la izquierda
            y: this.config.height - 200,
            width: 40,
            height: 60,
            velocityX: 0,
            velocityY: 0,
            health: 100,
            maxHealth: 100,
            gems: 0,
            color: '#FFD700', // Dorado para el héroe
            isJumping: false,
            isGrounded: false,
            facing: 1,
            enemiesDefeated: 0,
            survivalTime: 0
        };

        // Plataformas (varían por nivel)
        this.platforms = this.generatePlatforms(this.currentLevel);

        // Elementos decorativos del escenario
        this.decorations = this.generateDecorations(this.currentLevel);

        // Enemigos
        this.enemies = [];
        this.maxEnemies = 2 + this.currentLevel;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 3000 - (this.currentLevel * 200);

        // Gemas
        this.gems = [];
        this.maxGems = 3 + this.currentLevel;
        this.gemSpawnTimer = 0;
        this.gemSpawnInterval = 2000;

        // Proyectiles
        this.projectiles = [];

        // Efectos visuales
        this.particles = [];

        // Jefe (para nivel 4)
        this.boss = null;

        // Diálogo actual
        this.currentDialogue = null;
        this.dialogueTimer = 0;

        // Estado del nivel
        this.levelStartTime = Date.now();
        this.levelCompleted = false;

        // Inicialización
        if (!this.canvas || !this.ctx) {
            console.error('No se puede inicializar el juego - canvas o contexto no disponible');
            return;
        }
        
        this.setupControls();
        // Eliminado showLevelIntro() para empezar directamente con acción
        this.updateHUD();
        this.gameLoop();
        
        console.log('Constructor StoryMode completado - Canvas listo');
    }

    generatePlatforms(level) {
        const environment = this.levelEnvironments[level - 1];
        const platforms = [];
        
        // Plataforma base que cubre todo el mundo
        platforms.push({ 
            x: 0, 
            y: this.config.height - 50, 
            width: this.worldWidth, 
            height: 50, 
            color: environment.groundColor 
        });

        // Generar plataformas distribuidas por todo el mundo
        const platformCount = 8 + level * 2;
        for (let i = 0; i < platformCount; i++) {
            platforms.push({
                x: 300 + i * 250 + Math.random() * 100,
                y: this.config.height - 150 - Math.random() * 200,
                width: 100 + Math.random() * 100,
                height: 20,
                color: environment.platformColor
            });
        }

        return platforms;
    }

    // Generar elementos decorativos según el nivel (distribuidos por todo el mundo)
    generateDecorations(level) {
        const environment = this.levelEnvironments[level - 1];
        const decorations = [];
        let decorationCount = 0;
        let decorationType = '';

        switch(level) {
            case 1: // Reino Pacífico - árboles y flores
                decorationType = 'tree';
                decorationCount = 15;
                break;
            case 2: // Bosque Oscuro - árboles muertos y rocas
                decorationType = 'dead_tree';
                decorationCount = 20;
                break;
            case 3: // Castillo en Llamas - antorchas y escombros
                decorationType = 'torch';
                decorationCount = 18;
                break;
            case 4: // Trono Oscuro - cristales y runas
                decorationType = 'crystal';
                decorationCount = 25;
                break;
            case 5: // Reino Restaurado - estatuas y banderas
                decorationType = 'statue';
                decorationCount = 22;
                break;
        }

        // Distribuir decoraciones por todo el mundo
        for (let i = 0; i < decorationCount; i++) {
            decorations.push({
                type: decorationType,
                x: 200 + i * 150 + Math.random() * 100,
                y: this.config.height - 80 - Math.random() * 40,
                width: decorationType === 'tree' ? 30 : decorationType === 'statue' ? 35 : 20,
                height: decorationType === 'tree' ? 50 : decorationType === 'dead_tree' ? 70 : 30,
                color: environment.decorationColor
            });
        }

        return decorations;
    }

    // Renderizar elementos decorativos
    renderDecorations() {
        for (const decoration of this.decorations) {
            this.ctx.fillStyle = decoration.color;
            
            switch(decoration.type) {
                case 'tree':
                    // Tronco
                    this.ctx.fillRect(decoration.x + 10, decoration.y + 20, 10, 30);
                    // Hojas
                    this.ctx.beginPath();
                    this.ctx.arc(decoration.x + 15, decoration.y + 15, 15, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                    
                case 'dead_tree':
                    // Tronco retorcido
                    this.ctx.fillRect(decoration.x + 8, decoration.y + 30, 8, 40);
                    // Ramas secas
                    this.ctx.fillRect(decoration.x + 5, decoration.y + 20, 20, 3);
                    this.ctx.fillRect(decoration.x, decoration.y + 15, 25, 3);
                    break;
                    
                case 'torch':
                    // Poste
                    this.ctx.fillRect(decoration.x + 6, decoration.y + 10, 3, 20);
                    // Fuego (efecto animado simple)
                    const flameHeight = 10 + Math.sin(Date.now() / 200) * 3;
                    this.ctx.fillStyle = '#FF6600';
                    this.ctx.beginPath();
                    this.ctx.moveTo(decoration.x + 7.5, decoration.y + 10);
                    this.ctx.lineTo(decoration.x + 2, decoration.y - flameHeight);
                    this.ctx.lineTo(decoration.x + 13, decoration.y - flameHeight);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.fillStyle = decoration.color;
                    break;
                    
                case 'crystal':
                    // Cristal brillante
                    this.ctx.save();
                    this.ctx.translate(decoration.x + decoration.width/2, decoration.y + decoration.height/2);
                    this.ctx.rotate(Math.PI / 4);
                    this.ctx.fillRect(-decoration.width/2, -decoration.height/2, decoration.width, decoration.height);
                    this.ctx.restore();
                    // Brillo
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    this.ctx.fillRect(decoration.x + 2, decoration.y + 2, 4, 4);
                    this.ctx.fillStyle = decoration.color;
                    break;
                    
                case 'statue':
                    // Base
                    this.ctx.fillRect(decoration.x + 5, decoration.y + 25, 25, 15);
                    // Cuerpo
                    this.ctx.fillRect(decoration.x + 10, decoration.y + 10, 15, 20);
                    // Cabeza
                    this.ctx.beginPath();
                    this.ctx.arc(decoration.x + 17.5, decoration.y + 8, 6, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
            }
        }
    }

    showLevelIntro() {
        const story = this.storyTexts[this.currentLevel - 1];
        this.currentDialogue = {
            title: story.title,
            text: story.text,
            objective: story.objective,
            duration: 3000 // Reducido a 3 segundos
        };
        this.dialogueTimer = story.duration;
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Manejar pausa directamente aquí como fallback
            if (e.code === 'KeyP' || e.code === 'Escape') {
                e.preventDefault(); // Prevenir comportamiento por defecto
                this.paused = !this.paused;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    handleInput() {
        if (this.gameOver) return;
        
        // Manejar pausa/reanudar (siempre verificar, incluso en pausa)
        if (this.keys['KeyP'] || this.keys['Escape']) {
            this.paused = !this.paused;
            this.keys['KeyP'] = false;
            this.keys['Escape'] = false;
            return;
        }
        
        // Si está en pausa, no permitir otros controles (excepto pausa/reanudar)
        if (this.paused) return;
        
        // Permitir saltar el diálogo con ESPACIO o ENTER
        if (this.currentDialogue && (this.keys['Space'] || this.keys['Enter'])) {
            this.currentDialogue = null;
            this.dialogueTimer = 0;
            this.keys['Space'] = false;
            this.keys['Enter'] = false;
            return;
        }
        
        if (this.currentDialogue) return;

        // Movimiento horizontal
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.player.velocityX = -this.config.playerSpeed;
            this.player.facing = -1;
        } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.player.velocityX = this.config.playerSpeed;
            this.player.facing = 1;
        } else {
            this.player.velocityX *= 0.8; // Fricción
        }

        // Salto
        if ((this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['Space']) && this.player.isGrounded) {
            this.player.velocityY = -this.config.jumpPower;
            this.player.isJumping = true;
            this.player.isGrounded = false;
        }

        // Ataque
        if (this.keys['KeyF']) {
            this.playerAttack();
            this.keys['KeyF'] = false;
        }
    }

    playerAttack() {
        const projectile = {
            x: this.player.x + (this.player.facing > 0 ? this.player.width / 2 : -this.player.width / 2),
            y: this.player.y,
            width: 10,
            height: 5,
            velocityX: this.player.facing * 8,
            velocityY: 0,
            color: this.player.color,
            owner: 'player'
        };
        this.projectiles.push(projectile);
    }

    updatePhysics() {
        if (this.currentDialogue) {
            this.dialogueTimer -= 16;
            if (this.dialogueTimer <= 0) {
                this.currentDialogue = null;
            }
            return;
        }

        // Actualizar jugador
        if (!this.player.isGrounded) {
            this.player.velocityY += this.config.gravity;
        }

        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;

        // Límites del mundo
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.worldWidth) {
            this.player.x = this.worldWidth - this.player.width;
        }

        // Actualizar cámara para seguir al jugador (manual)
        const targetCameraX = this.player.x - this.config.width / 2;
        
        // Suavizar movimiento de la cámara
        this.camera.x += (targetCameraX - this.camera.x) * 0.1;
        
        // Limitar cámara a los bordes del mundo
        if (this.camera.x < 0) this.camera.x = 0;
        if (this.camera.x > this.worldWidth - this.config.width) {
            this.camera.x = this.worldWidth - this.config.width;
        }

        // Completar nivel cuando el jugador llega al final del mundo
        if (this.player.x >= this.worldWidth - this.player.width - 10 && !this.levelCompleted) {
            this.completeLevel();
        }

        // Colisión con plataformas
        this.player.isGrounded = false;
        for (const platform of this.platforms) {
            if (this.checkCollision(this.player, platform)) {
                if (this.player.velocityY > 0 && this.player.y < platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isGrounded = true;
                    this.player.isJumping = false;
                }
            }
        }

        // Actualizar proyectiles
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.x += projectile.velocityX;
            projectile.y += projectile.velocityY;

            if (projectile.x < 0 || projectile.x > this.config.width) {
                return false;
            }

            // Colisión con enemigos
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (this.checkCollision(projectile, enemy)) {
                    this.enemies.splice(i, 1);
                    this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#FF00FF');
                    this.player.enemiesDefeated++;
                    this.score += 100;
                    return false;
                }
            }

            // Colisión con jefe
            if (this.boss && this.checkCollision(projectile, this.boss)) {
                this.boss.health -= 10;
                this.createParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '#FF0000');
                if (this.boss.health <= 0) {
                    this.boss = null;
                    this.score += 1000;
                    this.completeLevel();
                }
                return false;
            }

            return true;
        });

        // Actualizar enemigos
        this.updateEnemies();

        // Actualizar gemas
        this.updateGems();

        // Actualizar partículas
        this.updateParticles();

        // Actualizar tiempo de supervivencia
        this.player.survivalTime = Math.floor((Date.now() - this.levelStartTime) / 1000);

        // Verificar objetivos del nivel
        this.checkLevelObjectives();
    }

    updateEnemies() {
        // Spawn de enemigos
        this.enemySpawnTimer += 16;
        if (this.enemySpawnTimer >= this.enemySpawnInterval && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }

        // Spawn de jefe en nivel 4
        if (this.currentLevel === 4 && !this.boss && this.player.enemiesDefeated >= 10) {
            this.spawnBoss();
        }

        // Actualizar posición de enemigos
        for (const enemy of this.enemies) {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                enemy.x += (dx / distance) * 1.5; // Más rápido que en showdown
                enemy.y += (dy / distance) * 0.5;
            }

            // Colisión con jugador
            if (this.checkCollision(enemy, this.player)) {
                this.player.health -= 5;
                this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#FF0000');
            }
        }

        // Actualizar jefe
        if (this.boss) {
            const dx = this.player.x - this.boss.x;
            const dy = this.player.y - this.boss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                this.boss.x += (dx / distance) * 0.8;
                this.boss.y += (dy / distance) * 0.3;
            }

            if (this.checkCollision(this.boss, this.player)) {
                this.player.health -= 10;
                this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#FF0000');
            }
        }
    }

    updateGems() {
        this.gemSpawnTimer += 16;
        if (this.gemSpawnTimer >= this.gemSpawnInterval && this.gems.length < this.maxGems) {
            this.spawnGem();
            this.gemSpawnTimer = 0;
        }

        for (let i = this.gems.length - 1; i >= 0; i--) {
            const gem = this.gems[i];
            if (this.checkCollision(gem, this.player)) {
                this.player.gems += 5;
                this.score += 50;
                this.createParticles(gem.x + gem.width / 2, gem.y + gem.height / 2, '#00FF00');
                this.gems.splice(i, 1);
            }
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityY += 0.2;
            particle.life -= 2;
            return particle.life > 0;
        });
    }

    spawnEnemy() {
        // Spawn enemigos dentro del área visible de la cámara
        const spawnX = this.camera.x + this.config.width + Math.random() * 200;
        const enemy = {
            x: spawnX,
            y: this.config.height - 150,
            width: 30 + this.currentLevel * 2,
            height: 30 + this.currentLevel * 2,
            velocityX: 0,
            velocityY: 0,
            color: '#9400D3',
            health: 1
        };
        this.enemies.push(enemy);
    }

    spawnBoss() {
        this.boss = {
            x: this.config.width / 2,
            y: 100,
            width: 80,
            height: 80,
            velocityX: 0,
            velocityY: 0,
            color: '#8B0000', // Rojo oscuro
            health: 50,
            maxHealth: 50
        };
    }

    spawnGem() {
        // Spawn gemas dentro del área visible de la cámara
        const gem = {
            x: this.camera.x + Math.random() * (this.config.width - 20) + 10,
            y: Math.random() * 200 + 100,
            width: 20,
            height: 20,
            color: '#FFD700'
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

    checkLevelObjectives() {
        const story = this.storyTexts[this.currentLevel - 1];

        switch (this.currentLevel) {
            case 1:
                if (this.player.gems >= 10) {
                    this.completeLevel();
                }
                break;
            case 2:
                if (this.player.enemiesDefeated >= 15) {
                    this.completeLevel();
                }
                break;
            case 3:
                if (this.player.survivalTime >= 120) { // 2 minutos
                    this.completeLevel();
                }
                break;
            case 4:
                if (!this.boss && this.player.enemiesDefeated >= 20) {
                    this.completeLevel();
                }
                break;
            case 5:
                if (this.player.enemiesDefeated >= 25 && this.player.gems >= 20) {
                    this.completeLevel();
                }
                break;
        }

        if (this.player.health <= 0) {
            this.gameOver = true;
        }
    }

    completeLevel() {
        if (this.levelCompleted) return;
        
        this.levelCompleted = true;
        this.score += 500 * this.currentLevel;

        if (this.currentLevel < this.maxLevel) {
            this.currentDialogue = {
                title: "¡Nivel Completado!",
                text: `Excelente trabajo, caballero. Puntuación: ${this.score}`,
                objective: `Prepárate para el nivel ${this.currentLevel + 1}`,
                duration: 3000
            };
            this.dialogueTimer = 3000;
            
            setTimeout(() => {
                this.nextLevel();
            }, 3000);
        } else {
            this.currentDialogue = {
                title: "¡Victoria!",
                text: "Has completado toda la historia. Eres un verdadero héroe del reino.",
                objective: `Puntuación final: ${this.score}`,
                duration: 5000
            };
            this.dialogueTimer = 5000;
            this.gameOver = true;
        }
    }

    nextLevel() {
        this.currentLevel++;
        this.levelCompleted = false;
        this.levelStartTime = Date.now();
        
        // Resetear cámara para nuevo nivel
        this.camera.x = 0;
        
        this.platforms = this.generatePlatforms(this.currentLevel);
        this.decorations = this.generateDecorations(this.currentLevel);
        this.enemies = [];
        this.gems = [];
        this.projectiles = [];
        this.particles = [];
        this.boss = null;
        this.maxEnemies = 2 + this.currentLevel;
        this.enemySpawnInterval = 3000 - (this.currentLevel * 200);
        this.player.health = this.player.maxHealth;
        this.player.enemiesDefeated = 0;
        this.player.survivalTime = 0;
        this.player.x = 200; // Resetear posición del jugador
        
        // Mostrar breve transición entre niveles (estilo Metal Slug)
        this.showLevelTransition();
    }

    // Breve transición entre niveles (estilo Metal Slug)
    showLevelTransition() {
        const environment = this.levelEnvironments[this.currentLevel - 1];
        this.currentDialogue = {
            title: `${environment.name}`,
            text: `Nivel ${this.currentLevel}`,
            objective: "¡Prepárate para la batalla!",
            duration: 1500 // Más breve que antes
        };
        this.dialogueTimer = 1500;
    }

    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.currentLevel;
        document.getElementById('lives').textContent = Math.max(0, Math.floor(this.player.health / 20));
        document.getElementById('wave').textContent = this.currentLevel;
    }

    render() {
        // Obtener entorno actual
        const environment = this.levelEnvironments[this.currentLevel - 1];
        
        // Manejar video de fondo para nivel 1
        if (this.currentLevel === 1 && this.castleVideo) {
            this.castleVideo.style.display = 'block'; // Mostrar video en nivel 1
            // Forzar reproducción del video
            if (this.castleVideo.paused) {
                this.castleVideo.play().catch(e => console.log('Error reproduciendo video:', e));
            }
            // Limpiar canvas completamente para evitar rastros
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Ocultar video en otros niveles
            if (this.castleVideo) {
                this.castleVideo.style.display = 'none';
            }
            // Limpiar canvas con color del cielo del nivel
            this.ctx.fillStyle = environment.skyColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Guardar estado del contexto para aplicar cámara
        this.ctx.save();
        
        // Aplicar transformación de la cámara
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Dibujar elementos decorativos del fondo
        this.renderDecorations();

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

        // Dibujar jefe
        if (this.boss) {
            this.ctx.fillStyle = this.boss.color;
            this.ctx.fillRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);
            
            // Barra de vida del jefe
            const healthPercent = this.boss.health / this.boss.maxHealth;
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(this.boss.x, this.boss.y - 20, this.boss.width * healthPercent, 5);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.strokeRect(this.boss.x, this.boss.y - 20, this.boss.width, 5);
        }

        // Dibujar proyectiles
        for (const projectile of this.projectiles) {
            this.ctx.fillStyle = projectile.color;
            this.ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
        }

        // Dibujar jugador
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Ojos del jugador
        this.ctx.fillStyle = '#FFFFFF';
        const eyeX = this.player.facing > 0 ? this.player.x + this.player.width - 10 : this.player.x + 5;
        this.ctx.fillRect(eyeX, this.player.y + 10, 5, 5);

        // Dibujar partículas
        for (const particle of this.particles) {
            this.ctx.globalAlpha = particle.life / 100;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, 3, 3);
        }
        this.ctx.globalAlpha = 1.0;

        // Restaurar estado del contexto (quitar cámara)
        this.ctx.restore();

        // Dibujar diálogo
        if (this.currentDialogue) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(50, this.canvas.height - 250, this.canvas.width - 100, 200);
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.currentDialogue.title, this.canvas.width / 2, this.canvas.height - 210);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '18px Arial';
            this.ctx.fillText(this.currentDialogue.text, this.canvas.width / 2, this.canvas.height - 170);
            
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillText(this.currentDialogue.objective, this.canvas.width / 2, this.canvas.height - 130);
            
            // Instrucción para continuar
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Presiona ESPACIO o ENTER para continuar', this.canvas.width / 2, this.canvas.height - 90);
        }

        // UI de pausa
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

        // Game over
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            
            if (this.currentLevel >= this.maxLevel) {
                this.ctx.fillText('¡HISTORIA COMPLETADA!', this.canvas.width / 2, this.canvas.height / 2);
            } else {
                this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            }
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Puntuación final: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
            this.ctx.fillText('Presiona ESC para volver al menú', this.canvas.width / 2, this.canvas.height / 2 + 100);
        }

        // Información del nivel (estilo Metal Slug - sin objetivos)
        if (!this.gameOver && !this.currentDialogue) {
            const environment = this.levelEnvironments[this.currentLevel - 1];
            
            // Fondo semitransparente para el HUD
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(10, 10, 400, 50);
            
            // Nombre del nivel con color del entorno
            this.ctx.fillStyle = environment.decorationColor;
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${environment.name}`, 20, 35);
            
            // Progreso simple
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Gemas: ${this.player.gems} | Enemigos: ${this.player.enemiesDefeated}`, 20, 55);
        }
    }

    gameLoop() {
        const loop = () => {
            if (!this.gameOver && !this.paused) {
                this.handleInput();
                this.updatePhysics();
                this.updateHUD();
            }
            
            // Siempre renderizar, pero manejar estados de pausa y diálogo
            this.render();
            requestAnimationFrame(loop);
        };
        
        loop();
    }

    stop() {
        this.gameOver = true;
    }
    
    start() {
        // Reiniciar el juego si estaba detenido
        if (this.gameOver) {
            this.gameOver = false;
            this.gameLoop();
        }
    }
}
