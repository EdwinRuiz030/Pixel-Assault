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
        
        // Intentar usar el GIF convirtiéndolo a video con canvas
        this.castleGif = new Image();
        this.castleGifLoaded = false;
        // Eliminamos la animación automática para que solo se mueva con la cámara
        
        this.castleGif.onload = () => {
            this.castleGifLoaded = true;
            console.log('GIF del castillo animado cargado correctamente - Dimensiones:', this.castleGif.width, 'x', this.castleGif.height);
        };
        this.castleGif.onerror = () => {
            console.error('Error cargando GIF del castillo animado');
            this.castleGifLoaded = false;
        };
        this.castleGif.src = 'img/castillo animado.gif';
        
        // Restaurar capas de paralaje para mayor profundidad
        this.parallaxLayers = [
            { speed: 0.05, alpha: 0.3 }, // Capa más lejana
            { speed: 0.1, alpha: 0.4 }, // Capa media
            { speed: 0.15, alpha: 0.5 }  // Capa cercana
        ];
        
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
        // this.currentLevel = 1; // Eliminado - solo un escenario
        // this.maxLevel = 5; // Eliminado - solo un escenario
        this.score = 0;
        this.storyProgress = 0;

        // Botones de game over
        this.gameOverButtons = {
            yes: {
                x: 0,
                y: 0,
                width: 150,
                height: 50,
                text: 'SÍ',
                hovered: false
            },
            no: {
                x: 0,
                y: 0,
                width: 150,
                height: 50,
                text: 'NO',
                hovered: false
            }
        };

        // Sistema de scroll (manual - cámara sigue al jugador)
        this.camera = {
            x: 0,
            y: 0,
            width: this.config.width,
            height: this.config.height
        };
        this.worldWidth = 10000; // Mundo mucho más largo para más recorrido
        this.autoScroll = false; // Scroll manual controlado por el jugador

        // Entorno del juego (solo un escenario)
        this.environment = {
            name: "Reino Pacífico",
            skyColor: '#87CEEB', // Azul cielo claro
            groundColor: '#8B4513', // Tierra marrón
            platformColor: '#654321', // Madera oscura
            decorationColor: '#228B22', // Verde bosque
            timeOfDay: 'amanecer'
        };

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

        // Plataformas (escenario fijo)
        this.platforms = this.generatePlatforms();

        // Elementos decorativos del escenario
        this.decorations = this.generateDecorations();

        // Enemigos
        this.enemies = [];
        this.maxEnemies = 5; // Cantidad fija de enemigos
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 3000; // Intervalo fijo

        // Gemas
        this.gems = [];
        this.maxGems = 5; // Cantidad fija de gemas en el escenario
        this.gemSpawnTimer = 0;
        this.gemSpawnInterval = 2000;

        // Proyectiles
        this.projectiles = [];

        // Efectos visuales
        this.particles = [];
        
        // Sistema de disparo
        this.lastShootTime = 0;
        this.shootCooldown = 250; // ms entre disparos individuales
        this.burstCooldown = 100; // ms entre disparos en ráfaga
        this.burstCount = 0; // Contador de disparos en ráfaga actual
        this.maxBurstShots = 3; // Máximo de disparos por ráfaga
        this.burstDelay = 500; // Tiempo de espera entre ráfagas
        this.lastBurstTime = 0; // Tiempo de la última ráfaga
        this.isBurstMode = false; // Modo actual: individual o ráfaga
        
        // Imágenes del personaje
        this.knightImage = new Image();
        this.knightImageLoaded = false;
        this.knightImage.onload = () => {
            this.knightImageLoaded = true;
            console.log('Imagen del caballero cargada correctamente', this.knightImage.src, this.knightImage.width, this.knightImage.height);
        };
        this.knightImage.onerror = () => {
            console.error('Error cargando imagen del caballero');
        };
        this.knightImage.src = 'img/Caballero prueba parado.png';
        
        // Imagen para estado idle (parado)
        this.knightIdleImage = new Image();
        this.knightIdleImageLoaded = false;
        this.knightIdleImage.onload = () => {
            this.knightIdleImageLoaded = true;
            console.log('Imagen del caballero parado cargada correctamente', this.knightIdleImage.src, this.knightIdleImage.width, this.knightIdleImage.height);
        };
        this.knightIdleImage.onerror = () => {
            console.error('Error cargando imagen del caballero parado');
        };
        this.knightIdleImage.src = 'img/Caballero prueba parado.png';
        
        // Sprite sheet para estado caminando
        this.knightWalkImage = new Image();
        this.knightWalkImageLoaded = false;
        this.knightWalkImage.onload = () => {
            this.knightWalkImageLoaded = true;
            console.log('Sprite sheet de caminata cargado correctamente', this.knightWalkImage.src, this.knightWalkImage.width, this.knightWalkImage.height);
            
            // Calcular dimensiones del sprite sheet - intentar diferentes configuraciones
            const imgWidth = this.knightWalkImage.width;
            const imgHeight = this.knightWalkImage.height;
            
            // Intentar detectar automáticamente el número de frames
            // Asumir que los frames son cuadrados o rectangulares similares
            const possibleFrameCounts = [4, 6, 8, 10, 12];
            let bestConfig = null;
            
            for (let frames of possibleFrameCounts) {
                const frameWidth = imgWidth / frames;
                const frameHeight = imgHeight;
                
                // Verificar si las dimensiones son razonables (entre 30-200px)
                if (frameWidth >= 30 && frameWidth <= 200 && frameHeight >= 30 && frameHeight <= 200) {
                    bestConfig = {
                        frameWidth: Math.floor(frameWidth),
                        frameHeight: Math.floor(frameHeight),
                        framesPerRow: frames,
                        totalFrames: frames,
                        currentRow: 0
                    };
                    break;
                }
            }
            
            if (bestConfig) {
                this.walkSheetConfig = bestConfig;
                console.log('Configuración sprite sheet caminata detectada:', this.walkSheetConfig);
            } else {
                // Fallback: asumir 6 frames
                this.walkSheetConfig = {
                    frameWidth: Math.floor(imgWidth / 6),
                    frameHeight: imgHeight,
                    framesPerRow: 6,
                    totalFrames: 6,
                    currentRow: 0
                };
                console.log('Usando configuración fallback sprite sheet:', this.walkSheetConfig);
            }
        };
        this.knightWalkImage.onerror = () => {
            console.error('Error cargando sprite sheet de caminata');
        };
        this.knightWalkImage.src = 'img/Caminar.png';
        
        // Sistema de animación
        this.animationState = 'idle'; // idle, walking, jumping, attacking
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 100; // ms entre frames
        this.walkAnimationSpeed = 80; // Velocidad más rápida para caminar (más fluida)
        
        // Configuración del sprite sheet de caminata
        this.walkSheetConfig = {
            frameWidth: 0,  // Se calculará cuando se cargue la imagen
            frameHeight: 0, // Se calculará cuando se cargue la imagen
            framesPerRow: 0, // Se calculará cuando se cargue la imagen
            totalFrames: 0,  // Se calculará cuando se cargue la imagen
            currentRow: 0    // Fila actual del sprite sheet
        };
        
        // Duende para enemigos básicos
        this.duendeImage = new Image();
        this.duendeImageLoaded = false;
        this.duendeImage.onload = () => {
            this.duendeImageLoaded = true;
            console.log('Duende cargado correctamente');
        };
        this.duendeImage.onerror = () => {
            console.error('Error cargando Duende');
        };
        this.duendeImage.src = 'img/Duende.png';
        this.swordImage = new Image();
        this.swordImageLoaded = false;
        this.swordImage.onload = () => {
            this.swordImageLoaded = true;
            console.log('Espada de Fe cargada correctamente');
        };
        this.swordImage.onerror = () => {
            console.error('Error cargando Espada de Fe');
        };
        this.swordImage.src = 'img/Espada de Fe.png';

        // Jefe (para nivel 4)
        this.boss = null;

        // Estado del nivel
        this.levelStartTime = Date.now();
        this.lastFrameTime = Date.now();

        // Inicialización
        if (!this.canvas || !this.ctx) {
            console.error('No se puede inicializar el juego - canvas o contexto no disponible');
            return;
        }
        
        this.setupControls();
        this.setupMouseControls();
        // Eliminado showLevelIntro() y updateHUD() para empezar directamente con acción
        this.gameLoop();
        
        console.log('Constructor StoryMode completado - Canvas listo');
    }

    generatePlatforms() {
        const platforms = [];
        
        // Plataforma base del suelo
        platforms.push({
            x: 0,
            y: this.config.height - 50,
            width: this.worldWidth,
            height: 50,
            color: this.environment.groundColor
        });
        
        // Plataformas flotantes (diseño fijo para el escenario)
        const floatingPlatforms = [
            { x: 400, y: 450, width: 120, height: 20 },
            { x: 600, y: 380, width: 100, height: 20 },
            { x: 800, y: 320, width: 140, height: 20 },
            { x: 1050, y: 400, width: 110, height: 20 },
            { x: 1300, y: 280, width: 130, height: 20 },
            { x: 1550, y: 350, width: 120, height: 20 },
            { x: 1800, y: 300, width: 100, height: 20 },
            { x: 2100, y: 420, width: 150, height: 20 },
            { x: 2400, y: 250, width: 120, height: 20 },
            { x: 2700, y: 380, width: 140, height: 20 },
            { x: 3000, y: 320, width: 110, height: 20 },
            { x: 3300, y: 400, width: 130, height: 20 },
            { x: 3600, y: 280, width: 120, height: 20 },
            { x: 3900, y: 350, width: 100, height: 20 },
            { x: 4200, y: 300, width: 140, height: 20 },
            { x: 4500, y: 420, width: 120, height: 20 },
            { x: 4800, y: 250, width: 110, height: 20 },
            { x: 5100, y: 380, width: 130, height: 20 },
            { x: 5400, y: 320, width: 120, height: 20 },
            { x: 5700, y: 400, width: 100, height: 20 }
        ];
        
        floatingPlatforms.forEach(platform => {
            platforms.push({
                ...platform,
                color: this.environment.platformColor
            });
        });
        
        return platforms;
    }

    // Generar elementos decorativos del escenario (distribuidos por todo el mundo)
    generateDecorations() {
        const decorations = [];
        const decorationCount = 40; // Cantidad fija para el escenario
        
        // Generar árboles (decoración principal del Reino Pacífico)
        for (let i = 0; i < decorationCount; i++) {
            const x = Math.random() * this.worldWidth;
            const y = this.config.height - 150 + Math.random() * 80; // Árboles en el suelo
            
            decorations.push({
                x: x,
                y: y,
                type: 'tree',
                width: 35,
                height: 60
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

    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            console.log('Keydown:', e.code, 'Keys actuales:', this.keys);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            console.log('Keyup:', e.code, 'Keys actuales:', this.keys);
        });
    }

    handleInput() {
        if (this.gameOver) return;
        
        // Manejar pausa/reanudar (siempre verificar, incluso en pausa)
        if (this.keys['KeyP'] || this.keys['Escape']) {
            console.log('Tecla de pausa detectada:', {
                KeyP: this.keys['KeyP'],
                Escape: this.keys['Escape'],
                paused: this.paused
            });
            this.paused = !this.paused;
            console.log('Estado de pausa cambiado a:', this.paused);
            // Limpiar las teclas de pausa para evitar múltiples toggles
            this.keys['KeyP'] = false;
            this.keys['Escape'] = false;
            console.log('Teclas limpiadas');
            return;
        }
        
        // Si está en pausa, no permitir otros controles
        if (this.paused) {
            console.log('Juego en pausa, ignorando otros controles');
            return;
        }

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

        // Cambiar modo de disparo
        if (this.keys['KeyG']) {
            this.isBurstMode = !this.isBurstMode;
            console.log('Modo de disparo:', this.isBurstMode ? 'Ráfaga' : 'Individual');
            this.keys['KeyG'] = false;
        }
    }

    playerAttack() {
        const currentTime = Date.now();
        
        if (this.isBurstMode) {
            // Modo Ráfaga
            if (currentTime - this.lastBurstTime < this.burstDelay) {
                return; // Esperar entre ráfagas
            }
            
            if (this.burstCount >= this.maxBurstShots) {
                if (currentTime - this.lastBurstTime < this.burstDelay) {
                    return; // Esperar para completar la ráfaga
                }
                // Reiniciar ráfaga
                this.burstCount = 0;
                this.lastBurstTime = currentTime;
            }
            
            if (currentTime - this.lastShootTime < this.burstCooldown) {
                return; // Esperar entre disparos de la ráfaga
            }
            
            this.lastShootTime = currentTime;
            this.burstCount++;
            
            if (this.burstCount === 1) {
                this.lastBurstTime = currentTime;
            }
            
        } else {
            // Modo Individual
            if (currentTime - this.lastShootTime < this.shootCooldown) {
                return; // No disparar si está en cooldown
            }
            this.lastShootTime = currentTime;
        }
        
        this.animationState = 'attacking';
        this.animationFrame = 0; // Reiniciar frame de ataque
        
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

            // Eliminar proyectiles que salgan del mundo (no solo de la pantalla visible)
            if (projectile.x < this.camera.x - 100 || projectile.x > this.camera.x + this.config.width + 100) {
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
                    // Eliminada la llamada a completeLevel() para continuar jugando
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

        // Verificar si el jugador sigue vivo
        if (this.player.health <= 0) {
            this.gameOver = true;
        }
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

        // Actualizar posición y física de enemigos
        for (const enemy of this.enemies) {
            // Aplicar gravedad siempre
            enemy.velocityY += this.config.gravity;
            
            // Limitar velocidad de caída máxima
            if (enemy.velocityY > 15) {
                enemy.velocityY = 15;
            }

            // Movimiento horizontal hacia el jugador
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                const moveX = (dx / distance) * 1.5; // Movimiento horizontal
                enemy.x += moveX;
                
                // Detectar si hay una plataforma adelante y saltar si es necesario
                const nextX = enemy.x + moveX * 10; // Predecir posición futura
                const needsJump = this.shouldEnemyJump(enemy, nextX);
                
                // Solo saltar si está en el suelo y realmente necesita saltar
                if (needsJump && enemy.isGrounded && Math.random() > 0.3) { // 70% de probabilidad de saltar
                    enemy.velocityY = -this.config.jumpPower * 0.8; // Salto del enemigo
                    enemy.isJumping = true;
                    enemy.isGrounded = false;
                    console.log('Enemigo salta desde:', enemy.x, enemy.y);
                }
            }

            // Actualizar posición vertical
            enemy.y += enemy.velocityY;

            // Resetear estado de grounded
            enemy.isGrounded = false;
            
            // Verificar colisión con plataformas (excepto el suelo principal)
            for (const platform of this.platforms) {
                if (platform.y < this.config.height - 60) { // Ignorar suelo principal aquí
                    if (this.checkCollision(enemy, platform)) {
                        if (enemy.velocityY > 0 && enemy.y < platform.y) {
                            enemy.y = platform.y - enemy.height;
                            enemy.velocityY = 0;
                            enemy.isGrounded = true;
                            enemy.isJumping = false;
                            console.log('Enemigo aterrizó en plataforma:', enemy.x, enemy.y);
                            break; // Salir del loop una vez que encuentra una plataforma
                        }
                    }
                }
            }
            
            // Siempre verificar colisión con el suelo principal como respaldo FINAL
            if (enemy.y + enemy.height >= this.config.height - 50) {
                const wasFloating = enemy.y + enemy.height > this.config.height - 45;
                enemy.y = this.config.height - 50 - enemy.height;
                enemy.velocityY = 0;
                enemy.isGrounded = true;
                enemy.isJumping = false;
                if (wasFloating) {
                    console.log('Enemigo corregido al suelo:', enemy.x, enemy.y);
                }
            }

            // Colisión con jugador
            if (this.checkCollision(enemy, this.player)) {
                this.player.health -= 1;
                this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#FF0000');
            }
        }

        // Verificación final de seguridad: forzar enemigos al suelo si están flotando
        for (const enemy of this.enemies) {
            const groundY = this.config.height - 50;
            const enemyBottom = enemy.y + enemy.height;
            
            // Si el enemigo está por debajo del suelo o flotando muy cerca
            if (enemyBottom > groundY - 5) {
                enemy.y = groundY - enemy.height;
                enemy.velocityY = 0;
                enemy.isGrounded = true;
                enemy.isJumping = false;
                
                if (enemyBottom > groundY + 1) {
                    console.log('CORRECCIÓN FORZADA - Enemigo estaba bajo el suelo:', enemyBottom - groundY, 'px');
                }
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

    // Método para determinar si un enemigo debe saltar
    shouldEnemyJump(enemy, nextX) {
        // Verificar si hay una plataforma a la altura del enemigo
        for (const platform of this.platforms) {
            // Ignorar el suelo principal
            if (platform.y >= this.config.height - 60) continue;
            
            // Verificar si la plataforma está en el rango Y del enemigo y en su camino
            const platformTop = platform.y;
            const platformBottom = platform.y + platform.height;
            const enemyBottom = enemy.y + enemy.height;
            
            // Si la plataforma está a la altura del enemigo y en su camino
            if (platformTop <= enemyBottom + 50 && platformBottom >= enemyBottom) {
                if ((enemy.x < platform.x && nextX >= platform.x) || 
                    (enemy.x > platform.x + platform.width && nextX <= platform.x + platform.width)) {
                    return true;
                }
            }
        }
        return false;
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
        const spawnX = this.camera.x + this.config.width - 100; // Aparecer en el borde derecho visible
        const groundY = this.config.height - 50; // Superficie del piso marrón
        
        const enemy = {
            x: spawnX,
            y: groundY, // Posición inicial en la superficie del piso
            width: 100,  // Ancho igual al tamaño visual del duende
            height: 150, // Alto igual al tamaño visual del duende
            velocityX: 0,
            velocityY: 0, // Inicializar velocidad Y en 0
            color: '#9400D3',
            health: 1,
            isGrounded: true, // Comenzar en el suelo
            isJumping: false
        };
        
        // Ajustar para que la base del sprite toque el piso
        enemy.y = groundY - enemy.height;
        enemy.velocityY = 0;
        
        this.enemies.push(enemy);
        console.log('Enemigo spawn en:', spawnX, enemy.y, 'Piso en:', groundY, 'Altura enemigo:', enemy.height);
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

    updateAnimations(deltaTime) {
        this.animationTimer += deltaTime;
        
        // SOLO enfocados en animación de caminar
        let maxFrames = 1; // Default para imágenes estáticas
        let currentAnimationSpeed = this.animationSpeed;
        
        // Si el jugador está caminando (movimiento horizontal significativo)
        if (Math.abs(this.player.velocityX) > 0.5) {
            this.animationState = 'walking';
            maxFrames = this.walkSheetConfig.totalFrames || 6;
            currentAnimationSpeed = this.walkAnimationSpeed;
        } else {
            // Si no está caminando, volver a idle
            this.animationState = 'idle';
            maxFrames = 1;
        }
        
        // Actualizar frame solo si está caminando
        if (this.animationState === 'walking') {
            if (this.animationTimer >= currentAnimationSpeed) {
                this.animationTimer = 0;
                this.animationFrame = (this.animationFrame + 1) % maxFrames;
            }
        } else {
            // Resetear frame cuando no está caminando
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
    }

    // updateHUD() eliminada - HUD ahora se dibuja directamente en el canvas

    render() {
        // Limpiar completamente el canvas al inicio de cada frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Obtener entorno del escenario
        const environment = this.environment;
        
        // Manejar fondo - restaurar paralaje sincronizado
        if (this.castleGif && this.castleGif.complete) {
            // Ocultar video si existe
            if (this.castleVideo) {
                this.castleVideo.style.display = 'none';
            }
            
            // Limpiar canvas con color del cielo
            this.ctx.fillStyle = environment.skyColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Dimensiones del GIF
            const gifWidth = this.castleGif.width;
            const gifHeight = this.castleGif.height;
            
            // Dibujar múltiples capas de paralaje para mayor profundidad
            for (const layer of this.parallaxLayers) {
                const cameraOffset = this.camera.x * layer.speed;
                const repetitions = Math.ceil((this.canvas.width + gifWidth) / gifWidth) + 1;
                
                this.ctx.globalAlpha = layer.alpha;
                
                // Dibujar múltiples copias para crear efecto infinito
                for (let i = 0; i < repetitions; i++) {
                    const gifX = (i * gifWidth) - (cameraOffset % gifWidth);
                    const gifY = (this.canvas.height - gifHeight) / 2;
                    this.ctx.drawImage(this.castleGif, gifX, gifY, gifWidth, gifHeight);
                }
            }
            
            this.ctx.globalAlpha = 1.0;
        } else {
            // Ocultar video y GIF si no están disponibles
            if (this.castleVideo) {
                this.castleVideo.style.display = 'none';
            }
            
            // Limpiar canvas con color del cielo del escenario
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

        // Dibujar enemigos con diseño de duende
        for (const enemy of this.enemies) {
            if (this.duendeImageLoaded) {
                // Duende más grande y proporcional al jugador
                const duendeWidth = 100;  // Ancho aumentado para mejor proporción
                const duendeHeight = 150; // Alto proporcional (1.5x el ancho)
                
                this.ctx.drawImage(
                    this.duendeImage,
                    enemy.x - duendeWidth / 2, // Centrar horizontalmente
                    enemy.y,                   // Posición Y es la base del sprite
                    duendeWidth,
                    duendeHeight
                );
            } else {
                // Fallback - dibujar rectángulo simple con posición corregida
                this.ctx.fillStyle = enemy.color;
                this.ctx.fillRect(
                    enemy.x - enemy.width / 2, // Centrar horizontalmente
                    enemy.y,                   // Posición Y es la base del sprite
                    enemy.width,
                    enemy.height
                );
            }
        }

        // Dibujar jefe
        if (this.boss) {
            this.ctx.fillStyle = this.boss.color;
            this.ctx.fillRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);
            
            // Barra de vida del jefe
            // const healthPercent = this.boss.health / this.boss.maxHealth;
            // this.ctx.fillStyle = '#FF0000';
            // this.ctx.fillRect(this.boss.x, this.boss.y - 20, this.boss.width * healthPercent, 5);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.strokeRect(this.boss.x, this.boss.y - 20, this.boss.width, 5);
        }

        // Dibujar proyectiles con Espada de Fe (horizontal)
        for (const projectile of this.projectiles) {
            if (this.swordImageLoaded) {
                // Dibujar Espada de Fe como proyectil horizontal
                const swordWidth = 30;
                const swordHeight = 20;
                
                this.ctx.save();
                this.ctx.translate(projectile.x + projectile.width/2, projectile.y + projectile.height/2);
                
                // Rotar según la dirección del disparo
                if (projectile.velocityX > 0) {
                    // Disparo hacia la derecha - rotar 90° para ponerla horizontal
                    this.ctx.rotate(Math.PI / 2);
                } else {
                    // Disparo hacia la izquierda - rotar -90° para ponerla horizontal invertida
                    this.ctx.rotate(-Math.PI / 2);
                }
                
                // Dibujar la espada
                this.ctx.drawImage(
                    this.swordImage,
                    -swordWidth/2,
                    -swordHeight/2,
                    swordWidth,
                    swordHeight
                );
                
                this.ctx.restore();
            } else {
                // Fallback - dibujar rectángulo simple
                this.ctx.fillStyle = projectile.color;
                this.ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
            }
        }

        // SOLO enfocado en caminar vs idle
        let currentImage = this.knightImage;
        let imageLoaded = this.knightImageLoaded;
        let useSpriteSheet = false;
        
        if (this.animationState === 'walking' && this.knightWalkImageLoaded) {
            // Usar sprite sheet solo cuando camina
            currentImage = this.knightWalkImage;
            imageLoaded = this.knightWalkImageLoaded;
            useSpriteSheet = true;
        } else if (this.animationState === 'idle' && this.knightIdleImageLoaded) {
            // Usar imagen idle cuando está quieto
            currentImage = this.knightIdleImage;
            imageLoaded = this.knightIdleImageLoaded;
            useSpriteSheet = false;
        }

        if (imageLoaded && currentImage) {
            this.ctx.save();
            
            // Voltear si mira a la izquierda
            if (this.player.facing < 0) {
                this.ctx.translate(this.player.x, this.player.y); 
                this.ctx.scale(-1, 1);
                this.ctx.translate(-this.player.x, -this.player.y);
            }
            
            if (useSpriteSheet && this.animationState === 'walking') {
                // SPRITE SHEET DE CAMINAR - simplificado y directo
                const frameWidth = this.walkSheetConfig.frameWidth;
                const frameHeight = this.walkSheetConfig.frameHeight;
                const frameX = this.animationFrame * frameWidth;
                const frameY = 0; // Siempre primera fila
                
                if (frameWidth > 0 && frameHeight > 0) {
                    const scale = 1.2;
                    const scaledWidth = frameWidth * scale;
                    const scaledHeight = frameHeight * scale;
                    
                    this.ctx.drawImage(
                        currentImage,                    // Sprite sheet completo
                        frameX, frameY, frameWidth, frameHeight,  // Frame específico
                        this.player.x - scaledWidth/2, 
                        this.player.y - scaledHeight/2, 
                        scaledWidth, scaledHeight
                    );
                }
            } else {
                // IMAGEN ESTÁTICA (idle o fallback)
                const spriteWidth = currentImage.width;
                const spriteHeight = currentImage.height;
                const scale = 1.2;
                const scaledWidth = spriteWidth * scale;
                const scaledHeight = spriteHeight * scale;
                
                this.ctx.drawImage(
                    currentImage,
                    this.player.x - scaledWidth/2,
                    this.player.y - scaledHeight/2,
                    scaledWidth,
                    scaledHeight
                );
            }
            
            this.ctx.restore();
        }
         else {
            // Fallback - dibujar rectángulo simple si no hay imagen
            const fallbackWidth = 60;
            const fallbackHeight = 80;
            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(this.player.x - fallbackWidth/2, this.player.y - fallbackHeight/2, fallbackWidth, fallbackHeight);
        }

        // Dibujar partículas
        for (const particle of this.particles) {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 100;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1.0;

        // Restaurar estado del contexto (quitar cámara)
        this.ctx.restore();

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
                this.ctx.fillText('HAS MUERTO, ¿DESEAS VOLVER A EMPEZAR?', this.canvas.width / 2, this.canvas.height / 2);
                
                // Dibujar botones SÍ y NO
                this.drawGameOverButtons();
            }
        }

        // HUD con estilo pixelado - corazones y barra de vida
        if (!this.gameOver) {
            // Calcular vidas y salud
            const maxLives = 5;
            const currentLives = Math.max(0, Math.floor(this.player.health / 20));
            const healthPercentage = Math.max(0, Math.min(1, this.player.health / 100));
            
            // Dibujar 5 corazones con diferentes estados
            for (let i = 0; i < maxLives; i++) {
                const x = 20 + (i * 40);
                const y = 25; // Subido más arriba
                
                if (i < currentLives) {
                    // Corazón lleno (rojo)
                    this.ctx.fillStyle = '#FF0000';
                    this.drawPixelHeart(x, y, 18);
                } else {
                    // Corazón vacío (gris oscuro)
                    this.ctx.fillStyle = '#444444';
                    this.drawPixelHeart(x, y, 18);
                }
            }
            
            // Dibujar barra de vida actual
            const barX = 20;
            const barY = 55; // Subido más arriba
            const barWidth = 200;
            const barHeight = 16;
            const segmentWidth = Math.floor(barWidth / 4);
            
            // Fondo de la barra
            this.ctx.fillStyle = '#222222';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Segmentos de vida
            const filledSegments = Math.floor(healthPercentage * 4);
            for (let i = 0; i < 4; i++) {
                if (i < filledSegments) {
                    // Segmento lleno (rojo)
                    this.ctx.fillStyle = '#FF0000';
                } else {
                    // Segmento vacío (gris oscuro)
                    this.ctx.fillStyle = '#444444';
                }
                this.ctx.fillRect(barX + (i * segmentWidth), barY, segmentWidth - 1, barHeight);
            }
        }
    }

    // Función para dibujar corazón pixelado
    drawPixelHeart(x, y, size) {
        // Matriz de píxeles para un corazón pixelado (8x11)
        const heartPixels = [
            [0,0,1,0,0,1,0,0,1,0,0,1],
            [0,1,1,0,1,1,0,1,1,0,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,0,1,0,1,0,1,0],
            [0,0,1,0,0,1,0,0,1,0,0,1],
            [0,0,0,0,0,0,1,0,0,0,1,0],
            [0,0,0,0,0,0,0,0,0,0,0,0]
        ];
        
        const pixelSize = size / 8; // 8 filas para mejor proporción
        
        for (let heartRow = 0; heartRow < 8; heartRow++) {
            const currentRow = heartPixels[heartRow];
            if (!currentRow) continue; // Verificación de seguridad
            for (let heartCol = 0; heartCol < 11; heartCol++) {
                if (currentRow[heartCol] === 1) {
                    this.ctx.fillRect(
                        x + (heartCol * pixelSize),
                        y + (heartRow * pixelSize),
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
    }

    gameLoop() {
        const loop = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;
            
            // Actualizar animaciones
            this.updateAnimations(deltaTime);
            
            if (!this.gameOver) {
                this.handleInput(); // Siempre llamar handleInput para poder pausar/reanudar
                if (!this.paused) {
                    this.updatePhysics();
                    // updateHUD() eliminada - HUD ahora se dibuja en canvas
                }
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

    drawGameOverButtons() {
        // Calcular posiciones de los botones
        const centerX = this.canvas.width / 2;
        const buttonY = this.canvas.height / 2 + 80;
        const spacing = 180;

        // Actualizar posiciones
        this.gameOverButtons.yes.x = centerX - spacing;
        this.gameOverButtons.yes.y = buttonY;
        this.gameOverButtons.no.x = centerX + spacing - this.gameOverButtons.no.width;
        this.gameOverButtons.no.y = buttonY;

        // Dibujar botones con estilo medieval
        [this.gameOverButtons.yes, this.gameOverButtons.no].forEach(button => {
            // Fondo del botón
            const gradient = this.ctx.createLinearGradient(
                button.x, button.y, 
                button.x, button.y + button.height
            );
            
            if (button.hovered) {
                gradient.addColorStop(0, '#CDAF87');
                gradient.addColorStop(1, '#8B6914');
            } else {
                gradient.addColorStop(0, '#8B6914');
                gradient.addColorStop(1, '#654321');
            }

            // Borde del botón
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(button.x - 4, button.y - 4, button.width + 8, button.height + 8);
            
            // Fondo principal
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(button.x, button.y, button.width, button.height);
            
            // Texto
            this.ctx.fillStyle = '#FFE5C2';
            this.ctx.font = 'bold 24px Georgia';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2);
        });
    }

    setupMouseControls() {
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.gameOver) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Verificar hover en botones
            [this.gameOverButtons.yes, this.gameOverButtons.no].forEach(button => {
                button.hovered = mouseX >= button.x && mouseX <= button.x + button.width &&
                               mouseY >= button.y && mouseY <= button.y + button.height;
            });
        });

        this.canvas.addEventListener('click', (e) => {
            if (!this.gameOver) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Verificar clic en botón SÍ
            if (mouseX >= this.gameOverButtons.yes.x && mouseX <= this.gameOverButtons.yes.x + this.gameOverButtons.yes.width &&
                mouseY >= this.gameOverButtons.yes.y && mouseY <= this.gameOverButtons.yes.y + this.gameOverButtons.yes.height) {
                this.restartGame();
            }

            // Verificar clic en botón NO
            if (mouseX >= this.gameOverButtons.no.x && mouseX <= this.gameOverButtons.no.x + this.gameOverButtons.no.width &&
                mouseY >= this.gameOverButtons.no.y && mouseY <= this.gameOverButtons.no.y + this.gameOverButtons.no.height) {
                this.returnToMenu();
            }
        });
    }

    restartGame() {
        // Reiniciar variables del juego
        this.gameOver = false;
        this.score = 0;
        this.player.health = this.player.maxHealth;
        this.player.x = 200;
        this.player.y = this.config.height - 200;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.enemies = [];
        this.gems = [];
        this.projectiles = [];
        this.particles = [];
        this.enemySpawnTimer = 0;
        this.gemSpawnTimer = 0;
    }

    returnToMenu() {
        // Detener el juego y volver al menú principal
        this.gameOver = true;
        window.location.reload(); // O usar un método más elegante si existe
    }
}
