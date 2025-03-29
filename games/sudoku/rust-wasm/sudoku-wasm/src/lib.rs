use wasm_bindgen::prelude::*;
use rand::seq::SliceRandom;
use js_sys::Array;
use js_sys::Date;

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
}

//UTILS

pub fn shuffle_array<T>(array: &mut Vec<T>) {
    let mut rng = rand::thread_rng();
    array.shuffle(&mut rng);
}

//CHECKS

pub fn check_rows(grid: &Vec<Vec<Vec<i32>>>, x: usize, y: usize, z: usize, num: i32) -> bool {
    for i in 0..grid.len() {
        if grid[i][y][z] == num || grid[x][i][z] == num || grid[x][y][i] == num {
            return false;
        }
    }
    true
}

pub fn check_box(grid: &Vec<Vec<Vec<i32>>>, x: usize, y: usize, z: usize, num: i32) -> bool {
    let x_start = (x / 3) * 3;
    let y_start = (y / 3) * 3;
    let z_start = (z / 3) * 3;

    for i in x_start..x_start + 3 {
        for j in y_start..y_start + 3 {
            for k in z_start..z_start + 3 {
                if grid[i][j][k] == num {
                    return false;
                }
            }
        }
    }
    true
}

pub fn can_put(grid: &Vec<Vec<Vec<i32>>>, x: usize, y: usize, z: usize, num: i32) -> bool {
    check_rows(grid, x, y, z, num) && check_box(grid, x, y, z, num)
}

pub fn has_empty_cell(grid: &Vec<Vec<Vec<i32>>>) -> bool {
    grid.iter().any(|layer| layer.iter().any(|row| row.contains(&-1)))
}

//GETTERS

pub fn get_nums(grid: &Vec<Vec<Vec<i32>>>, x: usize, y: usize, z: usize, shuffle: bool) -> Vec<i32> {
    let mut nums = Vec::new();
    for i in 1..=28 {
        if can_put(grid, x, y, z, i as i32) {
            nums.push(i as i32);
        }
    }

    if(shuffle) {shuffle_array(&mut nums);}
    nums
}

//GENERATION

pub fn solve_grid(grid: &mut Vec<Vec<Vec<i32>>>, start_time: f64, timeout: f64) -> Result<(Vec<Vec<Vec<i32>>>, bool), &'static str> {
    for x in 0..12 {
        for y in 0..12 {
            for z in 0..12 {
                if grid[x][y][z] == -1 {
                    
                    if Date::now() - start_time > timeout {
                        let percent = (x * 12) + (y * 12) + z;
                        let s = percent.to_string();
                        alert(&s);
                        return Err("Timeout");
                    }

                    let numbers = get_nums(grid, x, y, z, true);
                    for num in numbers {
                        if can_put(grid, x, y, z, num) {
                            grid[x][y][z] = num;
                            match solve_grid(grid, start_time, timeout) {
                                Ok((solved_grid, true)) => return Ok((solved_grid, true)),
                                Err(e) => return Err(e),
                                _ => (),
                            }
                            grid[x][y][z] = -1;

                        }
                    }
                    return Ok((grid.clone(), false));
                }
            }
        }
    }
    Ok((grid.clone(), true))
}

pub fn create_initial_grid() -> Vec<Vec<Vec<i32>>> {
    let mut grid: Vec<Vec<Vec<i32>>> = vec![vec![vec![-1; 12]; 12]; 12];

    for i in 0..4 {
        let mut numbers: Vec<i32> = (1..=28).map(|x| x as i32).collect();
        shuffle_array(&mut numbers);
        let box_row = i * 3;
        for x in 0..3 {
            for y in 0..3 {
                for z in 0..3 {
                    grid[box_row + x][box_row + y][box_row + z] = numbers[(z * 9) + (y * 3) + x];
                }
            }
        }
    }

    grid
}

pub fn get_grid() -> Vec<Vec<Vec<i32>>> {
    
    let timeout = 20000.0;

    loop {
        let mut grid = create_initial_grid();
        let start_time = Date::now();
        match solve_grid(&mut grid, start_time, timeout) {
            Ok((solved_grid, true)) => return solved_grid,
            _ => continue, // Retry on timeout or failure
        }
    }

}

#[wasm_bindgen]
pub fn generate_sudoku() -> Array {
    let grid = get_grid();
    
    let js_grid = Array::new();

    for row in grid {
        let js_row = Array::new();
        for value in row {
            js_row.push(&JsValue::from(value));
        }
        js_grid.push(&js_row);
    }

    js_grid
}