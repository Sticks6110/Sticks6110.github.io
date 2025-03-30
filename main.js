let worldMap;
let sunImg;
let moonImg;
let issImg;

function preload() {
    sunImg = loadImage('./assets/Sun.png');
    worldMap = loadImage('./assets/Map.png');
    issImg = loadImage('./assets/ISS.png');

    const t = new Date();
    const utcTime = new Date(t.toUTCString());
    
    moonImg = loadImage('./assets/' + getMoonPhase(utcTime).name + '.png');

    print("Assets loaded");
}

function setup() {
    let container = document.getElementById("p5-container");
    let canvas = createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent("p5-container");
    textSize(16);
    textAlign(CENTER, CENTER);
    textFont('Departure');
    windowResized();
    noLoop()
}

function windowResized() {
    let container = document.getElementById("p5-container");
    resizeCanvas(container.offsetWidth, container.offsetHeight);
    redraw();
}

function toJulian(date) {
    return date / 86400000 + 2440587.5;
}

function degToRad(deg) {
    return deg * (Math.PI / 180);
}

function radToDeg(rad) {
    return rad * (180 / Math.PI);
}

function normalizeAngle(angle) {
    return (angle % 360 + 360) % 360;
}

function mercatorToPixel(lon, lat, width, height) {
    const normalizedX = (lon / 360) + 0.5;
    const latRad = degToRad(lat);
    const mercatorY = Math.asinh(Math.tan(latRad)) / (2 * Math.PI);
    const normalizedY = 0.5 - mercatorY;
    const x = normalizedX * width;
    const y = normalizedY * height;
    return { x, y };
}

function pixelToMercator(x, y, width, height) {
    const normalizedX = x / width - 0.5;
    const normalizedY = 0.5 - y / height;

    const longitude = normalizedX * 360;
    const latitude = (Math.atan(Math.sinh(Math.PI * 2 * normalizedY)) * 180) / Math.PI;

    return { longitude, latitude };
}

function latLonToMercator(latitude, longitude) {
    const R = 6378137;
    const x = longitude * Math.PI / 180 * R;
    const y = Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI / 360))) * R;

    return { x, y };
}

function calculateSubsolarPoint(dateTimeUTC) {
    const julianDate = toJulian(dateTimeUTC);
    const daysSinceJ2000 = julianDate - 2451545.0;

    const meanLongitude = normalizeAngle(280.460 + 0.9856474 * daysSinceJ2000);
    const meanAnomaly = normalizeAngle(357.528 + 0.9856003 * daysSinceJ2000);

    const eclipticLongitude = normalizeAngle(
        meanLongitude + 1.915 * Math.sin(degToRad(meanAnomaly)) +
        0.020 * Math.sin(degToRad(2 * meanAnomaly))
    );

    const obliquity = 23.439 - 0.0000004 * daysSinceJ2000;
    const declination = radToDeg(
        Math.asin(Math.sin(degToRad(obliquity)) * Math.sin(degToRad(eclipticLongitude)))
    );

    const gst = normalizeAngle(280.46061837 + 360.98564736629 * daysSinceJ2000);
    let subsolarLon = eclipticLongitude - gst;
    subsolarLon = normalizeAngle(subsolarLon);
    subsolarLon = subsolarLon > 180 ? subsolarLon - 360 : subsolarLon;

    return { latitude: declination, longitude: subsolarLon };
}

function calculateMoonPosition(dateUTC) {
    // Reference: Astronomical Algorithms by Jean Meeus
    const jd = toJulian(dateUTC);
    const T = (jd - 2451545.0) / 36525.0;

    const Lp = normalizeAngle(218.316 + 481267.8813 * T); // Mean longitude
    const D = normalizeAngle(297.850 + 445267.1115 * T);  // Mean elongation
    const M = normalizeAngle(357.528 + 35999.050 * T);     // Sun's mean anomaly
    const Mp = normalizeAngle(134.963 + 477198.8676 * T); // Moon's mean anomaly
    const F = normalizeAngle(93.272 + 483202.0175 * T);   // Moon's argument of latitude

    const longitude = Lp + 6.289 * Math.sin(degToRad(Mp)) 
        + 1.274 * Math.sin(degToRad(2*D - Mp)) 
        + 0.658 * Math.sin(degToRad(2*D));

    const latitude = 5.128 * Math.sin(degToRad(F)) 
        + 0.280 * Math.sin(degToRad(Mp + F)) 
        + 0.277 * Math.sin(degToRad(Mp - F));

    const obliquity = 23.439 - 0.0000004 * (jd - 2451545);
    const ra = Math.atan2(
        Math.sin(degToRad(longitude)) * Math.cos(degToRad(obliquity)) - 
        Math.tan(degToRad(latitude)) * Math.sin(degToRad(obliquity)),
        Math.cos(degToRad(longitude))
    );
    
    const dec = Math.asin(
        Math.sin(degToRad(latitude)) * Math.cos(degToRad(obliquity)) + 
        Math.cos(degToRad(latitude)) * Math.sin(degToRad(obliquity)) * 
        Math.sin(degToRad(longitude))
    );

    return {
        ra: normalizeAngle(radToDeg(ra)),
        dec: radToDeg(dec),
        longitude: normalizeAngle(longitude),
        latitude: latitude
    };
}

function getSublunarPoint(dateUTC) {
    const moon = calculateMoonPosition(dateUTC);
    const GST = normalizeAngle(280.46061837 + 360.98564736629 * (toJulian(dateUTC) - 2451545.0));
    
    return {
        latitude: moon.dec,
        longitude: normalizeAngle(moon.ra - GST)
    };
}

function isNight(longitude, latitude, dateTimeUTC) {
    const julianDate = toJulian(dateTimeUTC);
    const daysSinceJ2000 = julianDate - 2451545.0;

    const meanLongitude = normalizeAngle(280.460 + 0.9856474 * daysSinceJ2000);
    const meanAnomaly = normalizeAngle(357.528 + 0.9856003 * daysSinceJ2000);

    const eclipticLongitude = normalizeAngle(
        meanLongitude + 1.915 * Math.sin(degToRad(meanAnomaly)) +
        0.020 * Math.sin(degToRad(2 * meanAnomaly))
    );

    const obliquity = 23.439 - 0.0000004 * daysSinceJ2000;
    const declination = radToDeg(
        Math.asin(Math.sin(degToRad(obliquity)) * Math.sin(degToRad(eclipticLongitude))
    ));

    const gst = normalizeAngle(280.46061837 + 360.98564736629 * daysSinceJ2000);
    const lst = normalizeAngle(gst + longitude);
    const hourAngle = normalizeAngle(lst - eclipticLongitude);

    const solarAltitude = radToDeg(
        Math.asin(
            Math.sin(degToRad(latitude)) * Math.sin(degToRad(declination)) +
            Math.cos(degToRad(latitude)) * Math.cos(degToRad(declination)) * Math.cos(degToRad(hourAngle))
        )
    );

    return solarAltitude < 0;
}

function getDayOfWeek(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

function drawTerminatorLabels(utcTime, subsolar) {
    const baseLat = subsolar.latitude > 0 ? 75 : -75;
    const eastLon = subsolar.longitude + 90;
    const westLon = subsolar.longitude - 90;

    const eastLonNorm = ((eastLon + 180) % 360) - 180;
    const westLonNorm = ((westLon + 180) % 360) - 180;

    const eastDate = new Date(utcTime.getTime() + (eastLonNorm / 15) * 3600000);
    const westDate = new Date(utcTime.getTime() + (westLonNorm / 15) * 3600000);
    
    const eastPos = mercatorToPixel(eastLonNorm, baseLat, width, height);
    const westPos = mercatorToPixel(westLonNorm, baseLat, width, height);

    if (eastPos.x < width && eastPos.x > 0) {
        drawDayLabel(eastPos.x + 30, eastPos.y, getDayOfWeek(eastDate));
    }
    if (westPos.x < width && westPos.x > 0) {
        drawDayLabel(westPos.x - 30, westPos.y, getDayOfWeek(westDate));
    }
}

function drawDayLabel(x, y, dayName) {
    fill(0, 0, 0, 180);
    noStroke();
    rectMode(CENTER);
    const w = textWidth(dayName) + 20;
    rect(x, y, w, 24, 4);
    
    fill(255);
    text(dayName, x, y);
}

function getMoonPhase(dateUTC) {
    const sunPos = calculateSubsolarPoint(dateUTC);
    const moonPos = calculateMoonPosition(dateUTC);
    
    const sunLon = sunPos.longitude;
    const moonLon = moonPos.longitude;
    const moonLat = moonPos.latitude;
    
    const elongation = Math.atan2(
        Math.sin(degToRad(moonLon - sunLon)) * Math.cos(degToRad(moonLat)),
        Math.cos(degToRad(sunLon)) * Math.sin(degToRad(moonLat)) - 
        Math.sin(degToRad(sunLon)) * Math.cos(degToRad(moonLat)) * 
        Math.cos(degToRad(moonLon - sunLon))
    );
    
    const phaseAngle = radToDeg(elongation);
    const illumination = 0.5 * (1 + Math.cos(degToRad(phaseAngle)));

    const phase = () => {
        const normalized = (phaseAngle + 360) % 360;
        if (normalized < 22.5) return "NM";
        if (normalized < 67.5) return "WXC";
        if (normalized < 112.5) return "FC";
        if (normalized < 157.5) return "WXG";
        if (normalized < 202.5) return "FM";
        if (normalized < 247.5) return "WNG";
        if (normalized < 292.5) return "TC";
        return "WNC";
    };

    const posAngle = Math.atan2(
        Math.cos(degToRad(sunPos.latitude)) * Math.sin(degToRad(sunLon - moonLon)),
        Math.sin(degToRad(sunPos.latitude)) * Math.cos(degToRad(moonPos.latitude)) - 
        Math.cos(degToRad(sunPos.latitude)) * Math.sin(degToRad(moonPos.latitude)) * 
        Math.cos(degToRad(sunLon - moonLon))
    );

    return {
        name: phase(),
        illumination: illumination,
        rotation: radToDeg(posAngle) + 180,
        angle: phaseAngle
    };
}

function draw() {
    background(0);
    image(worldMap, 0, 0, width, height);

    const t = new Date();
    const utcTime = new Date(t.toUTCString());

    const subsolar = calculateSubsolarPoint(utcTime);
    const pos = mercatorToPixel(subsolar.longitude, subsolar.latitude, width, height);
    const sunSize = 20;
    image(sunImg, pos.x - sunSize/2, pos.y - sunSize/2, sunSize, sunSize);

    const sublunar = getSublunarPoint(utcTime);
    const moonPos = mercatorToPixel(sublunar.longitude, sublunar.latitude, width, height);
    const moonSize = 15;
    image(moonImg, moonPos.x - moonSize/2, moonPos.y - moonSize/2, moonSize, moonSize);

    drawTerminatorLabels(utcTime, subsolar);

    loadPixels();
    const d = pixelDensity();

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const coord = pixelToMercator(x, y, width, height);
            const lon = coord.longitude;
            const lat = coord.latitude;
            const night = isNight(lon, lat, utcTime);

            if (night) {
                let index = 4 * d * (y * d * width + x);
                pixels[index] *= 0.3;
                pixels[index + 1] *= 0.3;
                pixels[index + 2] *= 0.3;
            }
        }
    }

    updatePixels();
}

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