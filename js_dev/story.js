// Clase para el Modo Historia aa
export class StoryMode {
    constructor(settings = {}) {
      //  console.log('=== INICIO CONSTRUCTOR STORY MODE ===');
        this.sfxVolume = settings.sfxVolume !== undefined ? settings.sfxVolume : 0.5;
        this.timeOfDay = settings.timeOfDay || 'day';

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

        // Pre-cargar imágenes de fondo para la hora del día
        this.bgImages = {
            day: new Image(),
            sunset: new Image(),
            night: new Image()
        };
        this.bgImagesLoaded = {
            day: false,
            sunset: false,
            night: false
        };

        this.bgImages.day.onload = () => { this.bgImagesLoaded.day = true; };
        this.bgImages.sunset.onload = () => { this.bgImagesLoaded.sunset = true; };
        this.bgImages.night.onload = () => { this.bgImagesLoaded.night = true; };

        this.bgImages.day.src = 'img/dia.png';
        this.bgImages.sunset.src = 'img/tarde.png';
        this.bgImages.night.src = 'img/noche.png';

        // Intentar usar el GIF convirtiéndolo a video con canvas como respaldo
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
            yes: { x: 0, y: 0, width: 150, height: 50, text: 'SÍ', hovered: false },
            no: { x: 0, y: 0, width: 150, height: 50, text: 'NO', hovered: false }
        };

        // Botones de victoria
        this.victoryButtons = {
            restart: { x: 0, y: 0, width: 150, height: 50, text: 'REINICIAR', hovered: false },
            menu: { x: 0, y: 0, width: 150, height: 50, text: 'MENÚ', hovered: false }
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
            lastDamageTime: 0,           // Tiempo del último daño recibido
            invincibilityDuration: 1000  // 1 segundo de invencibilidad tras recibir daño
        };

        // Plataformas (escenario fijo)
        this.platforms = this.generatePlatforms();

        // Árboles (escenario de fondo)
        this.trees = this.generateTrees();



        // Enemigos
        this.enemies = [];
        this.maxEnemies = 5; // Cantidad fija de enemigos
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 3000; // Intervalo fijo

        // Gemas
        this.gems = [];
        this.maxGems = 5; // Cantidad fija de gemas en el escenario
        this.gemSpawnTimer = 0;
        this.gemSpawnInterval = 7000;

        // Sistema de Frases de Muerte
        this.deathPhrases = [
            "Tu trayectoria ha sido desviada por el destino",
            "Tu vuelo terminó antes de tocar el cielo de la victoria",
            "Luchaste como un león, caíste como un hombre",
            "Tu linaje termina aquí, y con él, tus promesas",
            "Tu sangre riega las raíces del olvido",
            "Las sombras consumen tu último suspiro",
            "El eco de tu acero se apaga en el silencio",
            "Ni los dioses pudieron salvar tu alma",
            "Tu nombre será borrado de los anales del tiempo",
            "La victoria fue solo un espejismo en tu camino"
        ];
        this.currentDeathPhrase = "";



        // Estado de teclas táctiles
        this.touchKeys = {};
        this.setupResizeHandler();

        // Estado de Victoria
        this.victory = false;

        // --- SISTEMAS ADICIONALES MODO HISTORIA ---
        this.checkpoints = [
            { x: 3500, active: false, particlesGenerated: false },
            { x: 6500, active: false, particlesGenerated: false }
        ];
        this.lastActiveCheckpoint = null;

        this.boss = null;
        this.bossActive = false;
        this.bossDefeated = false;
        this.cameraLocked = false;
        this.storyIntroActive = true;
        // ------------------------------------------

        // Sistema Anti-Camping
        this.playerStillTimer = 0;
        this.lastPlayerX = this.player.x;
        this.campingThreshold = 5000; // 5 segundos para invocar castigo

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

        // Física pulida para plataformas
        this.coyoteTimeMax = 150; // ms permitidos para saltar tras dejar el suelo
        this.coyoteTimeCounter = 0;
        this.jumpBufferMax = 150; // ms que se almacena el input de salto
        this.jumpBufferCounter = 0;

        // Configuración del sprite sheet unificado (49 frames, índices 0 a 48)
        this.spriteConfig = {
            frameWidth: 192,
            frameHeight: 192,
            framesPerRow: 7,
            animations: {
                idle: { start: 0, end: 3 },
                walking: { start: 4, end: 18 },
                jumping: { start: 19, end: 30 },
                hurt: { start: 26, end: 27 },
                attacking: { start: 33, end: 43 }
            }
        };

        // Duende para enemigos básicos (Hoja de sprites 768x768, 3x3)
        this.duendeImage = new Image();
        this.duendeImageLoaded = false;
        this.duendeImage.onload = () => { this.duendeImageLoaded = true; };
        this.duendeImage.src = 'img/duende acciones.png';

        // Configuración de la hoja de sprites del duende
        this.duendeSpriteConfig = {
            frameWidth: 256,
            frameHeight: 256,
            framesPerRow: 3,
            animations: {
                reposo: { start: 0, end: 1 },
                caminar: { start: 2, end: 5 },
                ataque: { start: 6, end: 8 }
            }
        };

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
            console.log('Flecha de Fe cargada correctamente');
        };
        this.swordImage.onerror = () => {
            console.error('Error cargando Flecha de Fe');
        };
        this.swordImage.src = 'img/flecha de fe.png';

        // Imagen del token
        this.tokenImage = new Image();
        this.tokenImageLoaded = false;
        this.tokenImage.onload = () => { this.tokenImageLoaded = true; };
        this.tokenImage.src = 'img/token.png';

        // Imagen del árbol
        this.treeImage = new Image();
        this.treeImageLoaded = false;
        this.treeImage.onload = () => { this.treeImageLoaded = true; };
        this.treeImage.src = 'img/arbol.png';





        // Estado del nivel
        this.levelStartTime = Date.now();
        this.lastFrameTime = Date.now();

        // Inicializar Audio de Muerte
        this.deathAudio = new Audio('songs/Death Is Just Another Path.mp3');
        this.deathAudio.volume = this.sfxVolume;

        // Inicialización
        if (!this.canvas || !this.ctx) {
            console.error('No se puede inicializar el juego - canvas o contexto no disponible');
            return;
        }

        this.loadUpgrades();
        this.setupControls();
        this.setupMouseControls();
        this.setupTouchControls();
        // Eliminado showLevelIntro() y updateHUD() para empezar directamente con acción
        this.gameLoop();

        console.log('Constructor StoryMode completado - Canvas listo');
    }

    loadUpgrades() {
        this.healingTokensOwned = parseInt(localStorage.getItem('storyHealingTokens') || '0');
        this.goldCrossbowsOwned = parseInt(localStorage.getItem('storyGoldCrossbows') || '0');
        this.armorLevel = parseInt(localStorage.getItem('storyArmorLevel') || '0');
        this.armorDurability = this.armorLevel > 0 ? 3 : 0;
        this.goldCrossbowActive = false;
        this.goldCrossbowTimer = 0;

        // Sincronizar el oro del jugador con localStorage
        if (this.player) {
            this.player.gems = parseInt(localStorage.getItem('storyGold') || '0');
        }
    }

    useHealingToken() {
        if (this.gameOver || this.paused || this.victory || this.storyIntroActive) return;
        if (this.healingTokensOwned > 0 && this.player.health < this.player.maxHealth) {
            this.healingTokensOwned--;
            localStorage.setItem('storyHealingTokens', this.healingTokensOwned);
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 50);
            this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height - 30, '#32CD32'); // Verdes
            console.log('Token de curación usado. Restantes:', this.healingTokensOwned);
        }
    }

    useGoldCrossbow() {
        if (this.gameOver || this.paused || this.victory || this.storyIntroActive) return;
        if (this.goldCrossbowsOwned > 0 && !this.goldCrossbowActive) {
            this.goldCrossbowsOwned--;
            localStorage.setItem('storyGoldCrossbows', this.goldCrossbowsOwned);
            this.goldCrossbowActive = true;
            this.goldCrossbowTimer = 5000; // 5 segundos
            this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height - 30, '#FFD700'); // Doradas
            console.log('Ballesta de oro usada. Cargas restantes:', this.goldCrossbowsOwned);
        }
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

        // Plataformas flotantes — alturas variadas y patrones únicos por zona
        // Salto máximo ~144px. Nivel 1: alcanzable desde suelo. Nivel 2: alcanzable desde nivel 1 cercano.
        const groundY = this.config.height - 50;

        const floatingPlatforms = [
            // === ZONA 1: Escalera ascendente (x: 300-1100) ===
            { x: 350, y: groundY - 60, width: 150, height: 20 },
            { x: 580, y: groundY - 100, width: 120, height: 20 },
            { x: 820, y: groundY - 135, width: 100, height: 20 },
            { x: 700, y: groundY - 210, width: 90, height: 20 },

            // === ZONA 2: Plataformas bajas y anchas (x: 1200-1900) ===
            { x: 1200, y: groundY - 70, width: 180, height: 20 },
            { x: 1500, y: groundY - 80, width: 160, height: 20 },
            { x: 1750, y: groundY - 65, width: 170, height: 20 },

            // === ZONA 3: Zigzag vertical (x: 2000-2800) ===
            { x: 2050, y: groundY - 130, width: 100, height: 20 },
            { x: 2250, y: groundY - 70, width: 110, height: 20 },
            { x: 2450, y: groundY - 120, width: 95, height: 20 },
            { x: 2650, y: groundY - 60, width: 130, height: 20 },
            { x: 2350, y: groundY - 200, width: 85, height: 20 },

            // === ZONA 4: Torre con escalones (x: 2900-3500) ===
            { x: 2950, y: groundY - 80, width: 140, height: 20 },
            { x: 3100, y: groundY - 140, width: 110, height: 20 },
            { x: 3050, y: groundY - 205, width: 100, height: 20 },
            { x: 3350, y: groundY - 90, width: 120, height: 20 },

            // === ZONA 5: Plataformas gemelas (x: 3600-4300) ===
            { x: 3650, y: groundY - 100, width: 100, height: 20 },
            { x: 3850, y: groundY - 100, width: 100, height: 20 },
            { x: 3750, y: groundY - 190, width: 130, height: 20 },
            { x: 4100, y: groundY - 75, width: 150, height: 20 },

            // === ZONA 6: Dispersas y variadas (x: 4400-5200) ===
            { x: 4450, y: groundY - 115, width: 90, height: 20 },
            { x: 4700, y: groundY - 60, width: 170, height: 20 },
            { x: 4950, y: groundY - 130, width: 80, height: 20 },
            { x: 4600, y: groundY - 195, width: 100, height: 20 },
            { x: 5150, y: groundY - 85, width: 140, height: 20 },

            // === ZONA 7: Escalera descendente (x: 5300-6100) ===
            { x: 5350, y: groundY - 140, width: 100, height: 20 },
            { x: 5550, y: groundY - 110, width: 120, height: 20 },
            { x: 5780, y: groundY - 75, width: 150, height: 20 },
            { x: 5450, y: groundY - 210, width: 85, height: 20 },
            { x: 6050, y: groundY - 95, width: 110, height: 20 },

            // === ZONA 8: Puente con hueco (x: 6200-7000) ===
            { x: 6250, y: groundY - 90, width: 160, height: 20 },
            { x: 6600, y: groundY - 90, width: 160, height: 20 },
            { x: 6420, y: groundY - 185, width: 100, height: 20 },
            { x: 6900, y: groundY - 120, width: 100, height: 20 },

            // === ZONA 9: Alturas extremas variadas (x: 7100-7900) ===
            { x: 7150, y: groundY - 60, width: 180, height: 20 },
            { x: 7400, y: groundY - 135, width: 90, height: 20 },
            { x: 7600, y: groundY - 70, width: 120, height: 20 },
            { x: 7500, y: groundY - 200, width: 95, height: 20 },
            { x: 7850, y: groundY - 105, width: 130, height: 20 },

            // === ZONA 10: Compactas y cercanas (x: 8000-8700) ===
            { x: 8050, y: groundY - 85, width: 100, height: 20 },
            { x: 8200, y: groundY - 120, width: 100, height: 20 },
            { x: 8350, y: groundY - 80, width: 100, height: 20 },
            { x: 8500, y: groundY - 130, width: 100, height: 20 },
            { x: 8250, y: groundY - 205, width: 90, height: 20 },

            // === ZONA 11: Final del mapa (x: 8800-9700) ===
            { x: 8850, y: groundY - 70, width: 140, height: 20 },
            { x: 9050, y: groundY - 110, width: 110, height: 20 },
            { x: 9250, y: groundY - 140, width: 100, height: 20 },
            { x: 9150, y: groundY - 210, width: 85, height: 20 },
        ];

        floatingPlatforms.forEach(platform => {
            platforms.push({
                ...platform,
                color: this.environment.platformColor
            });
        });

        return platforms;
    }

    generateTrees() {
        const trees = [];
        const numTrees = 40;

        let spawnedTrees = 0;
        let attempts = 0;

        // Intentar colocar árboles solo donde no haya plataformas flotantes
        while (spawnedTrees < numTrees && attempts < 200) {
            attempts++;
            const xPos = 400 + Math.random() * (this.worldWidth - 800);
            const width = 180 + Math.random() * 120; // Ancho entre 180 y 300
            const height = width * 1.0; // Proporción 1:1
            const groundY = this.config.height - 50;

            // Verificar superposición horizontal con plataformas
            let overlaps = false;
            for (const plat of this.platforms) {
                if (!plat.isFloor) {
                    // Rango horizontal con margen de 20px
                    if (xPos + width + 20 > plat.x && xPos - 20 < plat.x + plat.width) {
                        overlaps = true;
                        break;
                    }
                }
            }

            if (!overlaps) {
                trees.push({
                    x: xPos,
                    y: groundY - height + 10,
                    width: width,
                    height: height
                });
                spawnedTrees++;
            }
        }

        // Ordenar por Y para efecto de profundidad básico
        trees.sort((a, b) => a.y - b.y);

        return trees;
    }



    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (this.storyIntroActive) {
                if (e.code === 'Space') {
                    this.storyIntroActive = false;
                    this.levelStartTime = Date.now(); // Reiniciar tiempo al iniciar real
                }
                return;
            }
            this.keys[e.code] = true;

            // Uso de consumibles comprados
            if (e.code === 'KeyH') {
                this.useHealingToken();
            }
            if (e.code === 'KeyB' || e.code === 'KeyV') {
                this.useGoldCrossbow();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    handleInput() {
        if (this.storyIntroActive) return;
        if (this.gameOver) return;

        // Manejar pausa/reanudar (siempre verificar, incluso en pausa)
        if (this.keys['KeyP'] || this.keys['Escape']) {
            this.paused = !this.paused;
            const pauseMenu = document.getElementById('pause-menu');
            if (pauseMenu) {
                if (this.paused) {
                    pauseMenu.classList.remove('hidden');
                } else {
                    pauseMenu.classList.add('hidden');
                }
            }
            this.keys['KeyP'] = false;
            this.keys['Escape'] = false;
            return;
        }

        // Si está en pausa, no permitir otros controles
        if (this.paused) {
            return;
        }

        // Movimiento horizontal (Permite movimiento libre durante ataque para mayor fluidez)
        if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.touchKeys['left']) {
            this.player.velocityX = -this.config.playerSpeed;
            this.player.facing = -1;
        } else if (this.keys['KeyD'] || this.keys['ArrowRight'] || this.touchKeys['right']) {
            this.player.velocityX = this.config.playerSpeed;
            this.player.facing = 1;
        } else {
            // Aplicar menos fricción en el aire para mantener inercia (deslizamiento fluido al saltar)
            if (!this.player.isGrounded) {
                this.player.velocityX *= 0.92; // Inercia en el aire
            } else {
                this.player.velocityX *= 0.8; // Freno normal en el suelo
            }
        }

        // Salto (registra la intención en el buffer para mayor tolerancia de timing)
        if (this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['Space'] || this.touchKeys['jump']) {
            this.jumpBufferCounter = this.jumpBufferMax;
            this.keys['KeyW'] = false;
            this.keys['ArrowUp'] = false;
            this.keys['Space'] = false;
            this.touchKeys['jump'] = false;
        }

        // Ataque
        if (this.keys['KeyF'] || this.touchKeys['attack']) {
            this.playerAttack();
            this.keys['KeyF'] = false;
            this.touchKeys['attack'] = false;
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

        // Solo reiniciar la animación de ataque si no estaba atacando previamente
        // o si ya pasó suficiente tiempo (ej. 400ms) para evitar congelar el frame en disparos consecutivos rápidos
        if (this.animationState !== 'attacking' || (Date.now() - (this.attackAnimationTimer || 0) > 400)) {
            this.animationState = 'attacking';
            this.animationFrame = 0; // Reiniciar frame de ataque
            this.attackAnimationTimer = Date.now(); // Guardar tiempo de inicio de ataque
        }

        const projWidth = this.goldCrossbowActive ? 15 : 10;
        const projectile = {
            x: this.player.facing > 0 ? this.player.x + this.player.width - 5 : this.player.x - projWidth + 5,
            y: this.player.y - 12,
            width: projWidth,
            height: this.goldCrossbowActive ? 7 : 5,
            velocityX: this.player.facing * (this.goldCrossbowActive ? 11 : 8),
            velocityY: 0,
            color: this.goldCrossbowActive ? '#FFD700' : this.player.color,
            isGolden: this.goldCrossbowActive,
            owner: 'player'
        };
        this.projectiles.push(projectile);
    }

    updatePhysics(deltaTime) {
        // Actualizar temporizador de ballesta de oro
        if (this.goldCrossbowActive) {
            this.goldCrossbowTimer -= deltaTime;
            if (this.goldCrossbowTimer <= 0) {
                this.goldCrossbowActive = false;
                this.goldCrossbowTimer = 0;
            }
            if (Math.random() < 0.25) {
                const px = this.player.x + Math.random() * this.player.width;
                const py = this.player.y + Math.random() * this.player.height;
                this.particles.push({
                    x: px,
                    y: py,
                    velocityX: (Math.random() - 0.5) * 2,
                    velocityY: -Math.random() * 2,
                    color: '#FFD700',
                    life: 80
                });
            }
        }

        // Factor de tiempo normalizado a 60fps (16.67ms por frame)
        // Se limita a 50ms para evitar saltos de física en picos de lag
        const dt = Math.min(deltaTime, 50) / 16.67;

        // Actualizar Coyote Time y Jump Buffer
        if (this.player.isGrounded) {
            this.coyoteTimeCounter = this.coyoteTimeMax;
        } else {
            this.coyoteTimeCounter = Math.max(0, this.coyoteTimeCounter - deltaTime);
        }
        this.jumpBufferCounter = Math.max(0, this.jumpBufferCounter - deltaTime);

        // Si hay una intención de salto almacenada y se puede saltar (en suelo o usando Coyote Time)
        if (this.jumpBufferCounter > 0 && (this.player.isGrounded || this.coyoteTimeCounter > 0)) {
            this.player.velocityY = -this.config.jumpPower;
            this.player.isJumping = true;
            this.player.isGrounded = false;
            this.coyoteTimeCounter = 0; // Evitar saltos dobles consecutivos accidentales
            this.jumpBufferCounter = 0; // Consumir el búfer
        }

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

        // --- GESTIÓN DE CÁMARA BLOQUEADA POR JEFE ---
        let targetCameraX = this.player.x - this.config.width / 2;

        if (this.cameraLocked) {
            // Mantener la cámara fija en el punto de bloqueo
            this.camera.x = this.cameraLockX;
            
            // Restringir el movimiento del jugador a la pantalla visible de combate
            if (this.player.x < this.camera.x) {
                this.player.x = this.camera.x;
                this.player.velocityX = 0;
            }
            if (this.player.x + this.player.width > this.camera.x + this.config.width) {
                this.player.x = this.camera.x + this.config.width - this.player.width;
                this.player.velocityX = 0;
            }
        } else {
            // Suavizar movimiento de la cámara
            this.camera.x += (targetCameraX - this.camera.x) * 0.1;

            // Limitar cámara a los bordes del mundo
            if (this.camera.x < 0) this.camera.x = 0;
            if (this.camera.x > this.worldWidth - this.config.width) {
                this.camera.x = this.worldWidth - this.config.width;
            }
        }

        // --- DISPARADOR DE COMBATE DE JEFE FINAL ---
        if (this.player.x >= 9000 && !this.bossActive && !this.bossDefeated) {
            this.bossActive = true;
            this.cameraLocked = true;
            this.cameraLockX = this.camera.x; // Guardar la posición actual de bloqueo
            this.spawnBoss();
        }

        // --- CONDICIÓN DE VICTORIA AL LLEGAR AL CASTILLO ---
        if (this.bossDefeated && this.player.x >= 9700) {
            if (!this.victory) {
                this.victory = true;
                this.paused = true;
                console.log("¡Has alcanzado el Castillo de Pixelia! ¡Victoria!");
            }
        }

        // --- SISTEMA DE CHECKPOINTS (HOGUERAS) ---
        for (const checkpoint of this.checkpoints) {
            if (!checkpoint.active) {
                // Si el jugador pasa por la coordenada X del checkpoint
                if (this.player.x >= checkpoint.x && this.player.x <= checkpoint.x + 100) {
                    checkpoint.active = true;
                    this.lastActiveCheckpoint = { x: checkpoint.x + 50, y: this.player.y };
                    
                    // Curación de gracia (50 HP) al encender la hoguera
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + 50);
                    
                    // Partículas de celebración doradas y verdes
                    this.createParticles(checkpoint.x + 50, this.player.y + 20, '#FFD700');
                    this.createParticles(checkpoint.x + 50, this.player.y + 20, '#32CD32');
                    console.log(`¡Checkpoint activado en x = ${checkpoint.x}!`);
                }
            }
        }

        // Colisión con plataformas
        this.player.isGrounded = false;
        for (const platform of this.platforms) {
            // Usar colisión de aterrizaje más estrecha para evitar "caminar en el aire" en bordes
            if (this.checkCollisionLanding(this.player, platform)) {
                // Calcular posición anterior del jugador en el eje Y para evitar el bug del imán lateral
                const previousBottomY = this.player.y + this.player.height - (this.player.velocityY * dt);
                
                // Solo aterrizar si está cayendo y estaba arriba de la plataforma en el frame anterior
                if (this.player.velocityY >= 0 && previousBottomY <= platform.y + 3) {
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
                    // Restar vida al enemigo
                    const dmg = projectile.isGolden ? 2 : 1;
                    enemy.health -= dmg;

                    // Crear partículas de impacto
                    this.createParticles(projectile.x, projectile.y, projectile.isGolden ? '#FFD700' : '#FF00FF');

                    if (enemy.health <= 0) {
                        if (enemy.isBoss) {
                            this.bossActive = false;
                            this.bossDefeated = true;
                            this.cameraLocked = false;
                            this.boss = null;
                            console.log("¡El Rey Duende ha sido derrotado!");
                            // Gran cantidad de partículas de victoria
                            this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#FFD700');
                            this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#FF0000');
                            this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#FFFF00');
                            
                            // Limpiar todos los demás enemigos sirvientes en el siguiente tick para evitar conflictos de indexación
                            setTimeout(() => {
                                this.enemies = [];
                            }, 0);
                        }
                        this.enemies.splice(i, 1);
                        this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#FF00FF');
                        
                        if (!enemy.isBoss) {
                            this.player.enemiesDefeated++;
                            this.score += 100;
                        } else {
                            this.player.enemiesDefeated++;
                            this.score += 1000; // Puntuación de Jefe
                            this.player.gems += 50; // Oro de Jefe
                            localStorage.setItem('storyGold', this.player.gems);
                        }
                    }
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



        // Lógica Anti-Camping (Deshabilitada al derrotar al jefe)
        if (!this.bossDefeated) {
            const distanceMoved = Math.abs(this.player.x - this.lastPlayerX);
            if (distanceMoved < 2) { // Si se mueve menos de 2px (casi quieto)
                this.playerStillTimer += deltaTime;
                if (this.playerStillTimer >= this.campingThreshold) {
                    this.spawnEnemy(true); // Aparecer por la espalda
                    this.playerStillTimer = 0; // Resetear para el siguiente spawn si sigue quieto
                    console.log('¡Castigo por camping! Enemigo invocado por la espalda.');
                }
            } else {
                this.playerStillTimer = 0;
                this.lastPlayerX = this.player.x;
            }
        } else {
            this.playerStillTimer = 0;
        }



        // Verificar si el jugador sigue vivo
        if (this.player.health <= 0) {
            if (!this.gameOver) {
                this.gameOver = true;
                this.currentDeathPhrase = this.deathPhrases[Math.floor(Math.random() * this.deathPhrases.length)].toUpperCase();

                // Reproducir audio de muerte
                if (this.deathAudio) {
                    this.deathAudio.play().catch(e => console.log('Error reproduciendo audio de muerte:', e));
                }
            }
        }
    }

    updateEnemies(dt) {
        // Spawn de enemigos comunes (solo si el jefe no está activo o ya fue derrotado)
        if (!this.bossActive && !this.bossDefeated) {
            this.enemySpawnTimer += 16.67 * dt;
            if (this.enemySpawnTimer >= this.enemySpawnInterval && this.enemies.length < this.maxEnemies) {
                this.spawnEnemy();
                this.enemySpawnTimer = 0;
            }
        } else if (this.bossActive && this.boss) {
            // El Jefe convoca pequeños sirvientes duendes cada 7 segundos para ayudarlo
            this.enemySpawnTimer += 16.67 * dt;
            if (this.enemySpawnTimer >= 7000 && this.enemies.length < 4) {
                // Aparecen cerca del jefe
                this.spawnEnemy(false);
                this.enemySpawnTimer = 0;
                console.log("¡El Rey Duende ha invocado un sirviente!");
            }
        }

        // Limpiar memoria: despawnear enemigos comunes que se han quedado muy atrás
        // El Jefe nunca debe ser despawneado por distancia
        this.enemies = this.enemies.filter(enemy => enemy.isBoss || enemy.x >= this.camera.x - 800);

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
                // Velocidad escalada según tipo y salud
                let baseEnemySpeed = 1.5;
                if (enemy.isBoss) {
                    // El jefe es un poco más lento en fase normal (1.2), pero entra en furia a mitad de HP (1.8)
                    baseEnemySpeed = enemy.health < enemy.maxHealth / 2 ? 1.8 : 1.2;
                }
                const currentEnemySpeed = baseEnemySpeed;
                const moveX = (dx / distance) * currentEnemySpeed * dt;
                enemy.x += moveX;

                // Detectar si hay una plataforma adelante y saltar si es necesario
                const nextX = enemy.x + moveX * 10;
                const needsJump = this.shouldEnemyJump(enemy, nextX);

                // El jefe salta agresivamente por sí mismo para perseguir
                if (enemy.isBoss && enemy.isGrounded && Math.random() < 0.015) {
                    enemy.velocityY = enemy.health < enemy.maxHealth / 2 ? -this.config.jumpPower * 0.95 : -this.config.jumpPower * 0.85;
                    enemy.isJumping = true;
                    enemy.isGrounded = false;
                } else if (needsJump && enemy.isGrounded && Math.random() > 0.3) {
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

            // Lógica de animación del duende
            enemy.animationTimer += 16.67 * dt;

            // Determinar estado de animación
            const isMoving = Math.abs(dx) > 1;
            const isAttacking = distance < 60; // Distancia para considerar ataque visual

            if (isAttacking) {
                if (enemy.animationState !== 'ataque') {
                    enemy.animationState = 'ataque';
                    enemy.animationFrame = 0;
                    enemy.animationTimer = 0;
                }
            } else if (isMoving) {
                if (enemy.animationState !== 'caminar') {
                    enemy.animationState = 'caminar';
                    enemy.animationFrame = 0;
                    enemy.animationTimer = 0;
                }
                enemy.facing = dx > 0 ? 1 : -1;
            } else {
                if (enemy.animationState !== 'reposo') {
                    enemy.animationState = 'reposo';
                    enemy.animationFrame = 0;
                    enemy.animationTimer = 0;
                }
            }

            // Ciclo de frames
            const animConfig = this.duendeSpriteConfig.animations[enemy.animationState];
            const numFrames = (animConfig.end - animConfig.start) + 1;

            if (enemy.animationTimer >= enemy.animationSpeed) {
                enemy.animationFrame = (enemy.animationFrame + 1) % numFrames;
                enemy.animationTimer = 0;
            }

            // Colisión con jugador (con i-frames para evitar daño continuo)
            if (this.checkCollision(enemy, this.player)) {
                const now = Date.now();
                if (now - this.player.lastDamageTime > this.player.invincibilityDuration) {
                    let damageReduction = 0;
                    let useArmor = false;

                    if (this.armorLevel > 0 && this.armorDurability > 0) {
                        useArmor = true;
                        if (this.armorLevel === 1) damageReduction = 0.10;
                        else if (this.armorLevel === 2) damageReduction = 0.25;
                        else if (this.armorLevel === 3) damageReduction = 0.40;
                        
                        this.armorDurability--;
                    }

                    const scaledDamage = 10 * (1 - damageReduction);
                    this.player.health -= scaledDamage;
                    this.player.lastDamageTime = now;
                    this.animationState = 'hurt';
                    this.animationFrame = 0;
                    this.animationTimer = 0;

                    if (useArmor) {
                        // Partículas de metal (armadura)
                        this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#A9A9A9');
                        this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#FF0000');
                        
                        if (this.armorDurability === 0) {
                            // Efecto visual de armadura rota: muchas partículas de metal
                            for (let p = 0; p < 2; p++) {
                                this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#A9A9A9');
                            }
                            console.log("¡Armadura destruida!");
                        }
                    } else {
                        this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#FF0000');
                    }
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
            // Centro del cuerpo del personaje para recogida (aprox mitad de la altura visual del sprite)
            const playerVisualCenterY = this.player.y + this.player.height - 76;
            const gemCenterX = gem.x + gem.width / 2;
            const gemCenterY = gem.y + gem.height / 2;

            const dx = playerVisualCenterX - gemCenterX;
            const dy = playerVisualCenterY - gemCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Radio de recogida que coincide con el cuerpo visible del personaje (~50px)
            const pickupDistance = 50;
            if (distance < pickupDistance) {
                this.player.gems += 5;
                localStorage.setItem('storyGold', this.player.gems);
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

    spawnEnemy(behindPlayer = false) {
        // Spawn enemigos dentro del área visible de la cámara
        let spawnX;
        if (behindPlayer) {
            // Aparecer a unos 300px detrás del jugador (lado opuesto a donde mira)
            spawnX = this.player.x - (this.player.facing * 300);
            // Asegurarse de que el spawn esté dentro de los límites del mundo
            spawnX = Math.max(50, Math.min(this.worldWidth - 50, spawnX));
        } else {
            spawnX = this.camera.x + this.config.width - 100; // Borde derecho visible estándar
        }

        const groundY = this.config.height - 50; // Superficie del piso marrón

        const enemy = {
            x: spawnX,
            y: groundY,
            width: 40,  // Ajustado al tamaño del personaje (40)
            height: 110, // Ajustado al tamaño del personaje y pecho visual (110)
            velocityX: 0,
            velocityY: 0,
            color: '#9400D3',
            maxHealth: 3,
            health: 3,
            isGrounded: true,
            isJumping: false,
            // Propiedades de animación del duende
            animationState: 'reposo',
            animationFrame: 0,
            animationTimer: 0,
            animationSpeed: 150, // ms entre frames
            facing: -1 // -1 para izquierda, 1 para derecha
        };

        // Salud fija para modo historia
        enemy.maxHealth = 3;
        enemy.health = enemy.maxHealth;

        // Ajustar para que la base del sprite toque el piso
        enemy.y = groundY - enemy.height;
        enemy.velocityY = 0;

        this.enemies.push(enemy);
    }

    spawnBoss() {
        const groundY = this.config.height - 50;
        
        // El jefe aparece por la derecha del bloque de cámara
        const spawnX = this.camera.x + this.config.width - 150;
        
        this.boss = {
            x: spawnX,
            y: groundY,
            width: 180, // Duende gigante (1.8x de 100)
            height: 270, // 1.8x de 150
            velocityX: 0,
            velocityY: 0,
            color: '#8B0000', // Rojo oscuro
            maxHealth: 20, // 20 HP
            health: 20,
            isGrounded: true,
            isJumping: false,
            // Animación del duende jefe
            animationState: 'reposo',
            animationFrame: 0,
            animationTimer: 0,
            animationSpeed: 100, // un poco más rápido
            facing: -1,
            isBoss: true
        };
        
        // Ajustar para tocar el suelo
        this.boss.y = groundY - this.boss.height;
        this.boss.velocityY = 0;
        
        this.enemies.push(this.boss);
        console.log("¡El Rey Duende ha aparecido!");
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

    checkCollisionLanding(player, platform) {
        // Reducir el ancho del jugador por 8px en cada lado para evitar el pixel-walk (quedar flotando en bordes)
        const feetInset = 8;
        return player.x + feetInset < platform.x + platform.width &&
            player.x + player.width - feetInset > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height >= platform.y;
    }

    updateAnimations(deltaTime) {
        this.animationTimer += deltaTime;

        let currentAnimationSpeed = this.animationSpeed;

        // Guarda el estado anterior para detectar cambios de animación
        const previousState = this.animationState;

        // 1. Prioridad: Daño (Hurt)
        if (this.animationState === 'hurt') {
            currentAnimationSpeed = 100; // Velocidad del daño
            const animConfig = this.spriteConfig.animations.hurt;
            const maxFrames = (animConfig.end - animConfig.start) + 1;

            if (this.animationTimer >= currentAnimationSpeed) {
                this.animationTimer = 0;
                if (this.animationFrame >= maxFrames - 1) {
                    this.animationState = 'idle';
                    this.animationFrame = 0;
                } else {
                    this.animationFrame++;
                }
            }

            if (previousState !== this.animationState) {
                this.animationFrame = 0;
                this.animationTimer = 0;
            }
            return;
        }

        // 1.5. Prioridad: Ataque (Reproduce la animación exactamente una vez, de forma no cíclica)
        if (this.animationState === 'attacking') {
            currentAnimationSpeed = 65; // Animación de ataque más ágil (65ms por frame)
            const animConfig = this.spriteConfig.animations.attacking;
            const maxFrames = (animConfig.end - animConfig.start) + 1;

            if (this.animationTimer >= currentAnimationSpeed) {
                this.animationTimer = 0;
                // Si ya se alcanzó el último frame de la animación (sprite 43)
                if (this.animationFrame >= maxFrames - 1) {
                    this.animationState = 'idle';
                    this.animationFrame = 0;
                } else {
                    this.animationFrame++;
                }
            }

            if (previousState !== this.animationState) {
                this.animationFrame = 0;
                this.animationTimer = 0;
            }
            return;
        }

        // 2. Prioridad: Salto
        if (this.animationState !== 'attacking' && this.animationState !== 'hurt') {
            if (!this.player.isGrounded) {
                this.animationState = 'jumping';
                currentAnimationSpeed = 80; // Salto más fluido (80ms por frame)
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
        const currentBg = this.bgImages[this.timeOfDay];
        const activeBg = (currentBg && currentBg.complete) ? currentBg : (this.castleGif && this.castleGif.complete ? this.castleGif : null);

        if (activeBg) {
            // Ocultar video si existe
            if (this.castleVideo) {
                this.castleVideo.style.display = 'none';
            }

            // Limpiar canvas con color del cielo
            this.ctx.fillStyle = environment.skyColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Escalar la imagen para que cubra todo el alto de la pantalla, evitando el hueco azul arriba
            const bgHeight = this.canvas.height;
            const bgScale = bgHeight / activeBg.height;
            const bgWidth = activeBg.width * bgScale;
            const bgY = 0; // Pegado al techo

            // Dibujar múltiples capas de paralaje para mayor profundidad
            for (const layer of this.parallaxLayers) {
                const cameraOffset = this.camera.x * layer.speed;
                const repetitions = Math.ceil((this.canvas.width + bgWidth) / bgWidth) + 1;

                this.ctx.globalAlpha = layer.alpha;

                // Dibujar múltiples copias para crear efecto infinito
                for (let i = 0; i < repetitions; i++) {
                    const bgX = (i * bgWidth) - (cameraOffset % bgWidth);
                    this.ctx.drawImage(activeBg, bgX, bgY, bgWidth, bgHeight);
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

        // --- DIBUJAR CHECKPOINTS (HOGUERAS) ---
        for (const checkpoint of this.checkpoints) {
            const groundY = this.canvas.height - 50;
            const bonfireX = checkpoint.x + 50;
            const bonfireY = groundY - 40;
            
            // Dibujar troncos (madera oscura)
            this.ctx.fillStyle = '#4A2711';
            this.ctx.fillRect(bonfireX - 20, bonfireY + 25, 40, 10);
            this.ctx.fillStyle = '#5A3721';
            this.ctx.fillRect(bonfireX - 15, bonfireY + 18, 30, 8);
            
            if (checkpoint.active) {
                // Dibujar fuego activo animado
                const time = Date.now() / 150;
                
                // Capa exterior roja
                this.ctx.fillStyle = '#FF4500';
                this.ctx.beginPath();
                this.ctx.moveTo(bonfireX - 15, bonfireY + 20);
                this.ctx.quadraticCurveTo(bonfireX, bonfireY - 12 + Math.sin(time) * 10, bonfireX + 15, bonfireY + 20);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Capa media naranja
                this.ctx.fillStyle = '#FF8C00';
                this.ctx.beginPath();
                this.ctx.moveTo(bonfireX - 10, bonfireY + 20);
                this.ctx.quadraticCurveTo(bonfireX, bonfireY - 2 + Math.cos(time) * 8, bonfireX + 10, bonfireY + 20);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Capa interior amarilla
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.moveTo(bonfireX - 5, bonfireY + 20);
                this.ctx.quadraticCurveTo(bonfireX, bonfireY + 5 + Math.sin(time * 1.5) * 5, bonfireX + 5, bonfireY + 20);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Resplandor del fuego
                this.ctx.save();
                this.ctx.globalAlpha = 0.12;
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(bonfireX, bonfireY + 15, 40 + Math.sin(time) * 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else {
                // Hoguera inactiva - troncos secos y algo de ceniza gris
                this.ctx.fillStyle = '#2F4F4F';
                this.ctx.fillRect(bonfireX - 5, bonfireY + 12, 10, 6);
                
                // Pequeño humo flotante
                const time = Date.now() / 300;
                this.ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
                this.ctx.beginPath();
                this.ctx.arc(bonfireX + Math.sin(time) * 2, bonfireY + 5 - (time % 20), 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Dibujar el texto arriba de la hoguera
            this.ctx.fillStyle = checkpoint.active ? '#FFD700' : '#888888';
            this.ctx.font = 'bold 10px Georgia, serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(checkpoint.active ? "🔥 HOGUERA ACTIVA 🔥" : "🪵 HOGUERA DEL DESTINO", bonfireX, bonfireY - 15);
        }

        // --- DIBUJAR EL GRAN CASTILLO AL FINAL ---
        const castleX = 9600;
        const groundY = this.canvas.height - 50;
        
        // Estructuras de la fortaleza medieval
        const drawStoneStructure = (x, y, w, h) => {
            // Base del muro en piedra gris
            this.ctx.fillStyle = '#5A5A5A';
            this.ctx.fillRect(x, y, w, h);
            
            // Sombreado inferior de bloques
            this.ctx.fillStyle = '#3F3F3F';
            this.ctx.fillRect(x, y + h - 5, w, 5);

            // Bordes y juntas de piedra
            this.ctx.strokeStyle = '#2B2B2B';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, w, h);

            // Líneas de bloques de ladrillo horizontales
            const brickH = 15;
            this.ctx.strokeStyle = '#383838';
            this.ctx.lineWidth = 1;
            for (let by = y + brickH; by < y + h; by += brickH) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, by);
                this.ctx.lineTo(x + w, by);
                this.ctx.stroke();
            }

            // Juntas verticales de ladrillo (escalonadas)
            const brickW = 30;
            let row = 0;
            for (let by = y; by < y + h; by += brickH) {
                const shift = (row % 2) * (brickW / 2);
                for (let bx = x + shift; bx < x + w; bx += brickW) {
                    if (bx > x && bx < x + w) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(bx, by);
                        this.ctx.lineTo(bx, by + brickH);
                        this.ctx.stroke();
                    }
                }
                row++;
            }
        };

        const drawBattlements = (x, y, w) => {
            this.ctx.fillStyle = '#5A5A5A';
            const size = 15;
            for (let bx = x; bx < x + w; bx += size * 2) {
                this.ctx.fillRect(bx, y - size, size, size);
                this.ctx.strokeStyle = '#2B2B2B';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(bx, y - size, size, size);
            }
        };

        const drawTowerRoof = (x, y, w) => {
            // Tejado cónico carmesí
            this.ctx.fillStyle = '#B22222';
            this.ctx.beginPath();
            this.ctx.moveTo(x - 5, y);
            this.ctx.lineTo(x + w / 2, y - 50);
            this.ctx.lineTo(x + w + 5, y);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.strokeStyle = '#5E1928';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Astil de bandera
            this.ctx.strokeStyle = '#D4AF37';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x + w / 2, y - 50);
            this.ctx.lineTo(x + w / 2, y - 70);
            this.ctx.stroke();

            // Bandera dorada flameando
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.moveTo(x + w / 2, y - 70);
            this.ctx.lineTo(x + w / 2 + 18, y - 65);
            this.ctx.lineTo(x + w / 2, y - 60);
            this.ctx.closePath();
            this.ctx.fill();
        };

        // Dibujar base del castillo
        this.ctx.fillStyle = '#2B2B2B';
        this.ctx.fillRect(castleX - 60, groundY - 10, 480, 10);

        // Muros exteriores (izq y der de la puerta)
        drawStoneStructure(castleX + 60, groundY - 180, 240, 180);
        drawBattlements(castleX + 60, groundY - 180, 240);

        // Torre izquierda
        drawStoneStructure(castleX, groundY - 260, 60, 260);
        drawBattlements(castleX, groundY - 260, 60);
        drawTowerRoof(castleX, groundY - 260, 60);

        // Torre derecha
        drawStoneStructure(castleX + 300, groundY - 260, 60, 260);
        drawBattlements(castleX + 300, groundY - 260, 60);
        drawTowerRoof(castleX + 300, groundY - 260, 60);

        // --- LA GRAN PUERTA CENTRAL ---
        const gateX = castleX + 130;
        const gateY = groundY - 120;
        const gateW = 100;
        const gateH = 120;

        // Fondo oscuro del arco
        this.ctx.fillStyle = '#111111';
        this.ctx.fillRect(gateX, gateY, gateW, gateH);

        // Relleno de la puerta según estado
        if (!this.bossDefeated) {
            // Puerta de madera pesada
            this.ctx.fillStyle = '#5C4033'; // Marrón madera oscura
            this.ctx.fillRect(gateX + 4, gateY + 4, gateW - 8, gateH - 4);

            // Tablones verticales
            this.ctx.strokeStyle = '#3E2A1C';
            this.ctx.lineWidth = 2;
            for (let tx = gateX + 15; tx < gateX + gateW - 5; tx += 15) {
                this.ctx.beginPath();
                this.ctx.moveTo(tx, gateY + 4);
                this.ctx.lineTo(tx, gateY + gateH);
                this.ctx.stroke();
            }

            // Rejas de hierro oscuras (portcullis)
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 4;
            // Barras verticales
            for (let bx = gateX + 10; bx < gateX + gateW; bx += 20) {
                this.ctx.beginPath();
                this.ctx.moveTo(bx, gateY);
                this.ctx.lineTo(bx, gateY + gateH);
                this.ctx.stroke();
            }
            // Barras horizontales
            for (let by = gateY + 20; by < gateY + gateH; by += 25) {
                this.ctx.beginPath();
                this.ctx.moveTo(gateX, by);
                this.ctx.lineTo(gateX + gateW, by);
                this.ctx.stroke();
            }
        } else {
            // ¡Castillo abierto! Renderizar luz dorada mística espectacular
            const time = Date.now() / 150;
            const alpha = 0.25 + Math.sin(time) * 0.1;

            const grad = this.ctx.createLinearGradient(0, gateY, 0, gateY + gateH);
            grad.addColorStop(0, 'rgba(255, 223, 0, 0.9)');
            grad.addColorStop(0.5, `rgba(255, 140, 0, ${alpha * 0.8})`);
            grad.addColorStop(1, 'rgba(255, 69, 0, 0.1)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(gateX + 4, gateY + 4, gateW - 8, gateH - 4);

            // Resplandor de rayos dorados sobre el suelo
            this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.4})`;
            this.ctx.beginPath();
            this.ctx.moveTo(gateX + 10, gateY + gateH);
            this.ctx.lineTo(gateX + gateW - 10, gateY + gateH);
            this.ctx.lineTo(gateX + gateW + 60, gateY + gateH + 50);
            this.ctx.lineTo(gateX - 60, gateY + gateH + 50);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // Borde de piedra del arco de la puerta
        this.ctx.strokeStyle = '#3A3A3A';
        this.ctx.lineWidth = 6;
        this.ctx.strokeRect(gateX, gateY, gateW, gateH);

        // Texto informativo medieval arriba de la puerta
        this.ctx.fillStyle = this.bossDefeated ? '#FFD700' : '#C0C0C0';
        this.ctx.font = 'bold 13px Georgia, serif';
        this.ctx.textAlign = 'center';
        
        // Sombra de texto
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText(this.bossDefeated ? "🏰 ¡ENTRA AL CASTILLO!" : "🔒 CASTILLO BLOQUEADO", castleX + 180 + 1, gateY - 20 + 1);
        this.ctx.fillStyle = this.bossDefeated ? '#FFD700' : '#A9A9A9';
        this.ctx.fillText(this.bossDefeated ? "🏰 ¡ENTRA AL CASTILLO!" : "🔒 CASTILLO BLOQUEADO", castleX + 180, gateY - 20);



        // Dibujar árboles en el fondo (detrás de las plataformas y el jugador)
        if (this.treeImageLoaded && this.treeImage.complete) {
            for (const tree of this.trees) {
                this.ctx.drawImage(this.treeImage, tree.x, tree.y, tree.width, tree.height);
            }
        }

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
                const offsetY = 27;

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
                // Si es el jefe final, lo escalamos a 1.35x de su gran hitbox.
                // Si es un duende común, lo escalamos a 100x150 para acoplarlo al tamaño visual del personaje.
                const duendeWidth = enemy.isBoss ? enemy.width * 1.35 : 100;
                const duendeHeight = enemy.isBoss ? enemy.height * 1.35 : 150;

                // Determinar si el enemigo debe voltear
                // Según la imagen, parece que el duende mira a la derecha por defecto.
                // Lo volteamos si necesita mirar a la izquierda (facing === -1)
                const enemyFacingLeft = enemy.facing === -1;

                const enemyCenterX = enemy.x + enemy.width / 2;

                this.ctx.save();

                // Centrar horizontalmente sobre el hitbox
                const drawX = enemyCenterX - duendeWidth / 2;
                
                // Desplazar el sprite hacia abajo para que los pies toquen el suelo y no flote
                // debido al espacio transparente en la parte inferior del frame del sprite sheet.
                const offsetY = duendeHeight * 0.08; // Ajusta este valor para subir o bajar el sprite según sea necesario
                const drawY = (enemy.y + enemy.height) - duendeHeight + offsetY;

                if (enemyFacingLeft) {
                    // Voltear horizontalmente para mirar a la izquierda usando el centro del enemigo
                    this.ctx.translate(enemyCenterX, 0);
                    this.ctx.scale(-1, 1);
                    this.ctx.translate(-enemyCenterX, 0);
                }

                // Configuración de animación actual
                const anim = this.duendeSpriteConfig.animations[enemy.animationState];
                const frameIndex = anim.start + enemy.animationFrame;

                const col = frameIndex % this.duendeSpriteConfig.framesPerRow;
                const row = Math.floor(frameIndex / this.duendeSpriteConfig.framesPerRow);

                const sx = col * this.duendeSpriteConfig.frameWidth;
                const sy = row * this.duendeSpriteConfig.frameHeight;

                this.ctx.drawImage(
                    this.duendeImage,
                    sx, sy, this.duendeSpriteConfig.frameWidth, this.duendeSpriteConfig.frameHeight,
                    drawX, drawY, duendeWidth, duendeHeight
                );

                // --- BARRA DE VIDA MEDIEVAL PARA ENEMIGO ---
                // Ocultar barra pequeña sobre el jefe final porque ya tiene la gran barra de vida HUD en pantalla
                if (!enemy.isBoss) {
                    const hpBarWidth = 60;
                    const hpBarHeight = 8;
                    const hpBarX = enemyCenterX - hpBarWidth / 2;
                    const hpBarY = drawY - 12; // Posicionar siempre un poco por encima del sprite visible en lugar del hitbox

                    // 1. Marco de hierro/madera oscura
                    this.ctx.fillStyle = '#1a1105';
                    this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

                    // 2. Fondo de la barra (Rojo muy oscuro/sangre seca)
                    this.ctx.fillStyle = '#2a0505';
                    this.ctx.fillRect(hpBarX + 1, hpBarY + 1, hpBarWidth - 2, hpBarHeight - 2);

                    // 3. Relleno de vida (Sangre fresca)
                    const hpPercentage = enemy.health / enemy.maxHealth;
                    const fillWidth = (hpBarWidth - 2) * Math.max(0, hpPercentage);

                    if (fillWidth > 0) {
                        const grad = this.ctx.createLinearGradient(hpBarX, hpBarY, hpBarX, hpBarY + hpBarHeight);
                        grad.addColorStop(0, '#ff4d4d');
                        grad.addColorStop(0.5, '#cc0000');
                        grad.addColorStop(1, '#8b0000');
                        this.ctx.fillStyle = grad;
                        this.ctx.fillRect(hpBarX + 1, hpBarY + 1, fillWidth, hpBarHeight - 2);

                        // Reflejo/brillo metálico
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                        this.ctx.fillRect(hpBarX + 1, hpBarY + 1, fillWidth, (hpBarHeight - 2) / 2);
                    }
                }

                this.ctx.restore();
            } else {
                // Fallback - dibujar rectángulo simple con posición corregida
                this.ctx.fillStyle = enemy.color;
                const enemyCenterX = enemy.x + enemy.width / 2;
                this.ctx.fillRect(
                    enemyCenterX - enemy.width / 2, // Centrar horizontalmente
                    enemy.y,                   // Posición Y es la base del sprite
                    enemy.width,
                    enemy.height
                );
            }
        }



        // Dibujar proyectiles con Espada de Fe (horizontal)
        for (const projectile of this.projectiles) {
            if (projectile.isGolden) {
                // Dibujar un resplandor dorado alrededor del proyectil
                this.drawColoredGlow(this.ctx, projectile.x + projectile.width / 2, projectile.y + projectile.height / 2, 25, 'rgba(255, 215, 0, 0.6)');
            }
            if (this.swordImageLoaded) {
                // Dibujar Espada de Fe como proyectil horizontal
                const swordWidth = 30;
                const swordHeight = 20;

                this.ctx.save();
                this.ctx.translate(projectile.x + projectile.width / 2, projectile.y + projectile.height / 2);

                // Rotar según la dirección del disparo
                if (projectile.velocityX > 0) {
                    // Disparo hacia la derecha
                    this.ctx.rotate(0);
                } else {
                    // Disparo hacia la izquierda (rotar 180°)
                    this.ctx.rotate(Math.PI);
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
            // Ajustado a + 7 (el punto medio exacto) para que pise perfectamente sobre el pasto (tanto en el piso como en plataformas) sin hundirse ni flotar
            const offsetY = (this.player.y + this.player.height) - scaledHeight + 7;

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

        // --- ILUMINACIÓN DINÁMICA ---
        if (this.timeOfDay === 'sunset' || this.timeOfDay === 'night') {
            if (!this.lightingCanvas) {
                this.lightingCanvas = document.createElement('canvas');
                this.lightingCtx = this.lightingCanvas.getContext('2d');
            }
            if (this.lightingCanvas.width !== this.canvas.width || this.lightingCanvas.height !== this.canvas.height) {
                this.lightingCanvas.width = this.canvas.width;
                this.lightingCanvas.height = this.canvas.height;
            }

            const lCtx = this.lightingCtx;
            lCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Color ambiente según la hora del día
            if (this.timeOfDay === 'sunset') {
                // Atardecer: tono naranja semi-transparente
                lCtx.fillStyle = 'rgba(230, 90, 20, 0.3)';
            } else {
                // Noche: tono azul oscuro intenso
                lCtx.fillStyle = 'rgba(8, 12, 28, 0.82)';
            }
            lCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Carvar agujeros de luz usando Composite Operation 'destination-out'
            lCtx.globalCompositeOperation = 'destination-out';

            // Parámetros de luz según la hora del día
            const pRadius = this.timeOfDay === 'sunset' ? 240 : 160;
            const pIntensity = 1.0;

            // Luz del jugador
            const pScreenX = this.player.x - this.camera.x + this.player.width / 2;
            const pScreenY = this.player.y - this.camera.y + this.player.height / 2;
            this.drawLightCircle(lCtx, pScreenX, pScreenY, pRadius, pIntensity);

            // Luz de checkpoints (hogueras)
            for (const cp of this.checkpoints) {
                const cpScreenX = cp.x - this.camera.x + 50;
                // Alinear con la base de la hoguera
                const cpScreenY = (this.canvas.height - 50) - 20 - this.camera.y;
                const cpRadius = cp.active ? (this.timeOfDay === 'sunset' ? 300 : 220) : (this.timeOfDay === 'sunset' ? 150 : 100);
                const cpIntensity = cp.active ? 1.0 : 0.6;
                this.drawLightCircle(lCtx, cpScreenX, cpScreenY, cpRadius, cpIntensity);
            }

            // Luz de proyectiles
            for (const proj of this.projectiles) {
                const prScreenX = proj.x - this.camera.x + proj.width / 2;
                const prScreenY = proj.y - this.camera.y + proj.height / 2;
                this.drawLightCircle(lCtx, prScreenX, prScreenY, 90, 0.8);
            }

            // Luz de gemas
            for (const gem of this.gems) {
                const gemScreenX = gem.x - this.camera.x + gem.width / 2;
                const gemScreenY = gem.y - this.camera.y + gem.height / 2;
                this.drawLightCircle(lCtx, gemScreenX, gemScreenY, 70, 0.7);
            }

            // Luz de partículas doradas o mágicas
            for (const part of this.particles) {
                if (part.color === '#FFD700' || part.color === '#FFFF00' || part.color === '#FF00FF') {
                    const ptScreenX = part.x - this.camera.x;
                    const ptScreenY = part.y - this.camera.y;
                    this.drawLightCircle(lCtx, ptScreenX, ptScreenY, 30, 0.4 * (part.life / 100));
                }
            }

            // Resetear composite
            lCtx.globalCompositeOperation = 'source-over';

            // Dibujar capa sobre el canvas principal
            this.ctx.drawImage(this.lightingCanvas, 0, 0);

            // Añadir resplandor de colores (Modo Screen para efectos mágicos brillantes)
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'screen';

            // Resplandor cálido naranja/rojo en las hogueras
            for (const cp of this.checkpoints) {
                const cpScreenX = cp.x - this.camera.x + 50;
                const cpScreenY = (this.canvas.height - 50) - 20 - this.camera.y;
                const cpRadius = cp.active ? 200 : 90;
                const color = cp.active ? 'rgba(255, 120, 20, 0.35)' : 'rgba(255, 100, 20, 0.2)';
                this.drawColoredGlow(this.ctx, cpScreenX, cpScreenY, cpRadius, color);
            }

            // Resplandor dorado suave en el jugador
            this.drawColoredGlow(this.ctx, pScreenX, pScreenY, pRadius * 0.8, 'rgba(255, 215, 0, 0.15)');

            // Resplandor mágico en proyectiles (magenta)
            for (const proj of this.projectiles) {
                const prScreenX = proj.x - this.camera.x + proj.width / 2;
                const prScreenY = proj.y - this.camera.y + proj.height / 2;
                this.drawColoredGlow(this.ctx, prScreenX, prScreenY, 70, 'rgba(255, 0, 255, 0.22)');
            }

            // Resplandor en las gemas (oro o turquesa)
            for (const gem of this.gems) {
                const gemScreenX = gem.x - this.camera.x + gem.width / 2;
                const gemScreenY = gem.y - this.camera.y + gem.height / 2;
                this.drawColoredGlow(this.ctx, gemScreenX, gemScreenY, 50, 'rgba(255, 215, 0, 0.2)');
            }

            this.ctx.restore();
        }

        // UI de pausa (Fondo oscuro, los botones ahora son HTML)
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Pantallas de fin de juego
        if (this.gameOver) {
            this.drawMedievalGameOver();
        } else if (this.victory) {
            this.drawVictoryScreen();
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

            // --- HUD DE MEJORAS COMPRADAS ---
            // Tokens de curación (H)
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillText(`💚 Cura (H): ${this.healingTokensOwned}`, barX + 1, barY + height + 51);
            this.ctx.fillStyle = '#32CD32'; // Verde
            this.ctx.fillText(`💚 Cura (H): ${this.healingTokensOwned}`, barX, barY + height + 50);

            // Ballestas de oro (B)
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillText(`🏹 Ballesta (B): ${this.goldCrossbowsOwned}`, barX + 1, barY + height + 71);
            this.ctx.fillStyle = '#FFE5C2';
            this.ctx.fillText(`🏹 Ballesta (B): ${this.goldCrossbowsOwned}`, barX, barY + height + 70);

            // Armadura
            let armorText = "";
            let armorColor = "#888888";
            if (this.armorLevel > 0) {
                if (this.armorDurability > 0) {
                    armorText = `🛡️ Armadura Lvl ${this.armorLevel}: ${this.armorDurability}/3`;
                    armorColor = "#C0C0C0"; // Plateado
                } else {
                    armorText = `🛡️ Armadura Lvl ${this.armorLevel}: ROTA 💥`;
                    armorColor = "#ff4d4d"; // Rojo
                }
            } else {
                armorText = `🛡️ Armadura: Ninguna`;
            }
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillText(armorText, barX + 1, barY + height + 91);
            this.ctx.fillStyle = armorColor;
            this.ctx.fillText(armorText, barX, barY + height + 90);

            // Indicador de ballesta de oro activa
            if (this.goldCrossbowActive) {
                const pulse = Math.abs(Math.sin(Date.now() / 200));
                const secondsLeft = (this.goldCrossbowTimer / 1000).toFixed(1);
                const activeText = `⚡ BALLESTA ACTIVA: ${secondsLeft}s`;
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillText(activeText, barX + 1, barY + height + 111);
                this.ctx.fillStyle = `rgba(255, 215, 0, ${0.6 + pulse * 0.4})`; // Dorado parpadeante/palpitante
                this.ctx.fillText(activeText, barX, barY + height + 110);
            }

            this.ctx.restore();

            // --- HUD: BARRA DE PROGRESO DEL VIAJE ---
            if (!this.victory && !this.storyIntroActive) {
                const progressX = this.canvas.width - 270;
                const progressY = 20;
                const progressW = 220;
                const progressH = 8;
                
                // Borde exterior (hierro forjado)
                this.ctx.fillStyle = '#1a1105';
                this.ctx.fillRect(progressX, progressY, progressW, progressH);
                
                // Fondo de la barra (oro viejo apagado)
                this.ctx.fillStyle = '#3a270f';
                this.ctx.fillRect(progressX + 1, progressY + 1, progressW - 2, progressH - 2);
                
                // Calcular porcentaje de progreso
                const startX = 200;
                const endX = 9500;
                const progressPercentage = Math.max(0, Math.min(1, (this.player.x - startX) / (endX - startX)));
                const fillWidth = (progressW - 2) * progressPercentage;
                
                if (fillWidth > 0) {
                    const progressGrad = this.ctx.createLinearGradient(progressX, progressY, progressX + progressW, progressY);
                    progressGrad.addColorStop(0, '#B8860B'); // Bronce
                    progressGrad.addColorStop(1, '#FFD700'); // Oro
                    this.ctx.fillStyle = progressGrad;
                    this.ctx.fillRect(progressX + 1, progressY + 1, fillWidth, progressH - 2);
                }
                
                // Pequeño indicador de Caballero
                const knightPos = progressX + 1 + (progressW - 2) * progressPercentage;
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.arc(knightPos, progressY + progressH / 2, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(knightPos, progressY + progressH / 2, 4, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Dibujar castillo emoji al final
                this.ctx.fillStyle = this.bossDefeated ? '#FFD700' : '#888888';
                this.ctx.font = '12px serif';
                this.ctx.textAlign = 'left';
                this.ctx.fillText("🏰", progressX + progressW + 5, progressY + 8);
                
                // Texto superior
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 9px Georgia, serif';
                this.ctx.textAlign = 'right';
                this.ctx.fillText("CAMINO AL CASTILLO", progressX + progressW, progressY - 5);
            }
        }

        // --- HUD: BARRA DE VIDA GIGANTE DEL JEFE ---
        if (this.bossActive && this.boss && !this.gameOver && !this.victory) {
            const bossW = Math.min(this.canvas.width * 0.7, 500);
            const bossH = 20;
            const bossX = this.canvas.width / 2 - bossW / 2;
            const bossY = this.canvas.height - 85;
            
            // 1. Marco de hierro forjado
            this.ctx.fillStyle = '#1a1105';
            this.ctx.fillRect(bossX - 4, bossY - 4, bossW + 8, bossH + 8);
            
            // 2. Borde decorativo dorado
            this.ctx.fillStyle = '#DAA520';
            this.ctx.fillRect(bossX - 2, bossY - 2, bossW + 4, bossH + 4);
            
            // 3. Fondo vacío (sangre seca)
            this.ctx.fillStyle = '#2a0505';
            this.ctx.fillRect(bossX, bossY, bossW, bossH);
            
            // 4. Relleno de vida (sangre fresca)
            const bossHpPercentage = Math.max(0, this.boss.health / this.boss.maxHealth);
            const bossFillW = bossW * bossHpPercentage;
            
            if (bossFillW > 0) {
                const bossGrad = this.ctx.createLinearGradient(0, bossY, 0, bossY + bossH);
                bossGrad.addColorStop(0, '#ff1a1a');
                bossGrad.addColorStop(0.5, '#990000');
                bossGrad.addColorStop(1, '#4a0000');
                
                // Si está en modo furia, destellar la barra
                if (this.boss.health < this.boss.maxHealth / 2) {
                    const time = Date.now() / 100;
                    if (Math.floor(time) % 2 === 0) {
                        bossGrad.addColorStop(0.3, '#ff6666');
                    }
                }
                
                this.ctx.fillStyle = bossGrad;
                this.ctx.fillRect(bossX, bossY, bossFillW, bossH);
                
                // Brillo superior
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                this.ctx.fillRect(bossX, bossY, bossFillW, bossH / 3);
            }
            
            // 5. Texto de Jefe
            this.ctx.fillStyle = '#FFE5C2';
            this.ctx.font = 'bold 12px Georgia, serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const bossTitle = this.boss.health < this.boss.maxHealth / 2 ? "👿 EL REY DUENDE (FURIA SE DESATÓ) 👿" : "👿 EL REY DUENDE - SEÑOR DE LAS SOMBRAS 👿";
            
            // Sombra
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillText(bossTitle, this.canvas.width / 2 + 1, bossY + bossH / 2 + 1);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(bossTitle, this.canvas.width / 2, bossY + bossH / 2);
        }

        // --- HUD: PANTALLA DE INTRODUCCIÓN NARRATIVA (LORE) ---
        if (this.storyIntroActive && !this.gameOver) {
            const introW = Math.min(this.canvas.width * 0.7, 600);
            const introH = 360;
            const introX = this.canvas.width / 2 - introW / 2;
            const introY = this.canvas.height / 2 - introH / 2;
            
            // Oscurecer fondo detrás del pergamino
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Dibujar pergamino medieval
            this.ctx.fillStyle = '#1A1005'; // Marco oscuro
            this.roundRect(introX - 6, introY - 6, introW + 12, introH + 12, 10);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#B8860B'; // Borde dorado
            this.roundRect(introX - 3, introY - 3, introW + 6, introH + 6, 8);
            this.ctx.fill();
            
            // Fondo color pergamino
            const scrollGrad = this.ctx.createLinearGradient(introX, introY, introX, introY + introH);
            scrollGrad.addColorStop(0, '#FFE8D1');
            scrollGrad.addColorStop(0.5, '#F5D3B3');
            scrollGrad.addColorStop(1, '#E6BE9C');
            this.ctx.fillStyle = scrollGrad;
            this.roundRect(introX, introY, introW, introH, 6);
            this.ctx.fill();
            
            // Detalles de pergamino enrollado en los bordes
            this.ctx.fillStyle = '#8B5A2B';
            this.ctx.fillRect(introX - 10, introY - 5, 8, introH + 10);
            this.ctx.fillRect(introX + introW + 2, introY - 5, 8, introH + 10);
            
            // Texto del lore
            this.ctx.font = 'bold 20px Georgia, serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#3A200A'; // Marrón oscuro medieval
            this.ctx.fillText("⚔️ CRÓNICAS DE PIXELIA ⚔️", this.canvas.width / 2, introY + 40);
            
            // Adorno inferior del título
            this.ctx.strokeStyle = '#8B5A2B';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(introX + 50, introY + 55);
            this.ctx.lineTo(introX + introW - 50, introY + 55);
            this.ctx.stroke();
            
            // Mensaje del Lore (párrafo)
            this.ctx.font = 'italic 15px Georgia, serif';
            this.ctx.fillStyle = '#4A2B0F';
            const lines = [
                "El próspero Reino de Pixelia ha sido invadido por las",
                "hordas oscuras del temible REY DUENDE, quien se ha",
                "apoderado de las tierras y del gran Castillo ancestral.",
                "",
                "Solo tú, valiente Caballero armado con la BALLESTA DE LA FE,",
                "puedes atravesar este largo y peligroso viaje para purgar",
                "el mal, derrotar al usurpador y devolver la paz a tu hogar.",
                "",
                "¡CUIDADO! Las hogueras medievales en el camino guardarán",
                "tu alma. ¡Que tu puntería sea certera y la fe guíe cada virote!"
            ];
            
            let textY = introY + 85;
            for (const line of lines) {
                this.ctx.fillText(line, this.canvas.width / 2, textY);
                textY += 20;
            }
            
            // Mensaje para continuar
            const pulse = Date.now() / 250;
            this.ctx.font = 'bold 11px Georgia, serif';
            this.ctx.fillStyle = `rgba(139, 26, 26, ${0.5 + Math.sin(pulse) * 0.4})`;
            this.ctx.fillText("PRESIONA LA BARRA ESPACIADORA O HAZ CLIC PARA EMPEZAR LA AVENTURA", this.canvas.width / 2, introY + introH - 25);
        }
    }


    gameLoop() {
        this.isStopped = false;
        const loop = () => {
            if (this.isStopped) return;

            const currentTime = Date.now();
            const deltaTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;

            if (!this.gameOver) {
                this.handleInput(); // Siempre llamar handleInput para poder pausar/reanudar
                if (!this.paused && !this.storyIntroActive) {
                    // Actualizar animaciones
                    this.updateAnimations(deltaTime);
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
        this.isStopped = true;
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
        // Ajustar tamaño de fuente según la longitud de la frase
        let fontSize = Math.min(w * 0.055, 42);
        if (this.currentDeathPhrase.length > 40) fontSize *= 0.7; // Reducir si es muy larga
        else if (this.currentDeathPhrase.length > 25) fontSize *= 0.85;

        this.ctx.font = `bold ${fontSize}px Georgia, "Times New Roman", serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const textY = cy - 45;

        // Sombra profunda
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillText(this.currentDeathPhrase, cx + 3, textY + 3);
        // Resplandor dorado exterior
        this.ctx.shadowColor = '#A0801A';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#C9A84C';
        this.ctx.fillText(this.currentDeathPhrase, cx, textY);
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
            if (!this.gameOver && !this.victory) return;

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.gameOver) {
                // Verificar hover en botones de Game Over
                [this.gameOverButtons.yes, this.gameOverButtons.no].forEach(button => {
                    button.hovered = mouseX >= button.x && mouseX <= button.x + button.width &&
                        mouseY >= button.y && mouseY <= button.y + button.height;
                });
            } else if (this.victory) {
                // Verificar hover en botones de Victoria
                [this.victoryButtons.restart, this.victoryButtons.menu].forEach(button => {
                    button.hovered = mouseX >= button.x && mouseX <= button.x + button.width &&
                        mouseY >= button.y && mouseY <= button.y + button.height;
                });
            }
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.storyIntroActive) {
                this.storyIntroActive = false;
                this.levelStartTime = Date.now();
                return;
            }

            if (!this.gameOver && !this.victory) return;

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.gameOver) {
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
            } else if (this.victory) {
                // Verificar clic en botón REINICIAR
                if (mouseX >= this.victoryButtons.restart.x && mouseX <= this.victoryButtons.restart.x + this.victoryButtons.restart.width &&
                    mouseY >= this.victoryButtons.restart.y && mouseY <= this.victoryButtons.restart.y + this.victoryButtons.restart.height) {
                    this.restartGame();
                }

                // Verificar clic en botón MENÚ
                if (mouseX >= this.victoryButtons.menu.x && mouseX <= this.victoryButtons.menu.x + this.victoryButtons.menu.width &&
                    mouseY >= this.victoryButtons.menu.y && mouseY <= this.victoryButtons.menu.y + this.victoryButtons.menu.height) {
                    this.returnToMenu();
                }
            }
        });
    }

    restartGame() {
        console.log('Reiniciando el juego...');
        this.loadUpgrades();
        
        // Detener audio de muerte
        if (this.deathAudio) {
            this.deathAudio.pause();
            this.deathAudio.currentTime = 0;
        }

        // Si tenemos un checkpoint activo, reaparecer en el checkpoint
        if (this.lastActiveCheckpoint) {
            this.gameOver = false;
            this.victory = false;
            this.paused = false;
            
            // Reaparecer con salud completa y en la posición de la última hoguera
            this.player.health = this.player.maxHealth;
            this.player.displayHealth = this.player.maxHealth;
            this.player.x = this.lastActiveCheckpoint.x;
            this.player.y = this.lastActiveCheckpoint.y;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
            
            // Asegurarse de desbloquear la cámara y limpiar jefes si murió allí
            this.cameraLocked = false;
            this.bossActive = false;
            this.boss = null;
            
            // Limpiar enemigos y proyectiles locales
            this.enemies = [];
            this.projectiles = [];
            this.particles = [];
            this.enemySpawnTimer = 0;
            
            console.log(`Reaparecido en el último checkpoint: x = ${this.player.x}`);
            return;
        }

        // Si no hay checkpoint activo, reiniciar desde el principio
        this.gameOver = false;
        this.victory = false;
        this.paused = false;
        this.score = 0;

        // Reiniciar cronómetro
        this.levelStartTime = Date.now();

        // Reiniciar jugador
        this.player.health = this.player.maxHealth;
        this.player.displayHealth = this.player.maxHealth;
        this.player.x = 200;
        this.player.y = this.config.height - 200;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.enemiesDefeated = 0;
        this.player.gems = parseInt(localStorage.getItem('storyGold') || '0');

        this.playerStillTimer = 0;
        this.lastPlayerX = this.player.x;

        // Limpiar checkpoints
        for (const checkpoint of this.checkpoints) {
            checkpoint.active = false;
        }
        this.lastActiveCheckpoint = null;
        this.cameraLocked = false;
        this.bossActive = false;
        this.bossDefeated = false;
        this.boss = null;

        // Limpiar arrays
        this.enemies = [];
        this.gems = [];
        this.projectiles = [];
        this.particles = [];

        // Reiniciar timers
        this.enemySpawnTimer = 0;
        this.gemSpawnTimer = 0;

        console.log('Juego reiniciado con éxito desde el inicio.');
    }

    returnToMenu() {
        // Detener audio de muerte
        if (this.deathAudio) {
            this.deathAudio.pause();
        }

        // Detener el juego y volver al menú principal
        this.gameOver = true;
        window.location.reload(); // O usar un método más elegante si existe
    }

    drawVictoryScreen() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // Fondo dorado suave con resplandor
        const grad = this.ctx.createRadialGradient(cx, cy, h * 0.2, cx, cy, h * 0.9);
        grad.addColorStop(0, 'rgba(60, 50, 20, 0.85)');
        grad.addColorStop(1, 'rgba(20, 15, 5, 0.95)');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, w, h);

        // Texto de Victoria
        this.ctx.font = 'bold 60px Georgia, serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#FFF5DC';
        this.ctx.fillText('¡VICTORIA!', cx, cy - 50);
        this.ctx.shadowBlur = 0;

        this.ctx.font = '24px Georgia, serif';
        this.ctx.fillStyle = '#B8976A';
        this.ctx.fillText('Has sobrevivido al asalto', cx, cy + 20);

        this.ctx.font = '18px Georgia, serif';
        this.ctx.fillText(`Puntuación Final: ${this.score}`, cx, cy + 60);

        // Botones de victoria
        const btnW = 160;
        const btnH = 50;
        const spacing = btnW * 0.6;
        const btnY = cy + 100;

        // Actualizar posiciones de botones de victoria
        this.victoryButtons.restart.x = cx - spacing - btnW / 2;
        this.victoryButtons.restart.y = btnY;
        this.victoryButtons.restart.width = btnW;
        this.victoryButtons.restart.height = btnH;

        this.victoryButtons.menu.x = cx + spacing - btnW / 2;
        this.victoryButtons.menu.y = btnY;
        this.victoryButtons.menu.width = btnW;
        this.victoryButtons.menu.height = btnH;

        [this.victoryButtons.restart, this.victoryButtons.menu].forEach(button => {
            const bx = button.x;
            const by = button.y;

            // Resplandor hover
            if (button.hovered) {
                this.ctx.shadowColor = '#D4A845';
                this.ctx.shadowBlur = 18;
            }

            // Borde exterior oscuro
            this.ctx.fillStyle = '#1A1005';
            this.roundRect(bx - 4, by - 4, btnW + 8, btnH + 8, 6);
            this.ctx.fill();

            // Fondo principal estilo medieval
            const btnGrad = this.ctx.createLinearGradient(bx, by, bx, by + btnH);
            if (button.hovered) {
                btnGrad.addColorStop(0, '#C9A84C');
                btnGrad.addColorStop(1, '#6B4F10');
            } else {
                btnGrad.addColorStop(0, '#8B6914');
                btnGrad.addColorStop(1, '#3D2E0A');
            }
            this.ctx.fillStyle = btnGrad;
            this.roundRect(bx, by, btnW, btnH, 5);
            this.ctx.fill();

            this.ctx.shadowBlur = 0;

            // Texto del botón
            this.ctx.fillStyle = button.hovered ? '#FFF5DC' : '#FFE5C2';
            this.ctx.font = 'bold 18px Georgia, serif';
            this.ctx.fillText(button.text, bx + btnW / 2, by + btnH / 2);
        });
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.config.width = window.innerWidth;
            this.config.height = window.innerHeight;
            this.canvas.width = this.config.width;
            this.canvas.height = this.config.height;

            // Actualizar cámara
            this.camera.width = this.config.width;
            this.camera.height = this.config.height;

            console.log('Canvas redimensionado:', this.config.width, 'x', this.config.height);
        });
    }

    setupTouchControls() {
        // Mostrar controles móviles si es un dispositivo táctil
        const mobileControls = document.getElementById('mobile-controls');
        if (!mobileControls) return;

        // Detectar si es móvil (simplificado)
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
            mobileControls.classList.remove('hidden');
        }

        const buttons = {
            'btn-left': 'left',
            'btn-right': 'right',
            'btn-jump': 'jump',
            'btn-attack': 'attack'
        };

        Object.entries(buttons).forEach(([id, key]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.touchKeys[key] = true;
                });
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.touchKeys[key] = false;
                });
            }
        });

        // Botones de consumibles especiales
        const btnHeal = document.getElementById('btn-heal');
        if (btnHeal) {
            btnHeal.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.useHealingToken();
            });
        }

        const btnCrossbow = document.getElementById('btn-crossbow');
        if (btnCrossbow) {
            btnCrossbow.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.useGoldCrossbow();
            });
        }

        // Botón de pausa especial
        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.paused = !this.paused;
                const pauseMenu = document.getElementById('pause-menu');
                if (pauseMenu) {
                    if (this.paused) {
                        pauseMenu.classList.remove('hidden');
                    } else {
                        pauseMenu.classList.add('hidden');
                    }
                }
            });
        }
    }

    setSfxVolume(vol) {
        this.sfxVolume = vol;
        if (this.deathAudio) {
            this.deathAudio.volume = vol;
        }
    }

    setTimeOfDay(time) {
        this.timeOfDay = time;
    }

    drawLightCircle(ctx, x, y, radius, intensity) {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
        grad.addColorStop(0.5, `rgba(255, 255, 255, ${intensity * 0.4})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    drawColoredGlow(ctx, x, y, radius, colorString) {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, colorString);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
