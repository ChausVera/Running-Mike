const canvas = document.getElementById("field");
const whiteMouse = document.getElementById("w");
const blackMouse = document.getElementById("bl");
const brownMouse = document.getElementById("br");
const startButton = document.getElementById("start");
const click = document.getElementById("click");
const level1 = document.getElementById("level1");
const level2 = document.getElementById("level2");
const soundsButton = document.getElementById('sounds');
const images = [brownMouse, blackMouse, whiteMouse];
let currentIndex = 0;

var c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function updateImages() {
    images.forEach((img, index) => {
        img.style.display = index === currentIndex ? "block" : "none";
    });
}

function playClickSound() {
    if (soundsButton.classList.contains('checked')) {
        click.load();
        click.play();
    }
}

document.querySelector('.arrow-left').addEventListener('click', () => {
    currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
    updateImages();
    playClickSound();
});

document.querySelector('.arrow-right').addEventListener('click', () => {
    currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
    updateImages();
    playClickSound();
});

startButton.addEventListener('click', () => {
    const selectedLevel = document.querySelector('input[name="level"]:checked').value;
    let mouseColor;
    switch (currentIndex) {
        case 0:
            mouseColor = 'brown';
            break;
        case 1:
            mouseColor = 'black';
            break;
        case 2:
            mouseColor = 'white';
            break;
    }

    localStorage.setItem('selected_level', selectedLevel);
    localStorage.setItem('mouse_color', mouseColor);
    playClickSound();
    window.location.href = `game.html`;
});

level1.addEventListener('click', () => {
    playClickSound();
});

level2.addEventListener('click', () => {
    playClickSound();
});

updateImages();

document.addEventListener('DOMContentLoaded', () => {
    const isChecked = localStorage.getItem('sounds_checked') === 'true';
    if (isChecked) {
        soundsButton.classList.add('checked');
    }
    soundsButton.addEventListener('click', () => {
        soundsButton.classList.toggle('checked');
        const currentlyChecked = soundsButton.classList.contains('checked');
        localStorage.setItem('sounds_checked', currentlyChecked);
        playClickSound();
    });
});
