//the screen after game

document.addEventListener('DOMContentLoaded', () => {
    const status = localStorage.getItem('status');
    const savedTime = localStorage.getItem('elapsed_time');
    const level = localStorage.getItem('selected_level') || '1';
    const bestTime = getBestTimeForLevel(level) || '99:99';

    const statusElement = document.getElementById('status');
    const commentElement = document.getElementById('comment');
    const fullImage = document.getElementById('full');
    const deadImage = document.getElementById('dead');
    const body = document.body;
    const button = document.querySelector('button');

    fullImage.style.visibility = 'hidden';
    deadImage.style.visibility = 'hidden';

    if (status === 'win') { // user won
        body.style.backgroundColor = 'lightgreen';
        fullImage.style.visibility = 'visible';
        button.style.borderColor = 'green';
        button.style.color = 'green';
        statusElement.textContent = 'You win!';
        commentElement.textContent = bestTime;

        if (compareTimes(savedTime, bestTime) < 0) { // new record?
            commentElement.textContent = `Congrats! You set a new record - ${savedTime}!`;
            setBestTimeForLevel(level, savedTime);
        } else {
            commentElement.textContent = `Your time - ${savedTime} / Best time - ${bestTime}`;
        }

        statusElement.textContent = 'You won!';
    } else if (status === 'loss') { // user lost
        body.style.backgroundColor = 'lightcoral';
        deadImage.style.visibility = 'visible';
        button.style.borderColor = 'red';
        button.style.color = 'red';
        statusElement.textContent = 'You lost!';
        commentElement.textContent = 'Mike dead. A venomous spider bit him.';
    }
});

function getBestTimeForLevel(level) {
    return localStorage.getItem(`best_time_level_${level}`);
}

function setBestTimeForLevel(level, time) {
    localStorage.setItem(`best_time_level_${level}`, time);
}

function compareTimes(time1, time2) {
    const [minutes1, seconds1] = time1.split(':').map(Number);
    const [minutes2, seconds2] = time2.split(':').map(Number);
    return (minutes1 * 60 + seconds1) - (minutes2 * 60 + seconds2);
}
