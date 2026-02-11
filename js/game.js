// Clase principal del juego
export class Game {
    constructor() {
        // Configuración del juego
        this.config = {
            width: window.innerWidth,
            height: window.innerHeight,
            playerSpeed: 0.3    ,
            arrowSpeed: 2,
            enemyArrowSpeedMultiplier: 0.1,
            playfieldHalfWidth: 8,
            playfieldHalfHeight: 5.5,
            enemyAnimCols: 4,
            enemyAnimRows: 4,
            enemyAnimFrames: 16,
            enemyAnimFps: 12,
            enemySpeed: 0.1,
            enemyRows: 5,
            enemyCols: 10,
            enemySpacing: 1.5,
            enemyDropDistance: 0.5,
            playerLives: 3,
            pointsPerEnemy: 100
        };

        // Estado del juego
        this.score = 0;
        this.level = 1;
        this.wave = 1;
        this.lives = this.config.playerLives;
        this.gameOver = false;
        this.paused = false;

        this.playerInvulnerableUntil = 0;
        this.respawnTimeout = null;
        this.enemySheetReady = false;
        this.enemyGifReady = false;
        this.enemyGifImg = null;
        this.enemyGifCanvas = null;
        this.enemyGifCtx = null;
        this.enemyGifTexture = null;
        this.enemies = [];
        this.arrows = [];
        this.enemyDirection = 1;
        this.enemyMoveDown = false;
        this.lastEnemyMoveTime = 0;
        this.enemyMoveInterval = 1000; // ms
        this.lastEnemyShootTime = 0;
        this.enemyShootInterval = 800; // ms
        this.enemyShootChance = 1;
        this.enemySpawnQueue = [];
        this.isSpawningWave = false;
        this.lastArrowTime = 0;
        this.arrowCooldown = 100; // ms
        this.keys = {};

        // Cargador de texturas
        this.textureLoader = new THREE.TextureLoader();
        this.textures = {};

        // Capas de parallax
        this.starfields = [];

        // Inicializar Three.js
        this.initThree();
        
        // Inicializar la escena del juego
        this.initScene();
        
        // Configurar controles
        this.setupControls();
        
        // Configurar el bucle de animación
        this.animate = this.animate.bind(this);
        this.animationId = null;
        this.waveBannerTimeout = null;
    }

    initThree() {
        // Crear el renderizador
        const canvas = document.getElementById('game-canvas');
        console.log('Canvas encontrado:', canvas);
        if (!canvas) {
            console.error('No se encontró el canvas del juego');
            return;
        }
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(this.config.width, this.config.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        console.log('Renderer creado:', this.renderer);
        
        // Crear la cámara
        this.camera = new THREE.PerspectiveCamera(
            75, 
            this.config.width / this.config.height, 
            0.1, 
            1000
        );
        this.camera.position.z = 10;
        
        // Crear la escena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2a1810); // Marrón oscuro medieval
        
        // Agregar luces
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }
    
    initScene() {
        // Cargar texturas de sprites
        this.loadTextures();

        // Crear jugador
        this.createPlayer();
        
        // No crear enemigos todavía; se crearán después de los mensajes de horda
        
        // Crear fondo de estrellas
        this.createStarfield();
    }
    
    loadTextures() {
        this.textures.warrior = this.textureLoader.load('img/warrior.png', 
            (texture) => console.log('Textura warrior cargada'),
            undefined,
            (error) => console.error('Error cargando warrior:', error)
        );
        this.textures.soldier1 = this.textureLoader.load('img/soldier1.png');
        this.textures.soldier2 = this.textureLoader.load('img/soldier2.png');
        this.textures.soldier3 = this.textureLoader.load('img/soldier3.png');
        // Usar texturas individuales en lugar de sprite sheet
        this.textures.enemySheet = this.textures.soldier1; // Usar soldier1 como fallback
        this.enemySheetReady = true;
        this.textures.arrowPlayer = this.textureLoader.load('img/arrow_player.png');
        this.textures.arrowEnemy = this.textureLoader.load('img/arrow_enemy.png');
        this.textures.explosion = this.textureLoader.load('img/explosion.png');

        this.enemyGifReady = false;
        this.enemyGifImg = new Image();
        this.enemyGifImg.onload = () => {
            this.enemyGifCanvas = document.createElement('canvas');
            const w = this.enemyGifImg.naturalWidth || this.enemyGifImg.width || 64;
            const h = this.enemyGifImg.naturalHeight || this.enemyGifImg.height || 64;
            this.enemyGifCanvas.width = w;
            this.enemyGifCanvas.height = h;
            this.enemyGifCtx = this.enemyGifCanvas.getContext('2d');
            this.enemyGifTexture = new THREE.CanvasTexture(this.enemyGifCanvas);
            this.enemyGifTexture.needsUpdate = true;
            this.enemyGifReady = true;
        };
        this.enemyGifImg.onerror = () => {
            this.enemyGifReady = false;
            this.enemyGifImg = null;
            this.enemyGifCanvas = null;
            this.enemyGifCtx = null;
            this.enemyGifTexture = null;
        };
        this.enemyGifImg.src = 'img/medieval_battle.gif';
    }

    updateEnemyGifTexture() {
        if (!this.enemyGifReady || !this.enemyGifCtx || !this.enemyGifCanvas || !this.enemyGifImg || !this.enemyGifTexture) return;
        this.enemyGifCtx.clearRect(0, 0, this.enemyGifCanvas.width, this.enemyGifCanvas.height);
        this.enemyGifCtx.drawImage(this.enemyGifImg, 0, 0, this.enemyGifCanvas.width, this.enemyGifCanvas.height);
        this.enemyGifTexture.needsUpdate = true;
    }

    createGifEnemyMaterial() {
        if (!this.enemyGifReady || !this.enemyGifTexture) return null;
        const mat = new THREE.SpriteMaterial({
            map: this.enemyGifTexture,
            transparent: true
        });
        mat.depthTest = false;
        mat.depthWrite = false;
        return mat;
    }

    createAnimatedEnemyMaterial() {
        const base = this.textures.enemySheet;
        const tex = base.clone();
        tex.needsUpdate = true;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        const cols = this.config.enemyAnimCols;
        const rows = this.config.enemyAnimRows;
        tex.repeat.set(1 / cols, 1 / rows);
        tex.offset.set(0, 1 - (1 / rows));

        const mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true
        });
        mat.depthTest = false;
        mat.depthWrite = false;

        return { mat, tex };
    }

    updateEnemyAnimations(deltaTime) {
        if (!this.enemies || !this.enemies.length) return;

        const cols = this.config.enemyAnimCols;
        const rows = this.config.enemyAnimRows;
        const frames = this.config.enemyAnimFrames;
        const fps = this.config.enemyAnimFps;
        if (!cols || !rows || !frames || !fps) return;

        for (const enemy of this.enemies) {
            const anim = enemy.userData && enemy.userData.anim;
            if (!anim) continue;

            anim.acc += deltaTime;
            const frameTime = 1 / fps;
            while (anim.acc >= frameTime) {
                anim.acc -= frameTime;
                anim.frame = (anim.frame + 1) % frames;

                const col = anim.frame % cols;
                const row = Math.floor(anim.frame / cols) % rows;

                anim.texture.offset.x = col / cols;
                anim.texture.offset.y = 1 - ((row + 1) / rows);
            }
        }
    }
    
    createPlayer() {
        // Sprite del caballero medieval
        const material = new THREE.SpriteMaterial({ 
            map: this.textures.warrior,
            transparent: true
        });

        this.player = new THREE.Sprite(material);
        this.player.position.y = -4;
        this.player.position.x = 0;
        this.player.scale.set(1.5, 1.2, 1); // tamaño más grande y heroico
        this.player.visible = true;
        this.scene.add(this.player);
        
        console.log('Caballero creado:', this.player.position, 'Visible:', this.player.visible);
    }
    
    createEnemies() {
        const startX = -((this.config.enemyCols - 1) * this.config.enemySpacing) / 2;
        const startY = 3;

        const rowTextures = [
            this.textures.soldier1,
            this.textures.soldier2,
            this.textures.soldier3,
            this.textures.soldier1,
            this.textures.soldier2
        ];
        
        for (let row = 0; row < this.config.enemyRows; row++) {
            for (let col = 0; col < this.config.enemyCols; col++) {
                const material = new THREE.SpriteMaterial({
                    map: rowTextures[row],
                    transparent: true
                });
                const enemy = new THREE.Sprite(material);
                enemy.position.x = startX + col * this.config.enemySpacing;
                enemy.position.y = startY - row * this.config.enemySpacing * 0.7;
                enemy.scale.set(1.2, 1.0, 1); // tamaño más medieval
                enemy.userData = { row, col };
                
                this.scene.add(enemy);
                this.enemies.push(enemy);
            }
        }
    }

    buildEnemySpawnQueue() {
        const startX = -((this.config.enemyCols - 1) * this.config.enemySpacing) / 2;
        const startY = 3;

        const queue = [];
        for (let row = 0; row < this.config.enemyRows; row++) {
            for (let col = 0; col < this.config.enemyCols; col++) {
                queue.push({
                    x: startX + col * this.config.enemySpacing,
                    y: startY - row * this.config.enemySpacing * 0.7,
                    row,
                    col,
                    useSheet: true
                });
            }
        }

        // Mezclar para que salgan en orden "aleatorio"; si prefieres orden por filas, quita esto
        for (let i = queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = queue[i];
            queue[i] = queue[j];
            queue[j] = tmp;
        }

        return queue;
    }

    spawnEnemyFromQueue() {
        if (!this.enemySpawnQueue.length) return;

        const next = this.enemySpawnQueue.shift();
        let material;
        let tex;
        const gifMat = this.createGifEnemyMaterial();
        if (gifMat) {
            material = gifMat;
            tex = null;
        } else if (next.useSheet && this.enemySheetReady && this.textures.enemySheet) {
            const created = this.createAnimatedEnemyMaterial();
            material = created.mat;
            tex = created.tex;
        } else {
            const fallbackMap = this.textures.soldier1 || this.textures.warrior;
            material = new THREE.SpriteMaterial({ map: fallbackMap, transparent: true });
            material.depthTest = false;
            material.depthWrite = false;
            tex = null;
        }

        const enemy = new THREE.Sprite(material);
        enemy.position.x = next.x;
        enemy.position.y = next.y;
        enemy.scale.set(1, 0.8, 1);
        enemy.userData = { row: next.row, col: next.col };
        enemy.renderOrder = 10;

        if (tex) {
            enemy.userData.anim = { texture: tex, frame: 0, acc: 0 };
        }

        this.scene.add(enemy);
        this.enemies.push(enemy);
    }

    startWaveSpawning() {
        this.enemies.forEach(enemy => this.scene.remove(enemy));
        this.enemies = [];
        this.enemySpawnQueue = this.buildEnemySpawnQueue();
        this.isSpawningWave = true;

        // Spawn inicial (1 o 2)
        this.spawnNextEnemyBatch();
    }

    spawnNextEnemyBatch() {
        if (!this.isSpawningWave) return;
        if (!this.enemySpawnQueue.length) {
            this.isSpawningWave = false;
            return;
        }

        const batch = Math.random() < 0.5 ? 1 : 2;
        for (let i = 0; i < batch; i++) {
            if (!this.enemySpawnQueue.length) break;
            this.spawnEnemyFromQueue();
        }

        if (!this.enemySpawnQueue.length) {
            this.isSpawningWave = false;
        }
    }

    isWaveCleared() {
        return this.enemies.length === 0 && (!this.enemySpawnQueue || this.enemySpawnQueue.length === 0) && !this.isSpawningWave;
    }
    
    createStarfield() {
        // Tres capas de partículas medievales para efecto parallax
        const layerConfigs = [
            { count: 300, size: 0.04, depth: 80, speed: 2.0, color: 0x8b4513 }, // marrón oscuro
            { count: 400, size: 0.06, depth: 60, speed: 3.0, color: 0xd2691e }, // marrón medio
            { count: 500, size: 0.08, depth: 40, speed: 5.0, color: 0xffd700 }  // dorado
        ];

        this.starfields = [];

        for (const cfg of layerConfigs) {
            const geom = new THREE.BufferGeometry();
            const mat = new THREE.PointsMaterial({
                color: cfg.color,
                size: cfg.size,
                transparent: true
            });

            const vertices = [];
            for (let i = 0; i < cfg.count; i++) {
                const x = (Math.random() - 0.5) * 40;   // ancho
                const y = (Math.random() - 0.5) * 25;   // alto
                const z = -Math.random() * cfg.depth;   // al fondo
                vertices.push(x, y, z);
            }

            geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            const points = new THREE.Points(geom, mat);
            this.scene.add(points);

            this.starfields.push({
                points,
                geometry: geom,
                depth: cfg.depth,
                speed: cfg.speed
            });
        }
    }

    updateParallax(deltaTime) {
        if (!this.starfields.length) return;

        const playerX = this.player ? this.player.position.x : 0;

        for (const layer of this.starfields) {
            const positions = layer.geometry.attributes.position.array;
            const baseSpeed = layer.speed * deltaTime;

            for (let i = 0; i < positions.length; i += 3) {
                // Movimiento hacia abajo (simula avance)
                positions[i + 1] -= baseSpeed * 0.2;
                if (positions[i + 1] < -15) {
                    positions[i + 1] = 15;
                }

                // Ligerísimo desplazamiento horizontal opuesto al jugador
                positions[i] += (-playerX * 0.03) * deltaTime * (layer.speed / 4);
                if (positions[i] > 25) positions[i] = -25;
                if (positions[i] < -25) positions[i] = 25;
            }

            layer.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    setupControls() {
        // Manejadores de teclado
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Pausa el juego con la tecla P
            if (e.code === 'KeyP') {
                this.togglePause();
            }
            
            // Disparar con la barra espaciadora
            if (e.code === 'Space' && !this.paused && !this.gameOver) {
                this.shootArrow();
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Manejar redimensionamiento de la ventana
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    onWindowResize() {
        this.config.width = window.innerWidth;
        this.config.height = window.innerHeight;
        
        this.camera.aspect = this.config.width / this.config.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.config.width, this.config.height);
    }
    
    togglePause() {

        this.enemies.forEach(enemy => this.scene.remove(enemy));
        this.enemies = [];

        this.arrows.forEach(a => this.scene.remove(a.mesh));
        this.arrows = [];

        if (this.player) {
            const explosionMaterial = new THREE.SpriteMaterial({
                map: this.textures.explosion,
                transparent: true
            });
            const explosion = new THREE.Sprite(explosionMaterial);
            explosion.position.x = this.player.position.x;
            explosion.position.y = this.player.position.y;
            explosion.scale.set(1.6, 1.6, 1);
            this.scene.add(explosion);

            this.player.visible = false;

            setTimeout(() => {
                this.scene.remove(explosion);
            }, 450);
        }

        if (this.lives <= 0) {
            this.gameOver = true;
            this.showGameOver();
            return;
        }

        this.playerInvulnerableUntil = Date.now() + 1400;
        if (this.respawnTimeout) {
            clearTimeout(this.respawnTimeout);
        }
        this.respawnTimeout = setTimeout(() => {
            if (!this.player) return;
            this.player.position.x = 0;
            this.player.position.y = -4;
            this.player.visible = true;
        }, 700);
    }
    
    updatePlayer(deltaTime) {
        // No mover al jugador si no está visible (está en respawn)
        if (!this.player || !this.player.visible) return;
        
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.position.x -= this.config.playerSpeed * deltaTime * 60;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.position.x += this.config.playerSpeed * deltaTime * 60;
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.position.y += this.config.playerSpeed * deltaTime * 60;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.position.y -= this.config.playerSpeed * deltaTime * 60;
        }
        
        // Limitar al jugador dentro de los bordes de la pantalla
        const halfPlayerWidth = 0.4;
        const rightBound = this.config.playfieldHalfWidth - halfPlayerWidth;
        const leftBound = -this.config.playfieldHalfWidth + halfPlayerWidth;
        const halfPlayerHeight = 0.3;
        const topBound = this.config.playfieldHalfHeight - halfPlayerHeight;
        const bottomBound = -this.config.playfieldHalfHeight + halfPlayerHeight;
        
        if (this.player.position.x > rightBound) {
            this.player.position.x = rightBound;
        } else if (this.player.position.x < leftBound) {
            this.player.position.x = leftBound;
        }

        if (this.player.position.y > topBound) {
            this.player.position.y = topBound;
        } else if (this.player.position.y < bottomBound) {
            this.player.position.y = bottomBound;
        }
    }
    
    updateArrows(deltaTime) {
        for (let i = this.arrows.length - 1; i >= 0; i--) {
            const arrow = this.arrows[i];
            arrow.mesh.position.x += arrow.vx * deltaTime * 60;
            arrow.mesh.position.y += arrow.vy * deltaTime * 60;
            
            // Eliminar flechas que salen de la pantalla
            if (arrow.mesh.position.y > 6 || arrow.mesh.position.y < -6 || arrow.mesh.position.x > 12 || arrow.mesh.position.x < -12) {
                this.scene.remove(arrow.mesh);
                this.arrows.splice(i, 1);
            }
            
            // Detección de colisiones
            this.checkArrowCollisions(arrow, i);
        }
    }
    
    checkArrowCollisions(arrow, arrowIndex) {
        // Verificar colisión con enemigos (solo para flechas del jugador)
        if (arrow.owner === 'player') {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                
                if (this.checkCollision(arrow.mesh, enemy)) {
                    // Eliminar el enemigo
                    this.scene.remove(enemy);
                    this.enemies.splice(i, 1);

                    // Spawn de 1-2 enemigos extra por cada baja (si quedan en cola)
                    this.spawnNextEnemyBatch();
                    
                    // Eliminar la flecha
                    this.scene.remove(arrow.mesh);
                    this.arrows.splice(arrowIndex, 1);
                    
                    // Actualizar puntuación
                    this.score += this.config.pointsPerEnemy;
                    document.getElementById('score').textContent = this.score;
                    
                    // Verificar si el jugador ganó
                    if (this.isWaveCleared()) {
                        this.levelComplete();
                    }
                    
                    break;
                }
            }
        } else if (arrow.owner === 'enemy') {
            const now = Date.now();
            if (now < this.playerInvulnerableUntil) return;
            if (!this.player || !this.player.visible) return;

            if (this.checkCollision(arrow.mesh, this.player)) {
                this.scene.remove(arrow.mesh);
                this.arrows.splice(arrowIndex, 1);
                this.handlePlayerHit();
            }
        }
    }

    handlePlayerHit() {
        const now = Date.now();
        if (now < this.playerInvulnerableUntil) return;

        this.lives -= 1;
        this.updateHUD();

        this.arrows.forEach(a => this.scene.remove(a.mesh));
        this.arrows = [];

        if (this.player) {
            const explosionMaterial = new THREE.SpriteMaterial({
                map: this.textures.explosion,
                transparent: true
            });
            const explosion = new THREE.Sprite(explosionMaterial);
            explosion.position.x = this.player.position.x;
            explosion.position.y = this.player.position.y;
            explosion.scale.set(1.6, 1.6, 1);
            this.scene.add(explosion);

            this.player.visible = false;

            setTimeout(() => {
                this.scene.remove(explosion);
            }, 450);
        }

        if (this.lives <= 0) {
            this.gameOver = true;
            this.showGameOver();
            return;
        }

        this.playerInvulnerableUntil = Date.now() + 1400;
        if (this.respawnTimeout) {
            clearTimeout(this.respawnTimeout);
        }
        this.respawnTimeout = setTimeout(() => {
            if (!this.player) return;
            this.player.position.x = 0;
            this.player.position.y = -4;
            this.player.visible = true;
        }, 700);
    }
    
    checkCollision(mesh1, mesh2) {
        // Detección de colisión simple usando bounding boxes
        const box1 = new THREE.Box3().setFromObject(mesh1);
        const box2 = new THREE.Box3().setFromObject(mesh2);
        const collision = box1.intersectsBox(box2);
        
        // Debug: mostrar si hay colisión (desactivado para reducir spam)
        // if (collision && mesh1.material && mesh1.material.map) {
        //     console.log('COLISIÓN DETECTADA');
        // }
        
        return collision;
    }
    
    updateEnemies(deltaTime) {
        const now = Date.now();
        if (now - this.lastEnemyMoveTime < this.enemyMoveInterval) return;
        
        this.lastEnemyMoveTime = now;
        
        // Mover enemigos
        let moveDown = false;
        let hitEdge = false;
        
        // Verificar si algún enemigo ha llegado al borde
        for (const enemy of this.enemies) {
            if ((this.enemyDirection > 0 && enemy.position.x > 4) ||
                (this.enemyDirection < 0 && enemy.position.x < -4)) {
                hitEdge = true;
                break;
            }
        }
        
        // Mover enemigos
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (hitEdge) {
                enemy.position.y -= this.config.enemyDropDistance;
                moveDown = true;
                
                // Verificar si los enemigos llegaron al fondo
                if (enemy.position.y < -3) {
                    this.gameOver = true;
                    this.showGameOver();
                    return;
                }
            } else {
                enemy.position.x += this.config.enemySpeed * this.enemyDirection;
            }
        }
        
        // Cambiar dirección si es necesario
        if (hitEdge) {
            this.enemyDirection *= -1;
        }
          // Disparo se maneja por un temporizador independiente
    }

    updateEnemyShooting() {
        if (this.paused || this.gameOver) return;
        if (!this.enemies || this.enemies.length === 0) return;

        const now = Date.now();
        if (this.lastEnemyShootTime && (now - this.lastEnemyShootTime < this.enemyShootInterval)) return;
        this.lastEnemyShootTime = now;

        // Probabilidad por tick, para que no sea demasiado agresivo
        if (Math.random() <= this.enemyShootChance) {
            this.enemyShoot();
        }
    }
    
    enemyShoot() {
        if (this.enemies.length === 0) return;
        
        // Seleccionar un enemigo aleatorio para disparar
        const shooter = this.enemies[Math.floor(Math.random() * this.enemies.length)];
        
        const arrowMaterial = new THREE.SpriteMaterial({
            map: this.textures.arrowEnemy,
            transparent: true
        });
        arrowMaterial.depthTest = false;
        arrowMaterial.depthWrite = false;
        const arrow = new THREE.Sprite(arrowMaterial);
        
        arrow.position.x = shooter.position.x;
        arrow.position.y = shooter.position.y - 0.7;
        arrow.scale.set(0.3, 0.6, 1);
        arrow.renderOrder = 11;
        
        this.scene.add(arrow);

        const targetX = this.player ? this.player.position.x : shooter.position.x;
        const targetY = this.player ? this.player.position.y : (shooter.position.y - 10);
        const dx = targetX - shooter.position.x;
        const dy = targetY - shooter.position.y;
        const len = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
        const speed = this.config.arrowSpeed * this.config.enemyArrowSpeedMultiplier;

        this.arrows.push({
            mesh: arrow,
            owner: 'enemy',
            vx: (dx / len) * speed,
            vy: (dy / len) * speed
        });
    }
    
    levelComplete() {
        this.level++;
        this.wave = this.level;
        document.getElementById('level').textContent = this.level;
        
        // Aumentar la dificultad
        this.enemyMoveInterval = Math.max(200, this.enemyMoveInterval - 50);
        this.config.enemySpeed += 0.02;
    
        // Aumentar ligeramente la cadencia de disparo
        this.enemyShootInterval = Math.max(200, this.enemyShootInterval - 20);
    
        // Iniciar secuencia de nueva horda (mensajes + aparición de enemigos)
        this.showWaveIntro();
    }
    
    showGameOver() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
    }
    
    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = this.lives;
        const waveEl = document.getElementById('wave');
        if (waveEl) {
            waveEl.textContent = this.wave;
        }
    }

    showWaveIntro() {
        const banner = document.getElementById('wave-banner');
        if (!banner) {
            this.startWaveSpawning();
            return;
        }

        // Limpiar enemigos existentes por seguridad
        this.enemies.forEach(enemy => this.scene.remove(enemy));
        this.enemies = [];

        // Cancelar timeouts anteriores
        if (this.waveBannerTimeout) {
            clearTimeout(this.waveBannerTimeout);
            this.waveBannerTimeout = null;
        }

        // Primero: "¡PREPÁRATE!"
        banner.textContent = '¡PREPÁRATE!';
        banner.classList.remove('hidden');

        // Después de 1.5s: mostrar "HORDA X"
        this.waveBannerTimeout = setTimeout(() => {
            banner.textContent = `HORDA ${this.wave}`;

            // Después de otros 1.5s: ocultar banner y comenzar spawn gradual
            this.waveBannerTimeout = setTimeout(() => {
                banner.classList.add('hidden');
                this.startWaveSpawning();
            }, 1500);
        }, 1500);
    }
    
    update(deltaTime) {
        if (this.paused || this.gameOver) return;
        
        this.updatePlayer(deltaTime);
        this.updateEnemyGifTexture();
        this.updateArrows(deltaTime);
        this.updateEnemyShooting();
        this.updateEnemies(deltaTime);
        this.updateEnemyAnimations(deltaTime);
        this.updateParallax(deltaTime);
        this.updateHUD();
    }
    
    animate(time) {
        this.animationId = requestAnimationFrame(this.animate);
        
        // Calcular deltaTime para movimiento suave independiente de la tasa de fotogramas
        if (!this.lastFrameTime) this.lastFrameTime = time;
        const deltaTime = (time - this.lastFrameTime) / 1000; // Convertir a segundos
        this.lastFrameTime = time;
        
        // Actualizar lógica del juego
        this.update(deltaTime);
        
        // Renderizar la escena
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        } else {
            console.error('Faltan componentes para renderizar:', {
                renderer: !!this.renderer,
                scene: !!this.scene,
                camera: !!this.camera
            });
        }
    }
    
    start() {
        console.log('Iniciando juego...');
        
        // Limpiar enemigos y balas existentes
        this.enemies.forEach(enemy => this.scene.remove(enemy));
        this.enemies = [];
        
        this.arrows.forEach(arrow => this.scene.remove(arrow.mesh));
        this.arrows = [];

        // Resetear estado del juego
        this.score = 0;
        this.level = 1;
        this.wave = 1;
        this.lives = this.config.playerLives;
        this.gameOver = false;
        this.paused = false;
        
        // Mostrar secuencia de horda inicial (sin enemigos al principio)
        this.showWaveIntro();
        
        // Resetear posición del jugador
        if (this.player) {
            this.player.position.x = 0;
            this.player.position.y = -4;
            this.player.visible = true;
            console.log('Jugador reseteado:', this.player.position);
        }
        
        // Iniciar bucle de animación
        this.lastFrameTime = null;
        console.log('Iniciando animación...');
        this.animate(0);
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}
