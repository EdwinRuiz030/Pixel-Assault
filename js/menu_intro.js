// Animación del menú: nave viajando por el espacio con parallax

// Usamos Three.js global cargado en index.html

let scene, camera, renderer, ship, stars;
let animationId = null;
let state = 'idle'; // 'idle', 'entering', 'loop', 'exiting'
let stateStartTime = 0;
let exitCallback = null;

function init() {
    const canvas = document.getElementById('menu-canvas');
    if (!canvas) return;

    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
    });

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 15;

    // Fondo de estrellas mejorado
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.15,
        transparent: true,
        opacity: 0.8,
        vertexColors: true
    });

    const starsVertices = [];
    const starsColors = [];
    for (let i = 0; i < 1500; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 60;
        const z = -Math.random() * 150;
        starsVertices.push(x, y, z);
        
        // Colores variados para las estrellas
        const colorChoice = Math.random();
        if (colorChoice < 0.3) {
            starsColors.push(1, 1, 1); // blanco
        } else if (colorChoice < 0.5) {
            starsColors.push(0.7, 0.9, 1); // azul claro
        } else if (colorChoice < 0.7) {
            starsColors.push(1, 0.9, 0.7); // amarillo claro
        } else if (colorChoice < 0.85) {
            starsColors.push(1, 0.7, 0.9); // rosa claro
        } else {
            starsColors.push(0.8, 0.8, 1); // lavanda
        }
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));
    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Sprite de la nave mejorado
    const textureLoader = new THREE.TextureLoader();
    const shipTexture = textureLoader.load('img/player.png');
    const shipMaterial = new THREE.SpriteMaterial({
        map: shipTexture,
        transparent: true,
        opacity: 0.9,
        color: 0x00ffff
    });
    ship = new THREE.Sprite(shipMaterial);
    ship.scale.set(2.5, 1.8, 1);
    ship.position.set(-12, -2, 0); // empieza fuera de pantalla
    scene.add(ship);
    
    // Añadir un efecto de brillo alrededor de la nave
    const glowGeometry = new THREE.PlaneGeometry(4, 3);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const shipGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    shipGlow.position.copy(ship.position);
    shipGlow.position.z = -0.1;
    scene.add(shipGlow);
    
    // Guardar referencia para animación
    ship.glow = shipGlow;

    // Ajustar tamaño del renderer
    function onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    window.addEventListener('resize', onResize);

    startEntrance();
}

function startEntrance() {
    state = 'entering';
    stateStartTime = performance.now();
    ship.position.x = -12; // fuera a la izquierda
    ship.position.y = -2;
    ship.material.rotation = 0;
    animate(performance.now());
}

function startExit(callback) {
    state = 'exiting';
    stateStartTime = performance.now();
    exitCallback = callback;
}

function animate(now) {
    animationId = requestAnimationFrame(animate);

    const t = (now - stateStartTime) / 1000; // segundos desde el cambio de estado

    if (state === 'entering') {
        // Entrada con parallax mejorada: nave entra de izquierda a derecha con rotación y brillo
        const progress = Math.min(t / 2, 1); // 2 segundos para entrar
        ship.position.x = -12 + progress * 14; // de -12 a +2
        ship.position.y = -2 + Math.sin(progress * Math.PI) * 0.5;
        ship.material.rotation = Math.sin(progress * Math.PI) * 0.3;
        
        // Escala y brillo dinámicos
        const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
        ship.scale.set(2.5 * scale, 1.8 * scale, 1);
        ship.material.opacity = 0.5 + progress * 0.4;
        
        // Animar el brillo
        if (ship.glow) {
            ship.glow.position.copy(ship.position);
            ship.glow.position.z = -0.1;
            ship.glow.material.opacity = 0.1 + progress * 0.3;
            const glowScale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;
            ship.glow.scale.set(glowScale, glowScale, 1);
        }

        if (progress >= 1) {
            state = 'loop';
            stateStartTime = now;
        }
    } else if (state === 'exiting') {
        // Salida con parallax mejorada: nave sale hacia la derecha con rotación y brillo
        const progress = Math.min(t / 1.5, 1); // 1.5 segundos para salir
        ship.position.x = 2 + progress * 14; // de +2 a +16
        ship.position.y = -2 + Math.sin(progress * Math.PI) * 1;
        ship.material.rotation = Math.sin(progress * Math.PI) * -0.4;
        
        // Desvanecimiento al salir
        ship.material.opacity = 0.9 * (1 - progress);
        const scale = 1 + (1 - progress) * 0.2;
        ship.scale.set(2.5 * scale, 1.8 * scale, 1);
        
        // Animar el brillo al salir
        if (ship.glow) {
            ship.glow.position.copy(ship.position);
            ship.glow.position.z = -0.1;
            ship.glow.material.opacity = 0.4 * (1 - progress);
        }

        if (progress >= 1) {
            stop();
            if (exitCallback) exitCallback();
            return;
        }
    } else { // loop
        const loopT = (now - stateStartTime) / 1000;
        // Movimiento suave en bucle con efectos mejorados
        const range = 2;
        ship.position.x = -range + (loopT * 1.5) % (2 * range);
        ship.position.y = -2 + Math.sin(loopT * 2) * 0.8;
        ship.material.rotation = Math.sin(loopT * 1.5) * 0.15;
        
        // Escala sutil en bucle
        const scale = 1 + Math.sin(loopT * 3) * 0.05;
        ship.scale.set(2.5 * scale, 1.8 * scale, 1);
        
        // Brillo pulsante en bucle
        if (ship.glow) {
            ship.glow.position.copy(ship.position);
            ship.glow.position.z = -0.1;
            ship.glow.material.opacity = 0.2 + Math.sin(loopT * 4) * 0.1;
            const glowScale = 1 + Math.sin(loopT * 2) * 0.05;
            ship.glow.scale.set(glowScale, glowScale, 1);
        }
    }

    // Desplazar las estrellas para simular viaje con parallax mejorado
    const positions = stars.geometry.attributes.position.array;
    const colors = stars.geometry.attributes.color.array;
    const time = now * 0.001;
    
    for (let i = 0; i < positions.length; i += 3) {
        // Velocidad variable según la profundidad para efecto parallax
        const depth = positions[i + 2];
        const speed = 0.3 + (depth + 150) / 150 * 0.8; // estrellas lejanas más lentas
        
        positions[i + 2] += speed;
        
        // Efecto de brillo intermitente
        const brightness = 0.5 + Math.sin(time * 2 + i * 0.01) * 0.5;
        colors[i] *= brightness;
        colors[i + 1] *= brightness;
        colors[i + 2] *= brightness;
        
        if (positions[i + 2] > 0) {
            positions[i + 2] = -150;
            // Reiniciar color al volver a posición inicial
            const colorChoice = Math.random();
            if (colorChoice < 0.3) {
                colors[i] = 1; colors[i + 1] = 1; colors[i + 2] = 1;
            } else if (colorChoice < 0.5) {
                colors[i] = 0.7; colors[i + 1] = 0.9; colors[i + 2] = 1;
            } else if (colorChoice < 0.7) {
                colors[i] = 1; colors[i + 1] = 0.9; colors[i + 2] = 0.7;
            } else if (colorChoice < 0.85) {
                colors[i] = 1; colors[i + 1] = 0.7; colors[i + 2] = 0.9;
            } else {
                colors[i] = 0.8; colors[i + 1] = 0.8; colors[i + 2] = 1;
            }
        }
    }
    stars.geometry.attributes.position.needsUpdate = true;
    stars.geometry.attributes.color.needsUpdate = true;

    renderer.render(scene, camera);
}

function stop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// Exponer funciones para que main.js las use
window.MenuIntro = {
    start: init,
    startExit,
    stop
};

document.addEventListener('DOMContentLoaded', () => {
    init();
});
