// Clase principal del juego
export class Game {
    constructor() {
        console.log('=== INICIO CONSTRUCTOR GAME ===');
        
        // PRUEBA SIMPLE: Verificar si el canvas existe
        const testCanvas = document.getElementById('game-canvas');
        console.log('Canvas test:', testCanvas);
        if (testCanvas) {
            console.log('Canvas width:', testCanvas.width);
            console.log('Canvas height:', testCanvas.height);
            console.log('Canvas style:', testCanvas.style.width, testCanvas.style.height);
            
            // Dibujar algo directamente en el canvas para probar
            const ctx = testCanvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'red';
                ctx.fillRect(50, 50, 100, 100);
                console.log('Rectángulo rojo dibujado directamente en canvas');
            } else {
                console.error('No se pudo obtener contexto 2D del canvas');
            }
        } else {
            console.error('Canvas no encontrado');
        }
        
        // Configuración del juego tipo plataformas
        this.config = {
            width: window.innerWidth,
            height: window.innerHeight,
            playerSpeed: 0.4,           // Movimiento horizontal
            jumpPower: 0.8,              // Fuerza de salto
            gravity: 0.02,               // Gravedad
            groundLevel: -4,             // Nivel del suelo
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

        console.log('Configuración inicializada - Dimensiones:', this.config.width, 'x', this.config.height);

        // Estado del juego
        this.score = 0;
        this.level = 1;
        this.wave = 1;
        this.lives = this.config.playerLives;
        this.gameOver = false;
        this.paused = false;

        // Estado del jugador (plataformas)
        this.playerVelocity = { x: 0, y: 0 };
        this.isJumping = false;
        this.isDucking = false;
        this.isGrounded = true;

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
        
        // Usar Canvas 2D en lugar de Three.js
        this.useCanvas2D = true;
        this.canvas2D = document.getElementById('game-canvas');
        this.ctx2D = this.canvas2D.getContext('2d');
        
        // Configurar canvas 2D
        this.canvas2D.width = this.config.width;
        this.canvas2D.height = this.config.height;
        
        console.log('Canvas 2D configurado - Dimensiones:', this.canvas2D.width, 'x', this.canvas2D.height);

        // Jugador simple para Canvas 2D
        this.player2D = {
            x: this.config.width / 2,
            y: this.config.height / 2,
            width: 64,
            height: 64,
            color: '#FFD700', // Dorado
            visible: true
        };

        // Inicializar solo lo necesario para Canvas 2D
        this.createStarfield();
        this.setupControls();
        this.updateHUD();
        this.showWaveIntro();
        this.animate2D();
        
        console.log('Constructor Game completado - Canvas 2D mode');
    }

    initThree() {
        console.log('=== INIT THREE INICIADO ===');
        
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
        
        this.camera = new THREE.PerspectiveCamera(
            75, 
            this.config.width / this.config.height, 
            0.1, 
            1000
        );
        this.camera.position.z = 10;
        
        console.log('Cámara configurada - Posición:', this.camera.position.x, this.camera.position.y, this.camera.position.z);
        console.log('Cámara FOV:', this.camera.fov);
        console.log('Cámara aspect:', this.camera.aspect);
        
        // Crear la escena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x808080); // Gris
        
        console.log('Escena creada - Fondo gris');
        
        // Agregar luces
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        console.log('Luces añadidas a la escena');
        
        // Configurar renderer
        this.renderer.setSize(this.config.width, this.config.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        console.log('Renderer configurado - Canvas encontrado:', !!document.getElementById('game-canvas'));
        console.log('Renderer dimensiones:', this.config.width, 'x', this.config.height);
        
        // Verificar que el canvas existe y tiene dimensiones
        if (canvas) {
            console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
            console.log('Canvas style:', canvas.style.width, 'x', canvas.style.height);
        } else {
            console.error('ERROR: Canvas no encontrado');
        }
        
        console.log('=== INIT THREE COMPLETADO ===');
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
        // No cargar warrior.png ya que no existe
        // this.textures.warrior = this.textureLoader.load('img/warrior.png', 
        //     (texture) => console.log('Textura warrior cargada'),
        //     undefined,
        //     (error) => console.error('Error cargando warrior:', error)
        // );
        
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
    
    animate2D() {
        console.log('Iniciando animación Canvas 2D...');
        
        const gameLoop = () => {
            // Limpiar canvas
            this.ctx2D.fillStyle = '#808080'; // Gris
            this.ctx2D.fillRect(0, 0, this.canvas2D.width, this.canvas2D.height);
            
            // Dibujar estrellas (starfield) - se mueven incluso en pausa para efecto visual
            if (this.stars && this.stars.length > 0) {
                for (const star of this.stars) {
                    this.ctx2D.fillStyle = star.color;
                    this.ctx2D.globalAlpha = star.opacity;
                    this.ctx2D.fillRect(star.x, star.y, star.size, star.size);
                    
                    // Mover estrellas lentamente hacia abajo
                    star.y += star.speed;
                    if (star.y > this.canvas2D.height) {
                        star.y = 0;
                        star.x = Math.random() * this.canvas2D.width;
                    }
                }
                this.ctx2D.globalAlpha = 1.0;
            }
            
            // Dibujar jugador (solo si no está en pausa)
            if (!this.paused && this.player2D && this.player2D.visible) {
                this.ctx2D.fillStyle = this.player2D.color;
                this.ctx2D.fillRect(
                    this.player2D.x - this.player2D.width / 2,
                    this.player2D.y - this.player2D.height / 2,
                    this.player2D.width,
                    this.player2D.height
                );
                
                // Dibujar detalles del jugador
                this.ctx2D.fillStyle = '#8B4513'; // Marrón para cuerpo
                this.ctx2D.fillRect(
                    this.player2D.x - 20,
                    this.player2D.y - 10,
                    40,
                    30
                );
                
                // Dibujar espada
                this.ctx2D.fillStyle = '#C0C0C0'; // Plateado para espada
                this.ctx2D.fillRect(
                    this.player2D.x + 20,
                    this.player2D.y - 5,
                    20,
                    3
                );
                
                console.log('Jugador dibujado en:', this.player2D.x, this.player2D.y);
            }
            
            // Mostrar mensaje de pausa si está pausado
            if (this.paused) {
                this.ctx2D.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx2D.fillRect(0, 0, this.canvas2D.width, this.canvas2D.height);
                
                this.ctx2D.fillStyle = '#FFFFFF';
                this.ctx2D.font = 'bold 48px Arial';
                this.ctx2D.textAlign = 'center';
                this.ctx2D.fillText('PAUSA', this.canvas2D.width / 2, this.canvas2D.height / 2);
                
                this.ctx2D.font = '24px Arial';
                this.ctx2D.fillText('Presiona P para reanudar', this.canvas2D.width / 2, this.canvas2D.height / 2 + 50);
                
                this.ctx2D.textAlign = 'left'; // Restaurar alineación
            }
            
            // Dibujar texto de depuración
            this.ctx2D.fillStyle = 'white';
            this.ctx2D.font = '16px Arial';
            this.ctx2D.fillText('Canvas 2D Mode - Player Visible', 10, 30);
            this.ctx2D.fillText('Position: ' + Math.round(this.player2D.x) + ', ' + Math.round(this.player2D.y), 10, 50);
            this.ctx2D.fillText('Stars: ' + (this.stars ? this.stars.length : 0), 10, 70);
            this.ctx2D.fillText('Paused: ' + this.paused, 10, 90);
            
            // Continuar bucle
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    }
    
    createPlayer() {
        console.log('createPlayer llamado - usando Canvas 2D');
        // El jugador ya está creado en el constructor para Canvas 2D
    }
    
    setupKnightFrame(texture) {
        // Crear un canvas para extraer solo el primer frame
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Crear una imagen temporal para cargar el sprite sheet
        const img = new Image();
        img.onload = () => {
            console.log('Imagen cargada - Dimensiones:', img.width, 'x', img.height);
            
            // Dibujar un rectángulo rojo de depuración primero
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 32, 32);
            
            // Dibujar solo el primer frame (0,0,32,32)
            ctx.drawImage(img, 0, 0, 32, 32, 0, 0, 32, 32);
            
            console.log('Frame dibujado en canvas - Canvas dimensions:', canvas.width, 'x', canvas.height);
            
            // Crear nueva textura desde el canvas
            const frameTexture = new THREE.CanvasTexture(canvas);
            frameTexture.needsUpdate = true;
            
            // Aplicar la nueva textura al material
            if (this.player && this.player.material) {
                this.player.material.map = frameTexture;
                this.player.material.needsUpdate = true;
                console.log('Frame del knight configurado correctamente');
                console.log('Posición del jugador:', this.player.position.x, this.player.position.y);
            }
        };
        img.onerror = () => {
            console.error('Error cargando imagen para frame extraction');
            // Dibujar rectángulo rojo como fallback
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 32, 32);
            
            const frameTexture = new THREE.CanvasTexture(canvas);
            frameTexture.needsUpdate = true;
            
            if (this.player && this.player.material) {
                this.player.material.map = frameTexture;
                this.player.material.needsUpdate = true;
                console.log('Fallback de color rojo aplicado');
            }
        };
        img.src = 'img/knight_actions_spritesheet.png';
    }
    
    createKnightFallback() {
        // Intentar cargar el otro sprite sheet con material simple
        this.textureLoader.load('img/knight_spritesheet.png', 
            (texture) => {
                console.log('Knight_spritesheet.png cargado correctamente');
                
                const material = new THREE.SpriteMaterial({
                    map: texture,
                    transparent: true,
                    alphaTest: 0.1
                });

                this.player = new THREE.Sprite(material);
                this.player.position.y = 100; // Posición Y inicial
                this.player.position.x = 100; // Posición X inicial
                this.player.scale.set(2.0, 2.0, 1);
                this.player.visible = true;
                this.scene.add(this.player);
                
                console.log('Knight fallback creado:', this.player.position, 'Visible:', this.player.visible);
            },
            undefined,
            (error) => {
                console.error('Error cargando knight_spritesheet.png:', error);
                // Fallback final al warrior de color sólido
                this.createFallbackPlayer();
            }
        );
    }
    
    createHeraclesFromCanvas() {
        // Crear canvas para el GIF animado
        this.heraclesCanvas = document.createElement('canvas');
        const ctx = this.heraclesCanvas.getContext('2d');
        
        // Establecer tamaño del canvas
        this.heraclesCanvas.width = this.heraclesImg.width || 64;
        this.heraclesCanvas.height = this.heraclesImg.height || 64;
        
        // Dibujar la imagen en el canvas
        ctx.drawImage(this.heraclesImg, 0, 0);
        
        // Hacer el fondo transparente (eliminar colores de fondo)
        const imageData = ctx.getImageData(0, 0, this.heraclesCanvas.width, this.heraclesCanvas.height);
        const data = imageData.data;
        
        // Eliminar colores de fondo comunes (blanco, negro, colores claros, azul)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Si el píxel es de color de fondo (blanco, negro, gris claro o azul)
            if ((r > 200 && g > 200 && b > 200) || // Blanco o casi blanco
                (r < 50 && g < 50 && b < 50) ||      // Negro o casi negro
                (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10 && r > 100 && r < 150) || // Gris medio
                (b > 100 && b > r * 1.5 && b > g * 1.5) || // Azul predominante
                (b > 150 && r < 100 && g < 100)) { // Azul fuerte con poco rojo/verde
                // Hacerlo transparente
                data[i + 3] = 0; // Alpha = 0 (transparente)
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Crear textura desde el canvas
        const texture = new THREE.CanvasTexture(this.heraclesCanvas);
        texture.needsUpdate = true;
        
        // Crear sprite con la textura del canvas
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1 // Umbral de transparencia
        });

        this.player = new THREE.Sprite(material);
        this.player.position.y = this.config.groundLevel;
        this.player.position.x = 0;
        this.player.scale.set(2.0, 2.0, 1);
        this.player.visible = true;
        this.scene.add(this.player);
        
        console.log('Heracles desde canvas creado (sin fondo):', this.player.position, 'Visible:', this.player.visible);
        
        // Guardar referencias para animación
        this.heraclesTexture = texture;
        this.heraclesCtx = ctx;
        
        // Iniciar animación del GIF
        this.animateHeracles();
    }
    
    animateHeracles() {
        if (!this.heraclesCanvas || !this.heraclesCtx || !this.heraclesImg) return;
        
        // Redibujar el GIF en el canvas
        this.heraclesCtx.clearRect(0, 0, this.heraclesCanvas.width, this.heraclesCanvas.height);
        this.heraclesCtx.drawImage(this.heraclesImg, 0, 0);
        
        // Aplicar eliminación de fondo en cada frame
        const imageData = this.heraclesCtx.getImageData(0, 0, this.heraclesCanvas.width, this.heraclesCanvas.height);
        const data = imageData.data;
        
        // Eliminar colores de fondo comunes (blanco, negro, colores claros, azul)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Si el píxel es de color de fondo (blanco, negro, gris claro o azul)
            if ((r > 200 && g > 200 && b > 200) || // Blanco o casi blanco
                (r < 50 && g < 50 && b < 50) ||      // Negro o casi negro
                (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10 && r > 100 && r < 150) || // Gris medio
                (b > 100 && b > r * 1.5 && b > g * 1.5) || // Azul predominante
                (b > 150 && r < 100 && g < 100)) { // Azul fuerte con poco rojo/verde
                // Hacerlo transparente
                data[i + 3] = 0; // Alpha = 0 (transparente)
            }
        }
        
        this.heraclesCtx.putImageData(imageData, 0, 0);
        
        // Actualizar textura
        if (this.heraclesTexture) {
            this.heraclesTexture.needsUpdate = true;
        }
        
        // Continuar animación
        requestAnimationFrame(() => this.animateHeracles());
    }
    
    createFallbackPlayer() {
        console.log('Creando jugador fallback con knight_actions_spritesheet.png');
        
        // Usar el mismo sprite sheet pero con un frame diferente
        this.textureLoader.load('img/knight_actions_spritesheet.png', 
            (texture) => {
                console.log('Knight_actions_spritesheet.png cargado como fallback');
                
                const textureClone = texture.clone();
                textureClone.needsUpdate = true;
                textureClone.wrapS = THREE.RepeatWrapping;
                textureClone.wrapT = THREE.RepeatWrapping;
                
                // Usar un frame diferente para el fallback (frame de idle)
                const cols = 4;
                const rows = 4;
                textureClone.repeat.set(1 / cols, 1 / rows);
                textureClone.offset.set(0, 1 - (1 / rows)); // Primer frame idle
                
                const material = new THREE.SpriteMaterial({
                    map: textureClone,
                    transparent: true
                });

                this.player = new THREE.Sprite(material);
                this.player.position.y = this.config.groundLevel;
                this.player.position.x = 0;
                this.player.scale.set(2.0, 2.0, 1);
                this.player.visible = true;
                this.scene.add(this.player);
                
                console.log('Jugador fallback creado:', this.player.position, 'Visible:', this.player.visible);
            },
            undefined,
            (error) => {
                console.error('Error crítico: no se pudo cargar ningún sprite:', error);
                // Crear un sprite de color sólido como último recurso
                this.createSolidColorFallback();
            }
        );
    }
    
    createSolidColorFallback() {
        console.log('Creando jugador fallback de color sólido');
        
        // Crear un canvas con un rectángulo simple
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Dibujar un knight simple de color
        ctx.fillStyle = '#8B4513'; // Marrón medieval
        ctx.fillRect(8, 4, 16, 24); // Cuerpo
        ctx.fillStyle = '#FFD700'; // Dorado para detalles
        ctx.fillRect(10, 6, 12, 4); // Cabeza
        ctx.fillRect(12, 10, 8, 2); // Espada
        
        const texture = new THREE.CanvasTexture(canvas);
        
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });

        this.player = new THREE.Sprite(material);
        this.player.position.y = 100; // Posición Y inicial
        this.player.position.x = 100; // Posición X inicial
        this.player.scale.set(2.0, 2.0, 1);
        this.player.visible = true;
        this.scene.add(this.player);
        
        console.log('Jugador de color sólido creado:', this.player.position, 'Visible:', this.player.visible);
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
        console.log('Creando starfield para Canvas 2D...');
        
        // Crear estrellas para Canvas 2D
        this.stars = [];
        const layerConfigs = [
            { count: 100, size: 1, speed: 0.5, color: '#8b4513' }, // marrón oscuro
            { count: 150, size: 2, speed: 1.0, color: '#d2691e' }, // marrón medio
            { count: 200, size: 3, speed: 2.0, color: '#ffd700' }  // dorado
        ];

        for (const cfg of layerConfigs) {
            for (let i = 0; i < cfg.count; i++) {
                this.stars.push({
                    x: Math.random() * this.canvas2D.width,
                    y: Math.random() * this.canvas2D.height,
                    size: cfg.size,
                    speed: cfg.speed,
                    color: cfg.color,
                    opacity: Math.random() * 0.5 + 0.5
                });
            }
        }
        
        console.log('Starfield creado - Total estrellas:', this.stars.length);
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
            console.log('Tecla presionada:', e.code);
            
            // Pausa el juego con la tecla P
            if (e.code === 'KeyP') {
                console.log('Tecla P detectada - llamando a togglePause()');
                this.togglePause();
            }
            
            // Ataque especial (cambio de disparo por ataque)
            if (e.code === 'KeyF' && !this.paused && !this.gameOver) {
                this.performAttack();
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
        console.log('togglePause() llamado - paused actual:', this.paused);
        this.paused = !this.paused;
        console.log('togglePause() - nuevo estado paused:', this.paused);
        
        if (this.paused) {
            // Mostrar mensaje de pausa
            console.log('Juego pausado');
            // Opcional: mostrar UI de pausa
            const pauseBanner = document.getElementById('pause-banner');
            if (pauseBanner) {
                pauseBanner.textContent = 'PAUSA';
                pauseBanner.classList.remove('hidden');
            }
        } else {
            // Ocultar mensaje de pausa
            console.log('Juego reanudado');
            const pauseBanner = document.getElementById('pause-banner');
            if (pauseBanner) {
                pauseBanner.classList.add('hidden');
            }
        }
    }
    
    updatePlayer(deltaTime) {
        // No mover al jugador si está pausado
        if (this.paused) return;
        
        // No mover al jugador si no está visible (está en respawn)
        if (!this.player || !this.player.visible) return;
        
        // Movimiento horizontal
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.playerVelocity.x = -this.config.playerSpeed;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.playerVelocity.x = this.config.playerSpeed;
        } else {
            this.playerVelocity.x *= 0.8; // Fricción
        }
        
        // Salto (solo si está en el suelo)
        if ((this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space']) && this.isGrounded && !this.isJumping) {
            this.playerVelocity.y = this.config.jumpPower;
            this.isJumping = true;
            this.isGrounded = false;
        }
        
        // Agacharse
        this.isDucking = (this.keys['ArrowDown'] || this.keys['KeyS']) && this.isGrounded;
        
        // Aplicar gravedad
        if (!this.isGrounded) {
            this.playerVelocity.y -= this.config.gravity;
        }
        
        // Actualizar posición
        this.player.position.x += this.playerVelocity.x * deltaTime * 60;
        this.player.position.y += this.playerVelocity.y * deltaTime * 60;
        
        // Verificar suelo
        if (this.player.position.y <= this.config.groundLevel) {
            this.player.position.y = this.config.groundLevel;
            this.playerVelocity.y = 0;
            this.isGrounded = true;
            this.isJumping = false;
        }
        
        // Límites horizontales
        const maxX = this.config.playfieldHalfWidth;
        const minX = -this.config.playfieldHalfWidth;
        this.player.position.x = Math.max(minX, Math.min(maxX, this.player.position.x));
        
        // Ajustar sprite según estado
        if (this.isDucking) {
            this.player.scale.y = 1.0; // Reducir altura al agacharse
            this.player.scale.x = 2.0;
        } else {
            this.player.scale.y = 2.0; // Altura normal
            this.player.scale.x = 2.0;
        }
        
        // Efecto de inclinación al moverse
        if (Math.abs(this.playerVelocity.x) > 0.1) {
            this.player.rotation.z = Math.max(-0.2, Math.min(0.2, -this.playerVelocity.x * 0.3));
        } else {
            this.player.rotation.z *= 0.9; // Volver a posición neutral
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
    
    performAttack() {
        if (!this.player || !this.player.visible) return;
        
        const now = Date.now();
        if (this.lastArrowTime && (now - this.lastArrowTime < this.arrowCooldown)) return;
        this.lastArrowTime = now;
        
        // Crear efecto de ataque (golpe)
        const attackRange = 2.0;
        const attackWidth = 1.5;
        
        // Verificar si hay enemigos en rango de ataque
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const distance = Math.abs(enemy.position.x - this.player.position.x);
            const verticalDistance = Math.abs(enemy.position.y - this.player.position.y);
            
            if (distance < attackRange && verticalDistance < attackWidth) {
                // Eliminar enemigo
                this.scene.remove(enemy);
                this.enemies.splice(i, 1);
                
                // Spawn de nuevos enemigos
                this.spawnNextEnemyBatch();
                
                // Actualizar puntuación
                this.score += this.config.pointsPerEnemy;
                document.getElementById('score').textContent = this.score;
                
                // Crear efecto de impacto
                this.createAttackEffect(enemy.position);
                
                // Verificar si el jugador ganó
                if (this.isWaveCleared()) {
                    this.levelComplete();
                }
                
                break; // Solo atacar a un enemigo a la vez
            }
        }
    }
    
    createAttackEffect(position) {
        // Crear efecto visual de ataque
        const effectMaterial = new THREE.SpriteMaterial({
            color: 0xffd700, // Dorado
            transparent: true,
            opacity: 0.8
        });
        const effect = new THREE.Sprite(effectMaterial);
        effect.position.copy(position);
        effect.scale.set(1.5, 1.5, 1);
        this.scene.add(effect);
        
        // Animar y eliminar efecto
        let scale = 1.5;
        const animate = () => {
            scale += 0.1;
            effect.scale.set(scale, scale, 1);
            effect.material.opacity -= 0.05;
            
            if (effect.material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(effect);
            }
        };
        animate();
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
            // En Canvas 2D no spawnemos enemigos
            console.log('Canvas 2D mode - no enemy spawning');
            return;
        }

        // En Canvas 2D solo mostramos el banner
        banner.textContent = `HORDA ${this.wave}`;
        banner.classList.remove('hidden');

        // Ocultar banner después de 3 segundos
        setTimeout(() => {
            banner.classList.add('hidden');
        }, 3000);
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
    
    start() {
        console.log('Iniciando juego...');
        
        // En Canvas 2D no necesitamos limpiar escena
        this.enemies = [];
        this.arrows = [];
        
        // Resetear estado del juego
        this.score = 0;
        this.level = 1;
        this.wave = 1;
        this.lives = this.config.playerLives;
        this.gameOver = false;
        this.paused = false;
        
        // Resetear jugador
        this.player2D.x = this.config.width / 2;
        this.player2D.y = this.config.height / 2;
        this.player2D.visible = true;
        
        console.log('Juego iniciado - Canvas 2D mode');
        // No llamamos a this.animate() porque ya está corriendo animate2D()
    }
    
    stop() {
        // En Canvas 2D no necesitamos detener animación especial
        console.log('Juego detenido');
    }
}
