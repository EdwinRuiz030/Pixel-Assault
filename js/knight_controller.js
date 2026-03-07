class Knight {
    constructor() {
        this.spriteSheet = null;
        this.loaded = false;
        
        // Propiedades del sprite
        this.frameWidth = 32;
        this.frameHeight = 32;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameSpeed = 100; // ms por frame
        
        // Estados del personaje
        this.state = 'IDLE';
        this.direction = 1; // 1 = derecha, -1 = izquierda
        
        // Posición y física
        this.x = 0;
        this.y = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 3;
        this.jumpPower = 8;
        this.grounded = false;
        
        // Máquina de estados - configuración de animaciones
        this.animations = {
            IDLE: { row: 0, startFrame: 0, endFrame: 1, loop: true },
            WALK: { row: 0, startFrame: 2, endFrame: 5, loop: true },
            RUN: { row: 1, startFrame: 0, endFrame: 3, loop: true },
            JUMP: { row: 2, startFrame: 0, endFrame: 3, loop: false },
            CROUCH: { row: 2, startFrame: 4, endFrame: 5, loop: false },
            ATTACK: { row: 3, startFrame: 0, endFrame: 2, loop: false },
            CHANGE_WEAPON: { row: 4, startFrame: 0, endFrame: 1, loop: false },
            HURT: { row: 4, startFrame: 2, endFrame: 3, loop: false }
        };
        
        // Cargar sprite sheet
        this.loadSpriteSheet();
    }
    
    loadSpriteSheet() {
        this.spriteSheet = new Image();
        this.spriteSheet.onload = () => {
            this.loaded = true;
            console.log('Knight sprite sheet cargado correctamente');
        };
        this.spriteSheet.onerror = () => {
            console.error('Error cargando knight_actions_spritesheet.png');
        };
        this.spriteSheet.src = 'img/knight_actions_spritesheet.png';
    }
    
    update(input, deltaTime, groundLevel = 300) {
        if (!this.loaded) return;
        
        // Actualizar física
        this.updatePhysics(deltaTime, groundLevel);
        
        // Procesar entrada y cambiar estado
        this.handleInput(input);
        
        // Actualizar animación
        this.updateAnimation(deltaTime);
    }
    
    updatePhysics(deltaTime, groundLevel) {
        // Aplicar gravedad
        if (!this.grounded) {
            this.velocityY += 0.5; // Gravedad
        }
        
        // Actualizar posición
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Verificar suelo
        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.velocityY = 0;
            this.grounded = true;
            
            // Si estábamos saltando, cambiar a idle
            if (this.state === 'JUMP') {
                this.setState('IDLE');
            }
        } else {
            this.grounded = false;
        }
        
        // Fricción horizontal
        this.velocityX *= 0.8;
    }
    
    handleInput(input) {
        // No permitir cambios de estado durante ataque
        if (this.state === 'ATTACK' || this.state === 'HURT') return;
        
        let moving = false;
        
        // Movimiento horizontal
        if (input.left) {
            this.velocityX = -this.speed;
            this.direction = -1;
            moving = true;
        }
        if (input.right) {
            this.velocityX = this.speed;
            this.direction = 1;
            moving = true;
        }
        
        // Saltar
        if (input.jump && this.grounded) {
            this.velocityY = -this.jumpPower;
            this.grounded = false;
            this.setState('JUMP');
            return;
        }
        
        // Agacharse
        if (input.crouch && this.grounded) {
            this.setState('CROUCH');
            this.velocityX = 0;
            return;
        }
        
        // Atacar
        if (input.attack) {
            this.setState('ATTACK');
            this.velocityX = 0;
            return;
        }
        
        // Cambiar arma
        if (input.changeWeapon) {
            this.setState('CHANGE_WEAPON');
            this.velocityX = 0;
            return;
        }
        
        // Determinar estado de movimiento
        if (this.grounded) {
            if (moving) {
                // Correr si se mantiene shift
                this.setState(input.run ? 'RUN' : 'WALK');
            } else if (this.state !== 'IDLE') {
                this.setState('IDLE');
            }
        }
    }
    
    setState(newState) {
        if (this.state !== newState) {
            this.state = newState;
            this.currentFrame = this.animations[newState].startFrame;
            this.frameTimer = 0;
        }
    }
    
    updateAnimation(deltaTime) {
        const anim = this.animations[this.state];
        if (!anim) return;
        
        this.frameTimer += deltaTime;
        
        if (this.frameTimer >= this.frameSpeed) {
            this.frameTimer = 0;
            
            if (anim.loop) {
                this.currentFrame++;
                if (this.currentFrame > anim.endFrame) {
                    this.currentFrame = anim.startFrame;
                }
            } else {
                // Animación no loop
                if (this.currentFrame < anim.endFrame) {
                    this.currentFrame++;
                } else {
                    // Regresar a idle cuando termina la animación
                    if (this.state !== 'IDLE') {
                        this.setState('IDLE');
                    }
                }
            }
        }
    }
    
    draw(context, drawX, drawY) {
        if (!this.loaded) return;
        
        const anim = this.animations[this.state];
        if (!anim) return;
        
        // Calcular posición del frame en el sprite sheet
        const sx = this.currentFrame * this.frameWidth;
        const sy = anim.row * this.frameHeight;
        
        // Guardar estado del contexto
        context.save();
        
        // Si mira hacia la izquierda, invertir horizontalmente
        if (this.direction === -1) {
            context.translate(drawX + this.frameWidth, drawY);
            context.scale(-1, 1);
            drawX = 0;
            drawY = 0;
        } else {
            context.translate(drawX, drawY);
        }
        
        // Dibujar el frame
        context.drawImage(
            this.spriteSheet,
            sx, sy, this.frameWidth, this.frameHeight,
            drawX, drawY, this.frameWidth, this.frameHeight
        );
        
        // Restaurar estado del contexto
        context.restore();
    }
    
    // Métodos auxiliares
    isAttacking() {
        return this.state === 'ATTACK';
    }
    
    getAttackBox() {
        if (!this.isAttacking()) return null;
        
        return {
            x: this.x + (this.direction > 0 ? this.frameWidth : -20),
            y: this.y,
            width: 20,
            height: this.frameHeight
        };
    }
    
    takeDamage() {
        if (this.state !== 'HURT') {
            this.setState('HURT');
            this.velocityX = -this.direction * 5;
            this.velocityY = -3;
        }
    }
}

// Ejemplo de bucle de juego
class Game {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 600;
        document.body.appendChild(this.canvas);
        
        this.context = this.canvas.getContext('2d');
        this.knight = new Knight();
        
        this.input = {
            left: false,
            right: false,
            jump: false,
            crouch: false,
            attack: false,
            changeWeapon: false,
            run: false
        };
        
        this.lastTime = 0;
        this.setupControls();
        this.gameLoop(0);
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.input.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.input.right = true;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'Space':
                    this.input.jump = true;
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.input.crouch = true;
                    break;
                case 'Space':
                    this.input.attack = true;
                    e.preventDefault();
                    break;
                case 'KeyC':
                    this.input.changeWeapon = true;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.input.run = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.input.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.input.right = false;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'Space':
                    this.input.jump = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.input.crouch = false;
                    break;
                case 'Space':
                    this.input.attack = false;
                    break;
                case 'KeyC':
                    this.input.changeWeapon = false;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.input.run = false;
                    break;
            }
        });
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Limpiar canvas
        this.context.fillStyle = '#87CEEB'; // Cielo azul
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar suelo
        this.context.fillStyle = '#8B7355'; // Tierra
        this.context.fillRect(0, 400, this.canvas.width, 200);
        
        // Actualizar y dibujar knight
        this.knight.update(this.input, deltaTime, 400);
        this.knight.draw(this.context, 100, 400 - 32);
        
        // Mostrar información de depuración
        this.context.fillStyle = 'black';
        this.context.font = '14px Arial';
        this.context.fillText(`Estado: ${this.knight.state}`, 10, 20);
        this.context.fillText(`Frame: ${this.knight.currentFrame}`, 10, 40);
        this.context.fillText(`Dirección: ${this.knight.direction > 0 ? 'Derecha' : 'Izquierda'}`, 10, 60);
        this.context.fillText(`Posición: (${Math.round(this.knight.x)}, ${Math.round(this.knight.y)})`, 10, 80);
        
        // Continuar bucle
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Iniciar juego cuando se carga la página
// window.addEventListener('load', () => {
//     new Game();
// });
