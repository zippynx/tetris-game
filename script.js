const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const startBtn = document.getElementById('startBtn');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30; 

let board = [];
let score = 0;
let level = 1;
let linesCleared = 0;
let gameInterval;
let dropCounter = 0;
let dropInterval = 1000; 
let lastTime = 0;
let isGameOver = false;
let isPlaying = false;

const COLORS = [
    null,
    '#0ff', 
    '#00f', 
    '#f80', 
    '#ff0', 
    '#0f0', 
    '#a0f', 
    '#f00'  
];

const PIECES = [
    [],
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
    [[2,0,0], [2,2,2], [0,0,0]],                 // J
    [[0,0,3], [3,3,3], [0,0,0]],                 // L
    [[4,4], [4,4]],                              // O
    [[0,5,5], [5,5,0], [0,0,0]],                 // S
    [[0,6,0], [6,6,6], [0,0,0]],                 // T
    [[7,7,0], [0,7,7], [0,0,0]]                  // Z
];

let player = {
    pos: { x: 0, y: 0 },
    matrix: null
};

function createBoard(r, c) {
    const b = [];
    for (let i = 0; i < r; i++) {
        b.push(new Array(c).fill(0));
    }
    return b;
}

function drawBlock(x, y, colorIndex) {
    ctx.fillStyle = '#000';
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    ctx.strokeStyle = COLORS[colorIndex];
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS[colorIndex];
    
    ctx.strokeRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

    ctx.shadowBlur = 0;
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(x + offset.x, y + offset.y, value);
            }
        });
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(board, { x: 0, y: 0 }); 
    if (player.matrix) {
        drawMatrix(player.matrix, player.pos);
    }
}

function collide(b, p) {
    const m = p.matrix;
    const o = p.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (b[y + o.y] && b[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(b, p) {
    p.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                b[y + p.pos.y][x + p.pos.x] = value;
            }
        });
    });
}

function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = board.length - 1; y >= 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) continue outer;
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        rowCount++;
    }

    if (rowCount > 0) {
        const lineScores = [0, 40, 100, 300, 1200];
        score += lineScores[rowCount] * level;
        linesCleared += rowCount;
        scoreElement.innerText = score;
        linesElement.innerText = linesCleared;

        if (linesCleared >= level * 10) {
            level++;
            levelElement.innerText = level;
            dropInterval = Math.max(100, 1000 - (level - 1) * 60); 
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir); 
            player.pos.x = pos;
            return;
        }
    }
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    const type = pieces[Math.floor(Math.random() * pieces.length)];
    const id = pieces.indexOf(type) + 1;
    
    player.matrix = PIECES[id].map(row => [...row]); 
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);

    if (collide(board, player)) {
        isGameOver = true;
        isPlaying = false;
        alert(`GAME OVER! Score kamu: ${score}`);
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        playerReset();
        arenaSweep();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(board, player)) {
        player.pos.x -= dir;
    }
}

function update(time = 0) {
    if (!isPlaying) return;

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    if (!isPlaying) return;

    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) { 
        playerMove(1);
    } else if (event.keyCode === 40) { 
        playerDrop();
    } else if (event.keyCode === 38) { 
        playerRotate(1);
    }
});

startBtn.addEventListener('click', () => {
    board = createBoard(ROWS, COLS);
    score = 0;
    level = 1;
    linesCleared = 0;
    dropInterval = 1000;
    isGameOver = false;
    isPlaying = true;
    
    scoreElement.innerText = score;
    levelElement.innerText = level;
    linesElement.innerText = linesCleared;
    
    playerReset();
    lastTime = performance.now();
    update();
});
 