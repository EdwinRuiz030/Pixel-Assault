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
            gravity: 0.5
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
        this.score = 0;

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
        this.worldWidth = 10000;

        // Entorno del juego
        this.environment = {
            skyColor: '#87CEEB',
            groundColor: '#8B4513',
            platformColor: '#654321'
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
            displayHealth: 100,
            maxHealth: 100,
            gems: 0,
            color: '#FFD700', // Dorado para el héroe
            isJumping: false,
            isGrounded: false,
            facing: 1,
            enemiesDefeated: 0,
            survivalTime: 0,
            lastDamageTime: 0,           // Tiempo del último daño recibido
            invincibilityDuration: 1000  // 1 segundo de invencibilidad tras recibir daño
        };

        // Plataformas (escenario fijo)
        this.platforms = this.generatePlatforms();



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

        // Sprite sheet unificado del personaje (1344x1344 - 7x7 frames de 192x192)
        this.characterSprite = new Image();
        this.characterSpriteLoaded = false;
        this.characterSprite.onload = () => {
            this.characterSpriteLoaded = true;
            console.log('Sprite sheet unificado cargado correctamente', this.characterSprite.src);
        };
        this.characterSprite.onerror = () => {
            console.error('Error cargando sprite sheet unificado (img/personaje_nuevo.png)');
        };
        this.characterSprite.src = 'img/personaje_nuevo.png';

        // Sistema de animación
        this.animationState = 'idle'; // idle, walking, jumping, attacking
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 200; // ms entre frames general (mucho más lento)
        this.walkAnimationSpeed = 100; // 200ms entre frames para correr

        // Configuración del sprite sheet unificado (49 frames, índices 0 a 48)
        this.spriteConfig = {
            frameWidth: 192,
            frameHeight: 192,
            framesPerRow: 7,
            animations: {
                idle: { start: 0, end: 3 },
                walking: { start: 4, end: 18 },
                jumping: { start: 19, end: 30 },
                attacking: { start: 33, end: 48 }
            }
        };

        // Duende para enemigos básicos
        this.duendeImage = new Image();
        this.duendeImageLoaded = false;
        this.duendeImage.onload = () => { this.duendeImageLoaded = true; };
        this.duendeImage.src = 'img/Duende.png';

        // Imagen del piso escenario
        this.floorImage = new Image();
        this.floorImageLoaded = false;
        this.floorImage.onload = () => { this.floorImageLoaded = true; };
        this.floorImage.src = 'img/piso escenario.png';

        // Imagen de las plataformas sprite sheet (cuadros 0 al 5)
        this.platformsImage = new Image();
        this.platformsImageLoaded = false;
        this.platformsImage.onload = () => { this.platformsImageLoaded = true; };
        this.platformsImage.src = 'img/plataforma 1.png';

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

        // Imagen del token
        this.tokenImage = new Image();
        this.tokenImageLoaded = false;
        this.tokenImage.onload = () => { this.tokenImageLoaded = true; };
        this.tokenImage.src = 'img/token.png';



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
            color: this.environment.groundColor,
            isFloor: true
        });

        // Plataformas flotantes — posiciones Y relativas al suelo para adaptarse a cualquier resolución
        // Salto máximo ~144px, así que las plataformas están en 3 niveles alcanzables:
        //   Nivel 1: 100-130px sobre el suelo (alcanzable desde el suelo)
        //   Nivel 2: 200-240px sobre el suelo (alcanzable desde nivel 1)
        //   Nivel 3: 300-340px sobre el suelo (alcanzable desde nivel 2)
        const groundY = this.config.height - 50;

        const floatingPlatforms = [
            // Nivel 1 — alcanzable desde el suelo
            { x: 400, y: groundY - 120, width: 120, height: 20 },
            { x: 1050, y: groundY - 100, width: 110, height: 20 },
            { x: 2100, y: groundY - 110, width: 150, height: 20 },
            { x: 2700, y: groundY - 120, width: 140, height: 20 },
            { x: 3300, y: groundY - 100, width: 130, height: 20 },
            { x: 4500, y: groundY - 110, width: 120, height: 20 },
            { x: 5100, y: groundY - 120, width: 130, height: 20 },
            { x: 5700, y: groundY - 100, width: 100, height: 20 },
            // Nivel 2 — alcanzable desde nivel 1
            { x: 600, y: groundY - 220, width: 100, height: 20 },
            { x: 1550, y: groundY - 210, width: 120, height: 20 },
            { x: 2400, y: groundY - 230, width: 120, height: 20 },
            { x: 3000, y: groundY - 220, width: 110, height: 20 },
            { x: 3900, y: groundY - 210, width: 100, height: 20 },
            { x: 4800, y: groundY - 230, width: 110, height: 20 },
            { x: 5400, y: groundY - 220, width: 120, height: 20 },
            // Nivel 3 — alcanzable desde nivel 2
            { x: 800, y: groundY - 330, width: 140, height: 20 },
            { x: 1300, y: groundY - 320, width: 130, height: 20 },
            { x: 1800, y: groundY - 310, width: 100, height: 20 },
            { x: 3600, y: groundY - 330, width: 120, height: 20 },
            { x: 4200, y: groundY - 320, width: 140, height: 20 }
        ];

        floatingPlatforms.forEach(platform => {
            platforms.push({
                ...platform,
                color: this.environment.platformColor
            });
        });

        return platforms;
    }



    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
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

        // Si está en pausa, no permitir otros controles
        if (this.paused) {
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
        this.attackAnimationTimer = Date.now(); // Guardar tiempo de inicio de ataque

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

    updatePhysics(deltaTime) {
        // Factor de tiempo normalizado a 60fps (16.67ms por frame)
        // Se limita a 50ms para evitar saltos de física en picos de lag
        const dt = Math.min(deltaTime, 50) / 16.67;

        // Actualizar jugador
        if (!this.player.isGrounded) {
            this.player.velocityY += this.config.gravity * dt;
        }

        this.player.x += this.player.velocityX * dt;
        this.player.y += this.player.velocityY * dt;

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
                if (this.player.velocityY >= 0 && this.player.y < platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isGrounded = true;
                    this.player.isJumping = false;
                }
            }
        }

        // Actualizar proyectiles
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.x += projectile.velocityX * dt;
            projectile.y += projectile.velocityY * dt;

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



            return true;
        });

        // Actualizar enemigos
        this.updateEnemies(dt);

        // Actualizar gemas
        this.updateGems(deltaTime);

        // Actualizar partículas
        this.updateParticles(dt);

        // Actualizar tiempo de supervivencia
        this.player.survivalTime = Math.floor((Date.now() - this.levelStartTime) / 1000);

        // Verificar si el jugador sigue vivo
        if (this.player.health <= 0) {
            this.gameOver = true;
        }
    }

    updateEnemies(dt) {
        // Spawn de enemigos (usa deltaTime real via dt)
        this.enemySpawnTimer += 16.67 * dt;
        if (this.enemySpawnTimer >= this.enemySpawnInterval && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }



        // Limpiar memoria: despawnear enemigos que se han quedado muy atrás de la cámara
        this.enemies = this.enemies.filter(enemy => enemy.x >= this.camera.x - 800);

        // Actualizar posición y física de enemigos
        for (const enemy of this.enemies) {
            // Aplicar gravedad siempre
            enemy.velocityY += this.config.gravity * dt;

            // Limitar velocidad de caída máxima
            if (enemy.velocityY > 15) {
                enemy.velocityY = 15;
            }

            // Movimiento horizontal hacia el jugador
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                const moveX = (dx / distance) * 1.5 * dt;
                enemy.x += moveX;

                // Detectar si hay una plataforma adelante y saltar si es necesario
                const nextX = enemy.x + moveX * 10;
                const needsJump = this.shouldEnemyJump(enemy, nextX);

                // Solo saltar si está en el suelo y realmente necesita saltar
                if (needsJump && enemy.isGrounded && Math.random() > 0.3) {
                    enemy.velocityY = -this.config.jumpPower * 0.8;
                    enemy.isJumping = true;
                    enemy.isGrounded = false;
                }
            }

            // Actualizar posición vertical
            enemy.y += enemy.velocityY * dt;

            // Resetear estado de grounded
            enemy.isGrounded = false;

            // Verificar colisión con plataformas (excepto el suelo principal)
            // Usamos el centro del enemigo para que caiga si pasa del borde visual
            const enemyCenterX = enemy.x + enemy.width / 2;
            for (const platform of this.platforms) {
                if (platform.y < this.config.height - 60) { // Ignorar suelo principal aquí
                    // Solo aterrizar si el centro del enemigo está sobre la plataforma
                    const centerOverPlatform = enemyCenterX > platform.x && enemyCenterX < platform.x + platform.width;
                    if (centerOverPlatform && this.checkCollision(enemy, platform)) {
                        if (enemy.velocityY > 0 && enemy.y < platform.y) {
                            enemy.y = platform.y - enemy.height;
                            enemy.velocityY = 0;
                            enemy.isGrounded = true;
                            enemy.isJumping = false;
                            break;
                        }
                    }
                }
            }

            // Siempre verificar colisión con el suelo principal como respaldo FINAL
            if (enemy.y + enemy.height >= this.config.height - 50) {
                enemy.y = this.config.height - 50 - enemy.height;
                enemy.velocityY = 0;
                enemy.isGrounded = true;
                enemy.isJumping = false;
            }

            // Colisión con jugador (con i-frames para evitar daño continuo)
            if (this.checkCollision(enemy, this.player)) {
                const now = Date.now();
                if (now - this.player.lastDamageTime > this.player.invincibilityDuration) {
                    this.player.health -= 10;
                    this.player.lastDamageTime = now;
                    this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#FF0000');
                }
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

    updateGems(deltaTime) {
        this.gemSpawnTimer += deltaTime;
        if (this.gemSpawnTimer >= this.gemSpawnInterval && this.gems.length < this.maxGems) {
            this.spawnGem();
            this.gemSpawnTimer = 0;
        }

        for (let i = this.gems.length - 1; i >= 0; i--) {
            const gem = this.gems[i];
            // Detección por distancia desde el centro VISUAL del personaje (no el hitbox de colisión)
            // El sprite (153x153) se alinea por los pies con el hitbox (40x60),
            // así que el centro visual está muy por encima del centro del hitbox.
            const playerVisualCenterX = this.player.x + this.player.width / 2;
            // El sprite se extiende ~88px arriba del hitbox top, centro visual ≈ 40px arriba del hitbox top
            const playerVisualCenterY = this.player.y - 40;
            const gemCenterX = gem.x + gem.width / 2;
            const gemCenterY = gem.y + gem.height / 2;

            const dx = playerVisualCenterX - gemCenterX;
            const dy = playerVisualCenterY - gemCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Radio de recogida que coincide con el cuerpo visible del personaje (~50px)
            const pickupDistance = 50;
            if (distance < pickupDistance) {
                this.player.gems += 5;
                this.score += 50;
                this.createParticles(gem.x + gem.width / 2, gem.y + gem.height / 2, '#FFD700');
                this.gems.splice(i, 1);
            }
        }
    }

    updateParticles(dt) {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.velocityX * dt;
            particle.y += particle.velocityY * dt;
            particle.velocityY += 0.2 * dt;
            particle.life -= 2 * dt;
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
    }



    spawnGem() {
        // Spawn gemas dentro del área visible de la cámara, a alturas alcanzables
        const groundY = this.config.height - 50;

        // Generar tokens entre 80px y 200px por encima del suelo
        // Esto los pone a la altura de la cabeza del jugador o un poco arriba (requiere saltar)
        const minAboveGround = 80;  // Mínimo por encima del suelo (a la altura del jugador)
        const maxAboveGround = 200; // Máximo por encima del suelo (alcanzable con salto)
        const y = groundY - minAboveGround - Math.random() * (maxAboveGround - minAboveGround);

        // Generar lejos del jugador para evitar recogida instantánea
        let gemX;
        do {
            gemX = this.camera.x + Math.random() * (this.config.width - 20) + 10;
        } while (Math.abs(gemX - this.player.x) < 150); // Mínimo 150px de distancia horizontal

        const gem = {
            x: gemX,
            y: y,
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
            obj1.y + obj1.height >= obj2.y; // Usar >= para mantener el estado grounded estable
    }

    updateAnimations(deltaTime) {
        this.animationTimer += deltaTime;

        let currentAnimationSpeed = this.animationSpeed;

        // Guarda el estado anterior para detectar cambios de animación
        const previousState = this.animationState;

        // 1. Prioridad: Ataque
        if (this.animationState === 'attacking') {
            const timeSinceAttack = Date.now() - (this.attackAnimationTimer || 0);
            // El ataque tiene 16 frames, durará aprox 16 * 80 = 1280ms
            if (timeSinceAttack > 1280) {
                this.animationState = 'idle';
            } else {
                currentAnimationSpeed = 80; // Ataque más lento
            }
        }

        // 2. Prioridad: Salto
        if (this.animationState !== 'attacking') {
            if (!this.player.isGrounded) {
                this.animationState = 'jumping';
                currentAnimationSpeed = 250; // Salto mucho más lento
            } else {
                // 3. Prioridad: Caminar o Reposo
                if (Math.abs(this.player.velocityX) > 0.5) {
                    this.animationState = 'walking';
                    currentAnimationSpeed = this.walkAnimationSpeed; // Usa los 200ms
                } else {
                    this.animationState = 'idle';
                    currentAnimationSpeed = 400; // Reposo muy relajado (400ms por frame)
                }
            }
        }

        // Si el estado de animación cambió, reiniciar el frame al inicio de la animación
        if (previousState !== this.animationState) {
            this.animationFrame = 0;
            this.animationTimer = 0;
        }

        // Obtener la configuración de la animación actual
        const animConfig = this.spriteConfig.animations[this.animationState] || this.spriteConfig.animations.idle;
        const maxFrames = (animConfig.end - animConfig.start) + 1;

        // Actualizar frame
        if (this.animationTimer >= currentAnimationSpeed) {
            this.animationTimer = 0;
            this.animationFrame = (this.animationFrame + 1) % maxFrames;
        }
    }



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

            // Escalar el GIF para que cubra todo el alto de la pantalla, evitando el hueco azul arriba
            const gifHeight = this.canvas.height;
            const bgScale = gifHeight / this.castleGif.height;
            const gifWidth = this.castleGif.width * bgScale;
            const gifY = 0; // Pegado al techo

            // Dibujar múltiples capas de paralaje para mayor profundidad
            for (const layer of this.parallaxLayers) {
                const cameraOffset = this.camera.x * layer.speed;
                const repetitions = Math.ceil((this.canvas.width + gifWidth) / gifWidth) + 1;

                this.ctx.globalAlpha = layer.alpha;

                // Dibujar múltiples copias para crear efecto infinito
                for (let i = 0; i < repetitions; i++) {
                    const gifX = (i * gifWidth) - (cameraOffset % gifWidth);
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

        // Dibujar plataformas
        for (const platform of this.platforms) {
            if (platform.isFloor && this.floorImageLoaded && this.floorImage.complete) {
                this.ctx.save();
                const imgWidth = this.floorImage.width || 1;
                const imgHeight = this.floorImage.height || 1;

                // Si la imagen tiene mucha transparencia y se dibuja bajito, vamos a definir 
                // una altura específica forzada y alinear la parte *inferior* de la textura con el borde inferior 
                // de la pantalla para asegurarnos de que quede visible dentro del canvas.
                const drawHeight = 200; // Puedes ajustar qué tan alto quieres que se vea el pasto/tierra visualmente
                // Proporción correcta para que no se deforme
                const scaleX = drawHeight / imgHeight;
                const drawWidth = imgWidth * scaleX;

                // Alineamos el borde INFERIOR de la imagen con el borde INFERIOR del canvas
                // Así nos aseguramos de que no se está dibujando por debajo de la pantalla invisible
                const drawY = this.canvas.height - drawHeight;

                for (let i = platform.x; i < platform.x + platform.width; i += drawWidth) {
                    this.ctx.drawImage(this.floorImage, i, drawY, drawWidth, drawHeight);
                }

                // Dibujamos la cajita de colisión base invisible (para debug) transparente
                // o no la dibujamos para que sólo se vea el piso lindo
                // this.ctx.fillStyle = 'rgba(139, 69, 19, 0)'; 
                // this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

                this.ctx.restore();
            } else if (!platform.isFloor && this.platformsImageLoaded && this.platformsImage.complete) {
                // Dibujar plataforma flotante con la imagen única

                // Mantener la proporción original del pixel art para que no se vea aplastado
                const drawHeight = platform.width * (this.platformsImage.height / this.platformsImage.width);

                // Offset vertical para que la colisión invisible (pies) encaje mejor con el dibujo
                // Ajusta este numerito si aún ves que flota (mayor = imagen más arriba)
                const offsetY = 30;

                this.ctx.drawImage(
                    this.platformsImage,
                    platform.x, platform.y - offsetY, platform.width, drawHeight
                );
            } else {
                // Fallback a color sólido si la imagen no ha cargado o es otra plataforma de tipo desconocido
                this.ctx.fillStyle = platform.color;
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            }
        }

        // Dibujar gemas
        for (const gem of this.gems) {
            if (this.tokenImageLoaded && this.tokenImage.complete) {
                // Dibujar la imagen del token un poco más grande que su caja de colisión
                this.ctx.drawImage(this.tokenImage, gem.x - 5, gem.y - 5, gem.width + 10, gem.height + 10);
            } else {
                this.ctx.fillStyle = gem.color;
                this.ctx.beginPath();
                this.ctx.arc(gem.x + gem.width / 2, gem.y + gem.height / 2, gem.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
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



        // Dibujar proyectiles con Espada de Fe (horizontal)
        for (const projectile of this.projectiles) {
            if (this.swordImageLoaded) {
                // Dibujar Espada de Fe como proyectil horizontal
                const swordWidth = 30;
                const swordHeight = 20;

                this.ctx.save();
                this.ctx.translate(projectile.x + projectile.width / 2, projectile.y + projectile.height / 2);

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
                    -swordWidth / 2,
                    -swordHeight / 2,
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

        if (this.characterSpriteLoaded && this.characterSprite.complete) {
            this.ctx.save();

            const playerCenterX = this.player.x + this.player.width / 2;

            // Voltear si mira a la izquierda
            if (this.player.facing < 0) {
                this.ctx.translate(playerCenterX, this.player.y);
                this.ctx.scale(-1, 1);
                this.ctx.translate(-playerCenterX, -this.player.y);
            }

            const frameWidth = this.spriteConfig.frameWidth;
            const frameHeight = this.spriteConfig.frameHeight;

            // Obtener el frame absoluto basado en el estado
            const animConfig = this.spriteConfig.animations[this.animationState] || this.spriteConfig.animations.idle;
            // Asegurarse de no exceder los frames disponibles para la animación actual
            const currentLocalFrame = this.animationFrame % ((animConfig.end - animConfig.start) + 1);
            const absoluteFrameIndex = animConfig.start + currentLocalFrame;

            // Calcular X e Y en la cuadrícula del spritesheet original (7 columnas)
            const frameCol = absoluteFrameIndex % this.spriteConfig.framesPerRow;
            const frameRow = Math.floor(absoluteFrameIndex / this.spriteConfig.framesPerRow);

            const frameX = frameCol * frameWidth;
            const frameY = frameRow * frameHeight;

            // Escala para ajustar el tamaño del personaje (192px sprite adaptado al collider 40x60)
            const scale = 0.8;
            const scaledWidth = frameWidth * scale;
            const scaledHeight = frameHeight * scale;

            // Offset para centrar el sprite en el collider
            const offsetX = playerCenterX - (scaledWidth / 2);
            // El collider tiene 60 de alto, el sprite es más grande, alineamos a nivel inferior
            // Se le quitó el offset que tenía (+15) para subirlo un poco y que no se hunda
            const offsetY = (this.player.y + this.player.height) - scaledHeight + 6;

            this.ctx.drawImage(
                this.characterSprite,
                frameX, frameY, frameWidth, frameHeight,
                offsetX,
                offsetY,
                scaledWidth, scaledHeight
            );

            this.ctx.restore();
        }
        else {
            // Fallback - dibujar rectángulo simple si no hay imagen
            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
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

        // Game over — pantalla medieval
        if (this.gameOver) {
            this.drawMedievalGameOver();
        }

        // HUD con estilo pixelado - barra de vida
        if (!this.gameOver) {
            // Inicializar si no existe
            if (this.player.displayHealth === undefined) {
                this.player.displayHealth = this.player.health;
            }

            // Animar (lerp rústico) hacia la vida real
            if (this.player.displayHealth > this.player.health) {
                this.player.displayHealth -= 0.5; // Velocidad de bajada
                if (this.player.displayHealth < this.player.health) {
                    this.player.displayHealth = this.player.health;
                }
            } else if (this.player.displayHealth < this.player.health) {
                this.player.displayHealth += 0.5; // Velocidad de subida
                if (this.player.displayHealth > this.player.health) {
                    this.player.displayHealth = this.player.health;
                }
            }

            const healthPercentage = Math.max(0, Math.min(1, this.player.displayHealth / 100));

            const barX = 20;
            const barY = 20;
            const width = 250;
            const height = 24;

            this.ctx.save();

            // 1. Borde exterior (madera oscura/hierro forjado)
            this.ctx.fillStyle = '#1a1105';
            this.ctx.fillRect(barX, barY, width, height);

            // 2. Borde decorativo en la capa interna (oro viejo/bronce desgastado)
            const gradientBorde = this.ctx.createLinearGradient(barX, barY, barX, barY + height);
            gradientBorde.addColorStop(0, '#DAA520');
            gradientBorde.addColorStop(0.5, '#B8860B');
            gradientBorde.addColorStop(1, '#8B6508');
            this.ctx.fillStyle = gradientBorde;
            this.ctx.fillRect(barX + 2, barY + 2, width - 4, height - 4);

            // Sombras para añadir separación entre chapas metálicas
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            for (let i = 25; i < width - 10; i += 40) {
                this.ctx.fillRect(barX + i, barY + 2, 2, height - 4);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.fillRect(barX + i - 1, barY + 2, 1, height - 4);
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            }

            // 3. Fondo vacío de la barra (Rojo oscuro, casi negro, para simular cuenco profundo)
            this.ctx.fillStyle = '#2a0505';
            this.ctx.fillRect(barX + 4, barY + 4, width - 8, height - 8);

            // 4. Relleno de vida principal animado (usando interpolación de displayHealth)
            const healthFillWidth = Math.max(0, (width - 8) * healthPercentage);
            if (healthFillWidth > 0) {
                const gradientVida = this.ctx.createLinearGradient(0, barY + 4, 0, barY + height - 4);
                gradientVida.addColorStop(0, '#ff4d4d');   // Brillo superior de la poción/sangre
                gradientVida.addColorStop(0.3, '#cc0000'); // Central
                gradientVida.addColorStop(0.8, '#8b0000'); // Oscuro al fondo
                gradientVida.addColorStop(1, '#4a0000');   // Sombra abajo
                this.ctx.fillStyle = gradientVida;
                this.ctx.fillRect(barX + 4, barY + 4, healthFillWidth, height - 8);

                // Efecto de reflejo de cristal/brillo superior en el líquido
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                this.ctx.fillRect(barX + 4, barY + 4, healthFillWidth, (height - 8) / 3);
            }

            // 5. Detalles medievales - Remaches (Rivets) de plomo en las esquinas de bronce
            this.ctx.fillStyle = '#444';
            // Puntos grises oscuros
            this.ctx.fillRect(barX + 4, barY + 5, 2, 2);
            this.ctx.fillRect(barX + 4, barY + height - 7, 2, 2);
            this.ctx.fillRect(barX + width - 6, barY + 5, 2, 2);
            this.ctx.fillRect(barX + width - 6, barY + height - 7, 2, 2);
            // Brillo del remache
            this.ctx.fillStyle = '#888';
            this.ctx.fillRect(barX + 4, barY + 5, 1, 1);
            this.ctx.fillRect(barX + 4, barY + height - 7, 1, 1);
            this.ctx.fillRect(barX + width - 6, barY + 5, 1, 1);
            this.ctx.fillRect(barX + width - 6, barY + height - 7, 1, 1);

            // 6. Texto descriptivo arriba de la barra para darle más inmersión RPG
            this.ctx.fillStyle = '#FFD700'; // Letra dorada clara
            this.ctx.font = 'bold 12px Georgia, serif';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'bottom';
            // Sombra del texto
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillText("HP", barX + 2, barY - 2 + 1);
            this.ctx.fillStyle = '#FFE5C2';
            this.ctx.fillText("HP", barX + 1, barY - 2);

            // Valor numérico de salud dentro de la barra
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Sombra
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`${Math.ceil(this.player.health)} / ${this.player.maxHealth}`, barX + width / 2 + 1, barY + height / 2 + 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(`${Math.ceil(this.player.health)} / ${this.player.maxHealth}`, barX + width / 2, barY + height / 2 + 1);

            this.ctx.restore();

            // HUD — Score y Tokens
            this.ctx.save();
            this.ctx.font = 'bold 14px Georgia, serif';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';

            // Score
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillText(`⚔ Score: ${this.score}`, barX + 1, barY + height + 11);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`⚔ Score: ${this.score}`, barX, barY + height + 10);

            // Oro
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillText(`🪙 Oro: ${this.player.gems}`, barX + 1, barY + height + 31);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`🪙 Oro: ${this.player.gems}`, barX, barY + height + 30);

            this.ctx.restore();
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
                    this.updatePhysics(deltaTime);
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

    drawMedievalGameOver() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // ── Fondo oscuro con viñeta radial ──
        const vignette = this.ctx.createRadialGradient(cx, cy, h * 0.15, cx, cy, h * 0.85);
        vignette.addColorStop(0, 'rgba(15, 10, 5, 0.80)');
        vignette.addColorStop(0.6, 'rgba(8, 5, 2, 0.90)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.97)');
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, w, h);

        // ── Partículas de ceniza flotante ──
        const time = Date.now() / 1000;
        this.ctx.fillStyle = 'rgba(200, 150, 80, 0.15)';
        for (let i = 0; i < 30; i++) {
            const px = (cx + Math.sin(time * 0.3 + i * 47) * w * 0.4) % w;
            const py = (h - ((time * 15 + i * 73) % h));
            this.ctx.beginPath();
            this.ctx.arc(px, py, 1.5 + Math.sin(i) * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // ── Líneas decorativas celtas ──
        const lineY1 = cy - 80;
        const lineY2 = cy + 30;
        const lineW = Math.min(w * 0.6, 500);

        this.ctx.strokeStyle = '#8B6914';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.6;

        // Línea superior con adornos
        this.ctx.beginPath();
        this.ctx.moveTo(cx - lineW / 2, lineY1);
        this.ctx.lineTo(cx + lineW / 2, lineY1);
        this.ctx.stroke();
        // Diamante central superior
        this.ctx.fillStyle = '#8B6914';
        this.ctx.save();
        this.ctx.translate(cx, lineY1);
        this.ctx.rotate(Math.PI / 4);
        this.ctx.fillRect(-5, -5, 10, 10);
        this.ctx.restore();
        // Diamantes laterales
        for (const side of [-1, 1]) {
            this.ctx.save();
            this.ctx.translate(cx + side * (lineW / 2 - 20), lineY1);
            this.ctx.rotate(Math.PI / 4);
            this.ctx.fillRect(-3, -3, 6, 6);
            this.ctx.restore();
        }

        // Línea inferior
        this.ctx.beginPath();
        this.ctx.moveTo(cx - lineW / 2, lineY2);
        this.ctx.lineTo(cx + lineW / 2, lineY2);
        this.ctx.stroke();
        this.ctx.save();
        this.ctx.translate(cx, lineY2);
        this.ctx.rotate(Math.PI / 4);
        this.ctx.fillRect(-5, -5, 10, 10);
        this.ctx.restore();

        this.ctx.globalAlpha = 1.0;

        // ── Ícono de calavera ──
        const skullY = cy - 130;
        this.ctx.font = '40px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'rgba(180, 140, 80, 0.5)';
        this.ctx.fillText('☠', cx, skullY);

        // ── Texto principal ──
        const fontSize = Math.min(w * 0.055, 42);
        this.ctx.font = `bold ${fontSize}px Georgia, "Times New Roman", serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const textY = cy - 45;

        // Sombra profunda
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillText('HAS MUERTO', cx + 3, textY + 3);
        // Resplandor dorado exterior
        this.ctx.shadowColor = '#A0801A';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#C9A84C';
        this.ctx.fillText('HAS MUERTO', cx, textY);
        this.ctx.shadowBlur = 0;

        // Subtítulo
        const subFontSize = Math.min(w * 0.028, 22);
        this.ctx.font = `${subFontSize}px Georgia, serif`;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillText('¿Deseas volver a empezar?', cx + 2, textY + fontSize * 0.9 + 2);
        this.ctx.fillStyle = '#B8976A';
        this.ctx.fillText('¿Deseas volver a empezar?', cx, textY + fontSize * 0.9);

        // ── Estadísticas ──
        const statsY = cy + 50;
        this.ctx.font = `${Math.min(w * 0.018, 14)}px Georgia, serif`;
        this.ctx.fillStyle = '#7A6844';
        this.ctx.fillText(`⚔ Score: ${this.score}   |   👹 Enemigos: ${this.player.enemiesDefeated}   |   🪙 Oro: ${this.player.gems}`, cx, statsY);

        // ── Botones medievales ──
        const btnW = Math.min(w * 0.16, 140);
        const btnH = 48;
        const btnY = cy + 85;
        const spacing = btnW * 0.6;

        // Actualizar posiciones de botones para detección de clicks
        this.gameOverButtons.yes.x = cx - spacing - btnW / 2;
        this.gameOverButtons.yes.y = btnY;
        this.gameOverButtons.yes.width = btnW;
        this.gameOverButtons.yes.height = btnH;
        this.gameOverButtons.no.x = cx + spacing - btnW / 2;
        this.gameOverButtons.no.y = btnY;
        this.gameOverButtons.no.width = btnW;
        this.gameOverButtons.no.height = btnH;

        [this.gameOverButtons.yes, this.gameOverButtons.no].forEach(button => {
            const bx = button.x;
            const by = button.y;

            // Resplandor hover
            if (button.hovered) {
                this.ctx.shadowColor = '#D4A845';
                this.ctx.shadowBlur = 18;
            }

            // Borde exterior oscuro (hierro forjado)
            this.ctx.fillStyle = '#1A1005';
            this.roundRect(bx - 4, by - 4, btnW + 8, btnH + 8, 6);
            this.ctx.fill();

            // Borde dorado medio
            this.ctx.fillStyle = '#5C4A1E';
            this.roundRect(bx - 2, by - 2, btnW + 4, btnH + 4, 5);
            this.ctx.fill();

            // Fondo principal con gradiente bronce
            const btnGrad = this.ctx.createLinearGradient(bx, by, bx, by + btnH);
            if (button.hovered) {
                btnGrad.addColorStop(0, '#C9A84C');
                btnGrad.addColorStop(0.4, '#A0801A');
                btnGrad.addColorStop(0.6, '#8B6914');
                btnGrad.addColorStop(1, '#6B4F10');
            } else {
                btnGrad.addColorStop(0, '#8B6914');
                btnGrad.addColorStop(0.4, '#6B4F10');
                btnGrad.addColorStop(0.6, '#5C4A1E');
                btnGrad.addColorStop(1, '#3D2E0A');
            }
            this.ctx.fillStyle = btnGrad;
            this.roundRect(bx, by, btnW, btnH, 4);
            this.ctx.fill();

            // Bisel superior (luz)
            this.ctx.fillStyle = 'rgba(255, 220, 150, 0.15)';
            this.roundRect(bx + 2, by + 2, btnW - 4, btnH / 2 - 2, 3);
            this.ctx.fill();

            // Línea grabada interior
            this.ctx.strokeStyle = 'rgba(90, 60, 10, 0.5)';
            this.ctx.lineWidth = 1;
            this.roundRect(bx + 4, by + 4, btnW - 8, btnH - 8, 3);
            this.ctx.stroke();

            // Remaches decorativos en esquinas
            this.ctx.fillStyle = '#A08030';
            for (const [rx, ry] of [[bx + 8, by + 8], [bx + btnW - 8, by + 8], [bx + 8, by + btnH - 8], [bx + btnW - 8, by + btnH - 8]]) {
                this.ctx.beginPath();
                this.ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.shadowBlur = 0;

            // Texto del botón
            const btnFontSize = Math.min(w * 0.025, 22);
            this.ctx.font = `bold ${btnFontSize}px Georgia, serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            // Sombra
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillText(button.text, bx + btnW / 2 + 1, by + btnH / 2 + 2);
            // Texto principal
            this.ctx.fillStyle = button.hovered ? '#FFF5DC' : '#FFE5C2';
            this.ctx.fillText(button.text, bx + btnW / 2, by + btnH / 2);
        });
    }

    // Utilidad para dibujar rectángulos redondeados
    roundRect(x, y, w, h, r) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
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
        this.player.displayHealth = this.player.maxHealth;
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
