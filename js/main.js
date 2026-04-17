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
    
    // Música del menú
    const menuMusic = new Audio('songs/Arrival_at_the_Citadel.mp3');
    menuMusic.loop = true;
    let musicStarted = false;

    // Función para intentar reproducir la música
    const startMenuMusic = () => {
        if (!musicStarted) {
            menuMusic.play()
                .then(() => {
                    musicStarted = true;
                })
                .catch(e => {
                    console.log('Autoplay bloqueado. Esperando interacción del usuario...');
                });
        }
    };
    
    // Función para mostrar una pantalla específica
    function showScreen(screen) {
        // Ocultar todas las pantallas
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        // Mostrar la pantalla solicitada
        document.getElementById(screen).classList.remove('hidden');
        
        // Manejar música según la pantalla
        if (screen === 'menu' || screen === 'controls') {
            startMenuMusic();
        } else {
            menuMusic.pause();
            musicStarted = false; // Resetear para que pueda volver a sonar al regresar al menú
        }
        
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
    
    // Lógica de la Pantalla de Inicio (Splash Screen)
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        splashScreen.addEventListener('click', () => {
            splashScreen.classList.add('fade-out');
            startMenuMusic();
            
            // Mostrar el menú principal después de la animación de fade-out
            setTimeout(() => {
                splashScreen.remove(); // Eliminar del DOM para limpiar
                showScreen('menu');
            }, 800);
        }, { once: true });
    }
    
    // Función para mostrar aviso de 'Próximamente'
    function showComingSoon() {
        // Crear el elemento si no existe
        let notice = document.querySelector('.coming-soon-notice');
        if (!notice) {
            notice = document.createElement('div');
            notice.className = 'coming-soon-notice';
            notice.innerHTML = `<div class="notice-content"><span>⚔️</span> PRÓXIMAMENTE <span>⚔️</span></div>`;
            document.body.appendChild(notice);
        }
        
        // Mostrar el aviso
        notice.classList.add('show');
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notice.classList.remove('show');
        }, 3000);
    }
    
    // Manejadores de eventos
    startBtn.addEventListener('click', () => showScreen('game'));
    showdownBtn.addEventListener('click', showComingSoon);
    controlsBtn.addEventListener('click', () => showScreen('controls'));
    backToMenuBtn.addEventListener('click', () => showScreen('menu'));
    playAgainBtn.addEventListener('click', () => showScreen('game'));
    mainMenuBtn.addEventListener('click', () => showScreen('menu'));
    
    
    // Quitamos el showScreen('menu') automático aquí, 
    // ahora se maneja al hacer clic en el splash-screen
    
    // Intentar reproducir música en la primera interacción (respaldo)
    document.addEventListener('click', startMenuMusic, { once: true });
});
