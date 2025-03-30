let worldMap;
let sunImg;
function preload() {
  sunImg = loadImage('')
  worldMap = loadImage(''); 
}

function setup() {
  createCanvas(800, 800);
  noLoop();
}

function pixelToMercator(x, y, width, height) {
    const normalizedX = x / width - 0.5;
    const normalizedY = 0.5 - y / height;

    const longitude = normalizedX * 360;
    const latitude = (Math.atan(Math.sinh(Math.PI * 2 * normalizedY)) * 180) / Math.PI;

    return { longitude, latitude };
}

function isNight(longitude, latitude, dateTimeUTC) {
    // Convert date to Julian date
    function toJulian(date) {
        return date / 86400000 + 2440587.5;
    }

    // Convert degrees to radians
    function degToRad(deg) {
        return deg * (Math.PI / 180);
    }

    // Convert radians to degrees
    function radToDeg(rad) {
        return rad * (180 / Math.PI);
    }

    // Normalize an angle to the range [0, 360]
    function normalizeAngle(angle) {
        return (angle % 360 + 360) % 360;
    }

    // Compute Julian date from UTC time
    const julianDate = toJulian(dateTimeUTC);
    const daysSinceJ2000 = julianDate - 2451545.0; // J2000 epoch = Jan 1, 2000

    // Mean longitude of the Sun (degrees)
    const meanLongitude = normalizeAngle(280.460 + 0.9856474 * daysSinceJ2000);

    // Mean anomaly of the Sun (degrees)
    const meanAnomaly = normalizeAngle(357.528 + 0.9856003 * daysSinceJ2000);

    // Ecliptic longitude of the Sun (degrees)
    const eclipticLongitude = normalizeAngle(
        meanLongitude + 1.915 * Math.sin(degToRad(meanAnomaly)) +
        0.020 * Math.sin(degToRad(2 * meanAnomaly))
    );

    // Sun's declination (degrees)
    const obliquity = 23.439 - 0.0000004 * daysSinceJ2000; // Earth's axial tilt
    const declination = radToDeg(
        Math.asin(Math.sin(degToRad(obliquity)) * Math.sin(degToRad(eclipticLongitude)))
    );

    // Calculate Local Sidereal Time (LST)
    const gst = normalizeAngle(280.46061837 + 360.98564736629 * daysSinceJ2000); // Greenwich Sidereal Time
    const lst = normalizeAngle(gst + longitude); // Local Sidereal Time

    // Calculate Hour Angle (HA)
    const hourAngle = normalizeAngle(lst - eclipticLongitude);

    // Calculate Solar Altitude (Elevation)
    const solarAltitude = radToDeg(
        Math.asin(
            Math.sin(degToRad(latitude)) * Math.sin(degToRad(declination)) +
            Math.cos(degToRad(latitude)) * Math.cos(degToRad(declination)) * Math.cos(degToRad(hourAngle))
        )
    );

    // Determine if it's night
    return solarAltitude < 0; // Night if Sun is below horizon
}

function draw() {
  background(0);
  image(worldMap, 0, 0, width, height);

  loadPixels(); // Load pixel data into the pixels[] array
  const d = pixelDensity();

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      // Convert pixel coordinates to Mercator coordinates
      const coord = pixelToMercator(x, y, width, height);  // Use width, height for scaling
      const lon = coord.longitude;
      const lat = coord.latitude;

      const t = new Date();  // current local time
      const utcTime = new Date(t.toUTCString());  // Convert to UTC time

      // Check if the location is at night
      const night = isNight(lon, lat, utcTime);

      if (night) {
        // Calculate the pixel index
        let index = 4 * d*(y * d*width + x);

        // Darken the pixel color (multiply by 0.3 to reduce brightness)
        pixels[index] *= 0.3;     // Red channel
        pixels[index + 1] *= 0.3; // Green channel
        pixels[index + 2] *= 0.3; // Blue channel
      }
    }
  }

  updatePixels(); // Apply the updated pixel data to the canvas
}
