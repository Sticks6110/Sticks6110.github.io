import { boxes } from "./render.js";
import init, { generate_sudoku, get_potential } from './rust-wasm/sudoku-wasm/pkg/sudoku_wasm.js'

export let mouse_highlights = [[], [], [], [], [], [], [], [], []], mouse_highlights_nums = [[], [], [], [], [], [], [], [], []], mouse_selection = [], mismatches = [[], [], [], [], [], [], [], [], []]

let unsubmitted = ""

const number_keys = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

let changed_highlights_3d = false
let handled_movement = false

function drawGrid(p, spacing) {
    p.stroke(244, 244, 244);

    for (let x = 1; x < 9; x++) {
        p.strokeWeight(1);
        p.line(x*spacing, 0, x*spacing, p.height);
    }

    for (let y = 1; y < 9; y++) {
        p.strokeWeight(1);
        p.line(0, y*spacing, p.width, y*spacing);
    }

    for (let x = 0; x < 4; x++) {
        p.strokeWeight(4);
        p.line(x*(spacing*3), 0, x*(spacing*3), p.height);
    }

    for (let y = 0; y < 4; y++) {
        p.strokeWeight(4);
        p.line(0, y*(spacing*3), p.width, y*(spacing*3));
    }
}

function drawHighlights(p, i, spacing) {
    if(changed_highlights_3d) {
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                boxes[[x, y, i]].material.opacity = 0;
                boxes[[x, y, i]].material.color.setHex(0x38b764);
            }
        }
    }
    

    p.strokeWeight(2);
    p.fill(65, 166, 246);
    mouse_highlights_nums[i].forEach(pos => {
        p.rect(pos[0] * spacing, pos[1] * spacing, spacing, spacing)
        if(changed_highlights_3d) {
            boxes[[pos[0], pos[1], i]].material.opacity = 0.5;
            boxes[[pos[0], pos[1], i]].material.color.setHex(0x41a6f6);
        }
    });

    p.fill(56, 183, 100);
    mouse_highlights[i].forEach(pos => {
        p.rect(pos[0] * spacing, pos[1] * spacing, spacing, spacing)
        if(changed_highlights_3d) boxes[[pos[0], pos[1], i]].material.opacity = 1;
    });

    p.fill(255, 205, 117);
    if(mouse_selection[2] == i) {
        p.rect(mouse_selection[0] * spacing, mouse_selection[1] * spacing, spacing, spacing)
    }

    p.fill(177, 62, 83);
    mismatches[i].forEach(pos => {
        p.rect(pos[0] * spacing, pos[1] * spacing, spacing, spacing)
    })

    p.fill(26, 28, 44);

    if(i == 8) changed_highlights_3d = false
}

function drawNumbers2D(p, i, spacing) {
    if(window.sudoku == null) return;
    p.fill(244, 244, 244);
    p.strokeWeight(0);
    for (let x = 0; x < 9; x++) {
        for (let y = 0; y < 9; y++) {
            if(window.sudoku[x][y][i] != -1) {
                p.fill(244, 244, 244);
                p.text(window.sudoku[x][y][i], (spacing/2)+x*spacing, (spacing/2)+y*spacing);
            }
            else if(window.player_game[x][y][i] != -1) {
                p.fill(115, 239, 247)
                p.text(window.player_game[x][y][i], (spacing/2)+x*spacing, (spacing/2)+y*spacing);
            }
        }
    }

    p.fill(244, 244, 244);
    p.strokeWeight(0);

    if(i === mouse_selection[2] && mouse_selection.length > 0) {
        p.fill(86, 108, 134);
        p.text(unsubmitted, (spacing/2)+mouse_selection[0]*spacing, (spacing/2)+mouse_selection[1]*spacing);
    }
}

function getHighlightsForPoint(pos) {
    let box_x = Math.floor(pos[0] / 3) * 3
    let box_y = Math.floor(pos[1] / 3) * 3
    let box_z = Math.floor(pos[2] / 3) * 3
    let box_pos = [box_x, box_y, box_z]
    
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                mouse_highlights[box_pos[2] + z].push([box_pos[0] + x, box_pos[1] + y])
            }
        }
    }

    if(window.sudoku[pos[0]][pos[1]][pos[2]] != -1) {
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                for (let z = 0; z < 9; z++) {
                    if(window.sudoku[x][y][z] === window.sudoku[pos[0]][pos[1]][pos[2]]) {
                        mouse_highlights_nums[z].push([x, y])
                    }
                }
            }
            
        }
    }

    for (let i = 0; i < 9; i++) {
        mouse_highlights[i].push([pos[0], pos[1]])
        mouse_highlights[pos[2]].push([pos[0], i])
        mouse_highlights[pos[2]].push([i, pos[1]])
    }
}

function findMismatches() {
    mismatches = [[], [], [], [], [], [], [], [], []]
    for (let x = 0; x < 9; x++) {
        for (let y = 0; y < 9; y++) {
            for (let z = 0; z < 9; z++) {
                if(window.finished_sudoku[x][y][z] != window.player_game[x][y][z] && window.player_game[x][y][z] != -1) mismatches[z].push([x, y])
            }
        }
    }
}

function removePercentBoxes(grid, percent) {
    let num = 9 * 9 * 9
    let per = Math.floor(num * percent)

    while(per > 0) {
        let x = Math.floor(Math.random() * 9)
        let y = Math.floor(Math.random() * 9)
        let z = Math.floor(Math.random() * 9)

        if(grid[x][y][z] !== -1) {
            grid[x][y][z] = -1;
            per--;
        }

    }

    return grid

}

export function createP5Canvases() {
    for (let i = 1; i <= 9; i++) {
        new p5((p) => {
            let spacing = 25;
            
            p.setup = () => {
                const container = document.getElementById(`p5-${i}`);
                const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
                spacing = container.clientWidth / 9
                canvas.parent(`p5-${i}`);
                p.noStroke();
                p.textSize((16/25)*spacing);
                p.textAlign(p.CENTER, p.CENTER);
            };

            p.draw = () => {
                if(i == 1) {
                    handled_movement = false
                }
                p.background(26, 28, 44);
                drawHighlights(p, i-1, spacing)
                drawNumbers2D(p, i-1, spacing)
                drawGrid(p, spacing)
            };

            p.mouseClicked = () => {
                let x = Math.floor(p.mouseX / spacing)
                let y = Math.floor(p.mouseY / spacing)
                if(x < 9 && y < 9 && x >= 0 && y >= 0) {
                    mouse_highlights = [[], [], [], [], [], [], [], [], []]
                    mouse_highlights_nums = [[], [], [], [], [], [], [], [], []]

                    if(mouse_selection != [x, y, i-1]) unsubmitted = ""

                    mouse_selection = [x, y, i-1]
                    getHighlightsForPoint(mouse_selection)
                    changed_highlights_3d = true
                }
            }

            p.keyPressed = () => {
                if(mouse_selection[2] + 1 === i) {
                    if(window.player_game[mouse_selection[0]][mouse_selection[1]][mouse_selection[2]] === -1) {

                        if (number_keys.includes(parseInt(p.key))) {
                            if(mouse_selection.length > 0) {
                                unsubmitted += p.key
                            }
                        }   

                        if (p.keyCode === p.ENTER) {
                            if(mouse_selection.length > 0) {
                                if(window.sudoku[mouse_selection[0]][mouse_selection[1]][i-1] === -1) {
                                    window.player_game[mouse_selection[0]][mouse_selection[1]][i-1] = parseInt(unsubmitted)
                                    unsubmitted = ""
                                    findMismatches()
                                }
                            }
                        }
                    }
                    
                    if (p.keyCode === p.BACKSPACE) {
                        if(mouse_selection.length > 0 && window.sudoku[mouse_selection[0]][mouse_selection[1]][i-1] === -1) {
                            unsubmitted = ""
                            window.player_game[mouse_selection[0]][mouse_selection[1]][i-1] = -1
                            findMismatches()
                        }
                    }

                    //DONT LOOK AT THE CODE BELOW
                    if (p.keyCode === p.DOWN_ARROW) {
                        if(handled_movement === true) return;
                        if(mouse_selection.length > 0) {
                            mouse_selection[1] = mouse_selection[1] + 1
                            if(mouse_selection[1] > 8) {
                                mouse_selection[1] = 0
                                mouse_selection[2] = mouse_selection[2] + 1
                                if(mouse_selection[2] > 8) {
                                    mouse_selection[2] = 0
                                }
                            }
                        }

                        mouse_highlights = [[], [], [], [], [], [], [], [], []]
                        mouse_highlights_nums = [[], [], [], [], [], [], [], [], []]
                        unsubmitted = ""
                        handled_movement = true

                        getHighlightsForPoint(mouse_selection)
                        changed_highlights_3d = true
                    } else if (p.keyCode === p.UP_ARROW) {
                        if(handled_movement === true) return;
                        if(mouse_selection.length > 0) {
                            mouse_selection[1] = mouse_selection[1] - 1
                            if(mouse_selection[1] < 0) {
                                mouse_selection[1] = 8
                                mouse_selection[2] = mouse_selection[2] - 1
                                if(mouse_selection[2] < 0) {
                                    mouse_selection[2] = 8
                                }
                            }
                        }

                        mouse_highlights = [[], [], [], [], [], [], [], [], []]
                        mouse_highlights_nums = [[], [], [], [], [], [], [], [], []]
                        unsubmitted = ""
                        handled_movement = true

                        getHighlightsForPoint(mouse_selection)
                        changed_highlights_3d = true
                    } else if (p.keyCode === p.LEFT_ARROW) {
                        if(handled_movement === true) return;
                        if(mouse_selection.length > 0) {
                            mouse_selection[0] = mouse_selection[0] - 1
                            if(mouse_selection[0] < 0) {
                                mouse_selection[0] = 8
                                mouse_selection[2] = mouse_selection[2] - 1
                                if(mouse_selection[2] < 0) {
                                    mouse_selection[2] = 8
                                }
                            }
                        }

                        mouse_highlights = [[], [], [], [], [], [], [], [], []]
                        mouse_highlights_nums = [[], [], [], [], [], [], [], [], []]
                        unsubmitted = ""
                        handled_movement = true

                        getHighlightsForPoint(mouse_selection)
                        changed_highlights_3d = true
                    } else if (p.keyCode === p.RIGHT_ARROW) {
                        if(handled_movement === true) return;
                        if(mouse_selection.length > 0) {
                            mouse_selection[0] = mouse_selection[0] + 1
                            if(mouse_selection[0] > 8) {
                                mouse_selection[0] = 0
                                mouse_selection[2] = mouse_selection[2] + 1
                                if(mouse_selection[2] > 8) {
                                    mouse_selection[2] = 0
                                }
                            }
                        }

                        mouse_highlights = [[], [], [], [], [], [], [], [], []]
                        mouse_highlights_nums = [[], [], [], [], [], [], [], [], []]
                        unsubmitted = ""
                        handled_movement = true

                        getHighlightsForPoint(mouse_selection)
                        changed_highlights_3d = true
                    }


                    console.log(mouse_selection)
                }
            }

        }, document.createElement('div'));
    }
}

async function run() {
    await init();
    window.finished_sudoku = generate_sudoku(3)
    window.sudoku = removePercentBoxes(structuredClone(window.finished_sudoku), 0.5)
    window.player_game = structuredClone(window.sudoku)
}

run();