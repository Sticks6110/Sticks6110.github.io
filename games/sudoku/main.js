import { initThreeJS, animate, onWindowResize, boxes } from './render.js';
import { createP5Canvases } from './sketch.js';

// Initialize everything
window.addEventListener('load', () => {
    initThreeJS();
    createP5Canvases();
    animate();
    window.addEventListener('resize', onWindowResize);
});