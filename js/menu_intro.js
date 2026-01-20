// Animación del menú: nave viajando por el espacio

// Usamos Three.js global cargado en index.html

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('menu-canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
    });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 15;

    // Fondo de estrellas
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.08,
        transparent: true
    });

    const starsVertices = [];
    for (let i = 0; i < 800; i++) {
        const x = (Math.random() - 0.5) * 80;
        const y = (Math.random() - 0.5) * 40;
        const z = -Math.random() * 100;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Sprite de la nave
    const textureLoader = new THREE.TextureLoader();
    const shipTexture = textureLoader.load('img/player.png');
    const shipMaterial = new THREE.SpriteMaterial({
        map: shipTexture,
        transparent: true
    });
    const ship = new THREE.Sprite(shipMaterial);
    ship.scale.set(2, 1.5, 1);
    ship.position.set(0, -1, -5);
    scene.add(ship);

    // Ajustar tamaño del renderer
    function onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    onResize();
    window.addEventListener('resize', onResize);

    let startTime = performance.now();

    function animate(now) {
        requestAnimationFrame(animate);

        const t = (now - startTime) / 1000; // segundos

        // Mantener Z fija y mover solo en Y (arriba/abajo)
        ship.position.z = -5;

        // Movimiento vertical en onda senoidal
        ship.position.y = -1 + Math.sin(t * 2) * 1.2;

        // Ligeras oscilaciones de rotación
        ship.material.rotation = Math.sin(t * 1.5) * 0.12;

        // Desplazar las estrellas para simular viaje
        const positions = starsGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 2] += 0.5; // mover hacia la cámara
            if (positions[i + 2] > 0) {
                positions[i + 2] = -100; // reciclar estrella al fondo
            }
        }
        starsGeometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate(startTime);
});
