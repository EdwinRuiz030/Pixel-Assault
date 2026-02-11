// Animación del menú: caballero viajando por el reino medieval

// Usamos Three.js global cargado en index.html

let scene, camera, renderer, knight, particles;
let animationId = null;
let state = 'idle'; // 'idle', 'entering', 'loop', 'exiting'
let stateStartTime = 0;
let exitCallback = null;

function init() {
    const canvas = document.getElementById('menu-canvas');
    if (!canvas) return;

    // Verificar si existe el video y activar la clase
    const video = document.getElementById('video-background');
    if (video) {
        console.log('Video encontrado:', video.src);
        
        video.addEventListener('loadeddata', () => {
            console.log('Video cargado correctamente');
            document.getElementById('menu').classList.add('has-video');
            // Forzar reproducción
            video.play().catch(e => console.log('Error al reproducir video:', e));
        });
        
        video.addEventListener('error', (e) => {
            console.log('Error al cargar video:', e);
            console.log('Usando imagen de fondo como fallback');
        });
        
        // Intentar reproducir inmediatamente
        video.play().catch(e => console.log('Error inicial al reproducir video:', e));
    } else {
        console.log('No se encontró el elemento video');
    }

    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        premultipliedAlpha: false
    });

    scene = new THREE.Scene();
    // Hacer el fondo transparente para que se vea el video
    scene.background = null;

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 15;

    // No crear partículas ni caballero - solo video de fondo
    
    // Ajustar tamaño del renderer
    function onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    window.addEventListener('resize', onResize);

    // Iniciar animación simple (solo para mantener el canvas activo)
    animate();
}

function startEntrance() {
    state = 'entering';
    stateStartTime = performance.now();
    knight.position.x = -12; // fuera a la izquierda
    knight.position.y = -2;
    knight.material.rotation = 0;
    animate(performance.now());
}

function startExit(callback) {
    state = 'exiting';
    stateStartTime = performance.now();
    exitCallback = callback;
}

function animate(time = 0) {
    animationId = requestAnimationFrame(animate);
    
    // Renderizar escena vacía (solo para mantener el canvas transparente)
    renderer.render(scene, camera);
}

function startEntrance() {
    // No hacer nada - no hay caballero que animar
}

function startExit(callback) {
    // No hacer nada - no hay caballero que animar
    if (callback) callback();
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
