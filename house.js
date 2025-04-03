let backgroundIMG;
let backlayer;
let frontlayer;

function preload() {
    backgroundIMG = loadImage('./assets/background.png');
    backlayer = loadImage('./assets/backlayer.png');
    frontlayer = loadImage('./assets/frontlayer.png');
}

function setup() {
    let container = document.getElementById('p5-container-2');
    let h = (container.clientWidth / 128) * 96

    let canvas = createCanvas(container.clientWidth, h);
    canvas.parent("p5-container-2");

    noSmooth()
}

function windowResized() {
    redraw();
}

function draw() {
    background(255);

    image(backgroundIMG, 0, 0, width, height);
    image(backlayer, 0, 0, width, height);
    image(frontlayer, 0, 0, width, height);

    updatePixels();
}