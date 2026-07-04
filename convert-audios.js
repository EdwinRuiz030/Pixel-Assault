const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const audiosDir = path.join(__dirname, 'audios');
const files = fs.readdirSync(audiosDir);

console.log('Archivos en la carpeta audios:', files);

let ffmpegPath;
try {
    ffmpegPath = require('ffmpeg-static');
} catch (e) {
    console.log('Instalando ffmpeg-static para la conversión de audio...');
    try {
        execSync('npm install ffmpeg-static', { stdio: 'inherit', cwd: __dirname });
        ffmpegPath = require('ffmpeg-static');
    } catch (npmError) {
        console.error('Error al instalar ffmpeg-static:', npmError);
        process.exit(1);
    }
}

console.log('Usando ffmpeg desde:', ffmpegPath);

files.forEach(file => {
    if (file.endsWith('.mp3')) {
        const mp3Path = path.join(audiosDir, file);
        const oggName = file.replace('.mp3', '.ogg');
        const oggPath = path.join(audiosDir, oggName);
        
        console.log(`Convirtiendo: "${file}" -> "${oggName}"`);
        try {
            // ffmpeg command to convert to ogg using libvorbis
            execSync(`"${ffmpegPath}" -y -i "${mp3Path}" -c:a libvorbis "${oggPath}"`, { stdio: 'inherit' });
            console.log(`¡Convertido con éxito!: ${oggName}`);
        } catch (err) {
            console.error(`Error al convertir "${file}":`, err);
        }
    }
});

console.log('Proceso de conversión finalizado.');
