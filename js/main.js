import { Game } from './game.js';
import { ShowdownGame } from './showdown.js';
import { StoryMode } from './story.js';

// Manejador de pantallas
document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const menuScreen = document.getElementById('menu');
    const gameScreen = document.getElementById('game');
    const showdownScreen = document.getElementById('showdown');
    const controlsScreen = document.getElementById('controls');
    const gameOverScreen = document.getElementById('game-over');
    
    // Botones
    const startBtn = document.getElementById('start-btn');
    const showdownBtn = document.getElementById('showdown-btn');
    const controlsBtn = document.getElementById('controls-btn');
    const backToMenuBtn = document.getElementById('back-to-menu');
    const playAgainBtn = document.getElementById('play-again');
    const mainMenuBtn = document.getElementById('main-menu');
    
    // Inicialización del juego
    let game;
    let showdownGame;
    let storyMode;
    
    // Función para mostrar una pantalla específica
    function showScreen(screen) {
        // Ocultar todas las pantallas
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        // Mostrar la pantalla solicitada
        document.getElementById(screen).classList.remove('hidden');
        
        // Inicializar el juego cuando se muestra la pantalla de juego
        if (screen === 'game') {
            // Esperar un poco para asegurar que el DOM esté listo
            setTimeout(() => {
                // Si el juego ya existe, reiniciarlo
                if (game) {
                    game.stop();
                }
                if (storyMode) {
                    storyMode.stop();
                }
                // Crear nueva instancia del modo historia
                storyMode = new StoryMode();
                if (storyMode.canvas && storyMode.ctx) {
                    storyMode.start();
                }
            }, 100);
        }
        
        // Inicializar el juego Showdown cuando se muestra esa pantalla
        if (screen === 'showdown') {
            // Si el juego showdown ya existe, reiniciarlo
            if (showdownGame) {
                showdownGame.stop();
            }
            // Crear nueva instancia del juego showdown
            showdownGame = new ShowdownGame();
        }
    }
    
    // Manejadores de eventos
    startBtn.addEventListener('click', () => showScreen('game'));
    showdownBtn.addEventListener('click', () => showScreen('showdown'));
    controlsBtn.addEventListener('click', () => showScreen('controls'));
    backToMenuBtn.addEventListener('click', () => showScreen('menu'));
    playAgainBtn.addEventListener('click', () => showScreen('game'));
    mainMenuBtn.addEventListener('click', () => showScreen('menu'));
    
    // Mostrar el menú principal al cargar la página
    showScreen('menu');
});
