let colon = true;

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let period = hours >= 12 ? ' PM' : ' AM';

    hours = hours % 12 || 12;
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;

    let timeString = colon ? `${hours} ${minutes}` : `${hours}:${minutes}`;
    timeString += period;

    colon = !colon;
    document.getElementById('time').textContent = timeString;
}

setInterval(updateClock, 1000);
updateClock();