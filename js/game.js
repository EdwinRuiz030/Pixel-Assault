// Clase principal del juego
export class Game {
    constructor() {
        // Configuración del juego
        this.config = {
            width: window.innerWidth,
            height: window.innerHeight,
            playerSpeed: 0.5,
            bulletSpeed: 1,
            playfieldHalfWidth: 8,
            playfieldHalfHeight: 5.5,
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
        this.enemies = [];
        this.bullets = [];
        this.enemyDirection = 1;
        this.enemyMoveDown = false;
        this.lastEnemyMoveTime = 0;
        this.enemyMoveInterval = 1000; // ms
        this.enemySpawnQueue = [];
        this.isSpawningWave = false;
        this.lastBulletTime = 0;
        this.bulletCooldown = 500; // ms
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
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('game-canvas'),
            antialias: true 
        });
        this.renderer.setSize(this.config.width, this.config.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
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
        this.scene.background = new THREE.Color(0x000000);
        
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
        this.textures.player = this.textureLoader.load('img/player.png');
        this.textures.alien1 = this.textureLoader.load('img/alien1.png');
        this.textures.alien2 = this.textureLoader.load('img/alien2.png');
        this.textures.alien3 = this.textureLoader.load('img/alien3.png');
        this.textures.missilePlayer = this.textureLoader.load('img/missile_player.png');
        this.textures.missileAlien = this.textureLoader.load('img/missile_alien.png');
    }
    
    createPlayer() {
        // Sprite del jugador
        const material = new THREE.SpriteMaterial({ 
            map: this.textures.player,
            transparent: true
        });

        this.player = new THREE.Sprite(material);
        this.player.position.y = -4;
        this.player.scale.set(1.2, 0.9, 1); // tamaño del sprite
        this.scene.add(this.player);
    }
    
    createEnemies() {
        const startX = -((this.config.enemyCols - 1) * this.config.enemySpacing) / 2;
        const startY = 3;

        const rowTextures = [
            this.textures.alien1,
            this.textures.alien2,
            this.textures.alien3,
            this.textures.alien1,
            this.textures.alien2
        ];
        
        for (let row = 0; row < this.config.enemyRows; row++) {
            for (let col = 0; col < this.config.enemyCols; col++) {
                const material = new THREE.SpriteMaterial({
                    map: rowTextures[row % rowTextures.length],
                    transparent: true
                });

                const enemy = new THREE.Sprite(material);
                enemy.position.x = startX + col * this.config.enemySpacing;
                enemy.position.y = startY - row * this.config.enemySpacing * 0.7;
                enemy.scale.set(1, 0.8, 1);
                enemy.userData = { row, col };
                
                this.scene.add(enemy);
                this.enemies.push(enemy);
            }
        }
    }

    buildEnemySpawnQueue() {
        const startX = -((this.config.enemyCols - 1) * this.config.enemySpacing) / 2;
        const startY = 3;

        const rowTextures = [
            this.textures.alien1,
            this.textures.alien2,
            this.textures.alien3,
            this.textures.alien1,
            this.textures.alien2
        ];

        const queue = [];
        for (let row = 0; row < this.config.enemyRows; row++) {
            for (let col = 0; col < this.config.enemyCols; col++) {
                queue.push({
                    x: startX + col * this.config.enemySpacing,
                    y: startY - row * this.config.enemySpacing * 0.7,
                    row,
                    col,
                    texture: rowTextures[row % rowTextures.length]
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
        const material = new THREE.SpriteMaterial({
            map: next.texture,
            transparent: true
        });

        const enemy = new THREE.Sprite(material);
        enemy.position.x = next.x;
        enemy.position.y = next.y;
        enemy.scale.set(1, 0.8, 1);
        enemy.userData = { row: next.row, col: next.col };

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
        // Tres capas de estrellas para efecto parallax
        const layerConfigs = [
            { count: 500, size: 0.06, depth: 80, speed: 3.0, color: 0x666666 }, // lejana
            { count: 700, size: 0.09, depth: 60, speed: 5.0, color: 0xaaaaaa }, // media
            { count: 900, size: 0.12, depth: 40, speed: 8.0, color: 0xffffff }  // cercana
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
                this.shoot();
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
        this.paused = !this.paused;
        // Aquí podrías mostrar/ocultar un mensaje de pausa
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastBulletTime < this.bulletCooldown) return;
        
        this.lastBulletTime = now;
        
        const bulletMaterial = new THREE.SpriteMaterial({
            map: this.textures.missilePlayer,
            transparent: true
        });
        const bullet = new THREE.Sprite(bulletMaterial);
        
        bullet.position.x = this.player.position.x;
        bullet.position.y = this.player.position.y + 0.7;
        bullet.scale.set(0.3, 0.6, 1);
        
        this.scene.add(bullet);
        this.bullets.push({
            mesh: bullet,
            direction: 1,
            speed: this.config.bulletSpeed
        });
        
        // Aquí podrías agregar un sonido de disparo
    }
    
    updatePlayer(deltaTime) {
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
    
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.mesh.position.y += bullet.speed * deltaTime * 60 * bullet.direction;
            
            // Eliminar balas que salen de la pantalla
            if (bullet.mesh.position.y > 6 || bullet.mesh.position.y < -6) {
                this.scene.remove(bullet.mesh);
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Detección de colisiones
            this.checkBulletCollisions(bullet, i);
        }
    }
    
    checkBulletCollisions(bullet, bulletIndex) {
        // Verificar colisión con enemigos (solo para balas del jugador)
        if (bullet.direction > 0) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                
                if (this.checkCollision(bullet.mesh, enemy)) {
                    // Eliminar el enemigo
                    this.scene.remove(enemy);
                    this.enemies.splice(i, 1);

                    // Spawn de 1-2 enemigos extra por cada baja (si quedan en cola)
                    this.spawnNextEnemyBatch();
                    
                    // Eliminar la bala
                    this.scene.remove(bullet.mesh);
                    this.bullets.splice(bulletIndex, 1);
                    
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
        }
    }
    
    checkCollision(mesh1, mesh2) {
        // Detección de colisión simple usando bounding boxes
        const box1 = new THREE.Box3().setFromObject(mesh1);
        const box2 = new THREE.Box3().setFromObject(mesh2);
        return box1.intersectsBox(box2);
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
        
        // Disparo aleatorio de enemigos
        if (Math.random() < 0.02 && this.enemies.length > 0) {
            this.enemyShoot();
        }
    }
    
    enemyShoot() {
        if (this.enemies.length === 0) return;
        
        // Seleccionar un enemigo aleatorio para disparar
        const shooter = this.enemies[Math.floor(Math.random() * this.enemies.length)];
        
        const bulletMaterial = new THREE.SpriteMaterial({
            map: this.textures.missileAlien,
            transparent: true
        });
        const bullet = new THREE.Sprite(bulletMaterial);
        
        bullet.position.x = shooter.position.x;
        bullet.position.y = shooter.position.y - 0.7;
        bullet.scale.set(0.3, 0.6, 1);
        
        this.scene.add(bullet);
        this.bullets.push({
            mesh: bullet,
            direction: -1, // Disparo hacia abajo
            speed: this.config.bulletSpeed * 0.7
        });
    }
    
    levelComplete() {
        this.level++;
        this.wave = this.level;
        document.getElementById('level').textContent = this.level;
        
        // Aumentar la dificultad
        this.enemyMoveInterval = Math.max(200, this.enemyMoveInterval - 50);
        this.config.enemySpeed += 0.02;
        
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
        if (!banner) return;

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
        this.updateBullets(deltaTime);
        this.updateEnemies(deltaTime);
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
        this.renderer.render(this.scene, this.camera);
    }
    
    start() {
        // Reiniciar estado del juego
        this.score = 0;
        this.level = 1;
        this.wave = 1;
        this.lives = this.config.playerLives;
        this.gameOver = false;
        this.paused = false;
        
        // Limpiar enemigos y balas existentes
        this.enemies.forEach(enemy => this.scene.remove(enemy));
        this.enemies = [];
        
        this.bullets.forEach(bullet => this.scene.remove(bullet.mesh));
        this.bullets = [];

        // Mostrar secuencia de horda inicial (sin enemigos al principio)
        this.showWaveIntro();
        
        // Resetear posición del jugador
        this.player.position.x = 0;
        this.player.position.y = -4;
        
        // Iniciar bucle de animación
        this.lastFrameTime = null;
        this.animate(0);
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}
