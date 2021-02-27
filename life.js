l = () => {
  if (l.on) return;
  l.on = 1;
  const BOUNDARY_CONDITION_WRAP = 'wrap';
  const DEFAULT_UPDATE_TIME = 50; //ms
  const MIN_CELL_SIZE = 10; //px
  const w = window.innerWidth,
    h = window.innerHeight,
    boundaryCondition = BOUNDARY_CONDITION_WRAP,
    ibs = `........................O
......................O.O
............OO......OO............OO
...........O...O....OO............OO
OO........O.....O...OO
OO........O...O.OO....O.O
..........O.....O.......O
...........O...O
............OO`, //https://www.conwaylife.com/patterns/gosperglidergun.cells
    t = DEFAULT_UPDATE_TIME,
    d = document,
    M = Math,
    A = Array,
    len = b => b.length,
    cellSize = MIN_CELL_SIZE,
    x = ~~(w / cellSize),
    y = ~~(h / cellSize);

  d.title = 'life';

  //TODO redraw on resize?
  //TODO handle user interactions? minimally: spacebar or longpress for pause/resume, click/tap to change value
  //TODO keep track of golfing and performance
  //TODO prevent laggy-ness
  /**
   * efficiency improvements:
   *  use list of all on cells for iterating to render next generation
   */

  //create board
  const makeBoardSvg = () => {
    const cENS = 'createElementNS',
      sA = 'setAttribute',
      NS = 'http://www.w3.org/2000/svg',
      board = d[cENS](NS, 'svg'),
      offX = (w - (x * cellSize))/2,
      offY = (h - (y * cellSize))/2,
      grid = [];
    board.style.position = 'fixed';
    board.style.top = 0;
    board.style.left = 0;
    board[sA]('width', w);
    board[sA]('height', h);
    board[sA]('viewBox', `${0 - offX} ${0 - offY} ${w} ${h}`);
    d.body.appendChild(board);
    for (let i = 0; i < x; i++) {
      grid.push([]);
      for (let j = 0; j < y; j++) {
        const cell = d[cENS](NS, 'path');
        cell[sA]('d',`M ${i*cellSize} ${j*cellSize} `
          + `L ${(i+1)*cellSize} ${j*cellSize} ${(i+1)*cellSize} ${(j+1)*cellSize} ${i*cellSize} ${(j+1)*cellSize} ${i*cellSize} ${j*cellSize}`);
        board.appendChild(cell);
        grid[i].push(cell);
      }
    }
    board.go = (i, j, value) => {
      const cell = grid[i][j];
      if (value !== cell.value) {
        cell.value = value;
        cell[sA]('style', `fill:#09c;stroke:#03c;stroke-width:1;fill-opacity:0.${value ? 9 : 1};stroke-opacity:0.9;`) //TODO simplify this
      }
    }
    return board;
  }

  const makeBoardCanvas = () => {
    const sA = 'setAttribute',
      board = d.createElement('canvas'),
      ctx = board.getContext('2d'),
      grid = A(y).fill().map(() => A(x));

    board.style.position = 'fixed';
    board.style.top = (h - (y * cellSize))/2 + 'px';
    board.style.left = (w - (x * cellSize))/2 + 'px';
    board[sA]('width', w);
    board[sA]('height', h);

    // TODO draw grid

    board.go = (i, j, value) => {
      if (value !== grid[i][j]) {
        grid[i][j] = value;
        ctx.fillStyle = `rgba(0,48,192,0.${value ? 9 : 1})`;
        ctx.clearRect(i*cellSize, j*cellSize, cellSize, cellSize);
        ctx.fillRect(i*cellSize, j*cellSize, cellSize, cellSize);
      }
    }
    d.body.appendChild(board);
    return board;
  }

  //interpret initial board state
  const interpretBoardString = (ibsString) => {
    const maxWidth = M.min(M.max(...ibsString.split('\n').map(len)), x),
      padWidth = ~~((x - maxWidth)/2),
      centerY = (a) => len(a) < y
        ? new A(~~((y - len(a))/2)).fill('').concat(a, new A(M.ceil((y - len(a))/2)).fill(''))
        : a,
      centerX = (a) => len(a) < x
        ? new A(padWidth).fill('.').concat(a, new A(x - len(a) - padWidth).fill('.'))
        : a;

    return centerY(ibsString.split('\n')).map(row=>centerX(row.split('')).map(cell => cell == 'O'))
  }

  // define conway rules
  const conway = (i, j, boardState) => {
    // rules https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
    const live = boardState[i][j];
    const rowBefore = (i + y - 1) % y,
      colBefore = (j + x - 1) % x,
      rowAfter = (i + 1) % y,
      colAfter = (j + 1) % x;
    let liveNeighborCount = len([
      boardState[rowBefore][colBefore], boardState[rowBefore][j], boardState[rowBefore][colAfter],
      boardState[i][colBefore]        ,                           boardState[i][colAfter],
      boardState[rowAfter][colBefore] , boardState[rowAfter][j] , boardState[rowAfter][colAfter]
    ].filter(v=>v));
    return live
      ? (liveNeighborCount == 2 || liveNeighborCount == 3)
      : liveNeighborCount == 3;
  }

  // set up the board and the board state
  // let board = location.search ? makeBoardSvg() : makeBoardCanvas(), boardState = interpretBoardString(ibs);
  let board = makeBoardCanvas(), boardState = interpretBoardString(ibs);
  // let board = makeBoardSvg(), boardState = interpretBoardString(ibs);

  // run the animation
  setInterval(() => {
    boardState = boardState.map((row, i)=>row.map((c,j) => conway(i,j, boardState)));;
    for (let i = 0; i < x; i++) {
      for (let j = 0; j < y; j++) {
        board.go(i, j, boardState[j][i]);
      }
    }
  }, t);
};