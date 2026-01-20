import { Game } from './game.js';

// Manejador de pantallas
document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const menuScreen = document.getElementById('menu');
    const gameScreen = document.getElementById('game');
    const controlsScreen = document.getElementById('controls');
    const gameOverScreen = document.getElementById('game-over');
    
    // Botones
    const startBtn = document.getElementById('start-btn');
    const controlsBtn = document.getElementById('controls-btn');
    const backToMenuBtn = document.getElementById('back-to-menu');
    const playAgainBtn = document.getElementById('play-again');
    const mainMenuBtn = document.getElementById('main-menu');
    
    // Inicialización del juego
    let game;
    
    // Función para mostrar una pantalla específica
    function showScreen(screen) {
        // Ocultar todas las pantallas
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        // Mostrar la pantalla solicitada
        document.getElementById(screen).classList.remove('hidden');
        
        // Inicializar el juego cuando se muestra la pantalla de juego
        if (screen === 'game') {
            // Si el juego ya existe, reiniciarlo
            if (game) {
                game.stop();
            }
            // Crear nueva instancia del juego
            game = new Game();
            game.start();
        }
    }
    
    // Manejadores de eventos
    startBtn.addEventListener('click', () => showScreen('game'));
    controlsBtn.addEventListener('click', () => showScreen('controls'));
    backToMenuBtn.addEventListener('click', () => showScreen('menu'));
    playAgainBtn.addEventListener('click', () => showScreen('game'));
    mainMenuBtn.addEventListener('click', () => showScreen('menu'));
    
    // Mostrar el menú principal al cargar la página
    showScreen('menu');
});
