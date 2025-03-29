export let scene, camera, renderer, group, ui_group, boxes = {};

function createSudokuCube() {
    group = new THREE.Group();

    const geometry = new THREE.BoxGeometry();

    for (let x = 0; x < 12; x++) {
        for (let y = 0; y < 12; y++) {
            for (let z = 0; z < 12; z++) {
                const material = new THREE.MeshPhongMaterial({ color: 0x38b764 });
                material.transparent = true
                let cube = new THREE.Mesh(geometry, material);
                cube.position.x = x - 4.5
                cube.position.y = y - 4.5
                cube.position.z = z - 4.5

                boxes[[x, y, z]] = cube

                group.add(cube)
            }
            
        }
        
    }
    
    scene.add(group);

}

export function initThreeJS() {
    scene = new THREE.Scene();
    
    const aspectRatio = window.innerWidth / 2 / window.innerHeight;
    const frustumSize = 25; //CHANGE THIS TO MAKE VIEW AREA LARGER OR SMALLER
    const near = 0.1;
    const far = 1000;

    const left = -frustumSize * aspectRatio / 2;
    const right = frustumSize * aspectRatio / 2;
    const top = frustumSize / 2;
    const bottom = -frustumSize / 2;

    camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(window.innerWidth / 2, window.innerHeight);
    renderer.setClearColor(0x28282e, 1)
    document.getElementById('three-container').appendChild(renderer.domElement);

    createSudokuCube()

    group.rotation.x = 0.785398
    group.rotation.y = 0.785398
    group.rotation.z = 3.14159

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(10, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.z = 15;
}

export function animate() {
    requestAnimationFrame(animate);
   /* group.rotation.x += 0.01;
    group.rotation.y += 0.01;*/
    renderer.render(scene, camera);
}

export function onWindowResize() {
    // Update Three.js
    camera.aspect = (window.innerWidth / 2) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth / 2, window.innerHeight);

    // Update p5.js canvases
    document.querySelectorAll('.p5-container').forEach(container => {
        const canvas = container.querySelector('canvas');
        if (canvas) {
            const p5Inst = canvas.elt.p5Instance;
            p5Inst.resizeCanvas(container.offsetWidth, container.offsetHeight);
        }
    });
}