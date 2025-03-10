use wasm_bindgen::prelude::*;
use rand::seq::SliceRandom;
use rand::Rng;
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

pub fn check_box(grid: &Vec<Vec<Vec<i32>>>, x: usize, y: usize, z: usize, num: i32, base: usize) -> bool {
    let x_start = (x / base) * base;
    let y_start = (y / base) * base;
    let z_start = (z / base) * base;

    for i in x_start..x_start + base {
        for j in y_start..y_start + base {
            for k in z_start..z_start + base {
                if grid[i][j][k] == num {
                    return false;
                }
            }
        }
    }
    true
}

pub fn can_put(grid: &Vec<Vec<Vec<i32>>>, x: usize, y: usize, z: usize, num: i32, base: usize) -> bool {
    check_rows(grid, x, y, z, num) && check_box(grid, x, y, z, num, base)
}

pub fn has_empty_cell(grid: &Vec<Vec<Vec<i32>>>) -> bool {
    grid.iter().any(|layer| layer.iter().any(|row| row.contains(&-1)))
}

//GETTERS

pub fn get_nums(grid: &Vec<Vec<Vec<i32>>>, x: usize, y: usize, z: usize, base: usize, shuffle: bool) -> Vec<i32> {
    let mut nums = Vec::new();
    for i in 1..=base * base * base {
        if can_put(grid, x, y, z, i as i32, base) {
            nums.push(i as i32)
        }
    }

    if(shuffle) {shuffle_array(&mut nums);}
    nums
}

//GENERATION

pub fn solve_grid(grid: &mut Vec<Vec<Vec<i32>>>, base: usize, start_time: f64, timeout: f64) -> Result<(Vec<Vec<Vec<i32>>>, bool), &'static str> {
    for x in 0..base * base {
        for y in 0..base * base {
            for z in 0..base * base {
                if grid[x][y][z] == -1 {

                    if Date::now() - start_time > timeout {
                        return Err("Timeout");
                    }

                    let numbers = get_nums(grid, x, y, z, base, true);
                    for num in numbers {
                        if can_put(grid, x, y, z, num, base) {
                            grid[x][y][z] = num;
                            match solve_grid(grid, base, start_time, timeout) {
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

pub fn create_initial_grid(base: usize) -> Vec<Vec<Vec<i32>>> {
    let size = base * base;
    let mut grid: Vec<Vec<Vec<i32>>> = vec![vec![vec![-1; size]; size]; size];

    for i in 0..base {
        let mut numbers: Vec<i32> = (1..=base*base*base).map(|x| x as i32).collect();
        shuffle_array(&mut numbers);
        let box_row = i * base;
        for x in 0..base {
            for y in 0..base {
                for z in 0..base {
                    grid[box_row + x][box_row + y][box_row + z] = numbers[(z * base * base) + (y * base) + x];
                }
            }
        }
    }

    grid
}

pub fn get_grid(base: usize) -> Vec<Vec<Vec<i32>>> {
    
    let timeout = 3000.0;

    loop {
        let mut grid = create_initial_grid(base);
        let start_time = Date::now();
        match solve_grid(&mut grid, base, start_time, timeout) {
            Ok((solved_grid, true)) => return solved_grid,
            _ => continue, // Retry on timeout or failure
        }
    }

}

#[wasm_bindgen]
pub fn generate_sudoku(base: usize) -> Array {
    let grid = get_grid(base);
    
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

#[wasm_bindgen]
pub fn get_potential(flat_array: &[i32], width: usize, height: usize, depth: usize, base: usize) -> Array {

    let mut grid = vec![vec![vec![0; depth]; height]; width];

    for i in 0..width {
        for j in 0..height {
            for k in 0..depth {
                let index = i * height * depth + j * depth + k;
                grid[i][j][k] = flat_array[index];
            }
        }
    }

    let mut potential = vec![vec![vec![vec![0; base * base * base]; depth]; height]; width];

    for i in 0..width {
        for j in 0..height {
            for k in 0..depth {
                potential[i][j][k] = get_nums(&grid, i, j, k, base, false)
            }
        }
    }

    let js_grid = Array::new();

    for row in potential {
        let js_row = Array::new();
        for column in row {
            let js_col = Array::new();
            for value in column {
                js_row.push(&JsValue::from(value));
            }
        }
        js_grid.push(&js_row);
    }

    js_grid
}