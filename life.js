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
    cENS = 'createElementNS',
    sA = 'setAttribute',
    NS = 'http://www.w3.org/2000/svg',
    cellSize = MIN_CELL_SIZE,
    x = M.floor(w / cellSize),
    y = M.floor(h / cellSize);

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
    const board =
      d[cENS](NS, 'svg'), 
      offX = (w - (x * cellSize))/2,
      offY = (h - (y * cellSize))/2,
      grid = [];
    board.style.position = 'absolute';
    board.style.top = 0;
    board.style.left = 0;
    board[sA]('width', w);
    board[sA]('height', h);
    board[sA]('viewBox', `${0 - offX} ${0 - offY} ${w} ${h}`);
    d.getElementsByTagName('body')[0].appendChild(board);
    for (let i = 0; i < x; i++) {
      grid.push([]);
      for (let j = 0; j < y; j++) {
        const cell = d[cENS](NS, 'path'); //Create a path in board's namespace
        cell[sA]('d',`M ${i*cellSize} ${j*cellSize} `
          + `L ${(i+1)*cellSize} ${j*cellSize} ${(i+1)*cellSize} ${(j+1)*cellSize} ${i*cellSize} ${(j+1)*cellSize} ${i*cellSize} ${j*cellSize}`); //Set path's data
        board.appendChild(cell);
        grid[i].push(cell);
      }
    }
    board.n = (i, j, value) => {
      const cell = grid[i][j];
      if (value !== cell.value) {
        cell.value = value;
        cell[sA]('style', `fill:blue;stroke:pink;stroke-width:1;fill-opacity:0.${value ? 9 : 1};stroke-opacity:0.9;`) //TODO simplify this
      }
    }
    return board;
  }

  const board = makeBoardSvg();

  //interpret ibs
  const bs = (ibsString) => {
    const maxWidth = M.min(M.max(...ibsString.split('\n').map(row => row.length)), x);
    const padWidth = M.floor((x - maxWidth)/2);

    const centerY = (a,l, fillVal) => a.length < l
      ? new A(M.floor((l - a.length)/2)).fill(fillVal).concat(a, new A(M.ceil((l - a.length)/2)).fill(fillVal))
      : a;
    const centerX = (a, fillVal) => a.length < x
      ? new A(padWidth).fill(fillVal).concat(a, new A(x - a.length - padWidth).fill(fillVal))
      : a;

    return centerY(ibsString.split('\n'), y, '').map(row=>centerX(row.split(''), '.').map(cell => cell === 'O'))
  }

  const conway = (i, j, boardState) => {
    // rules https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
    const live = boardState[i][j];
    const rowBefore = i == 0 ? boardState.length - 1 : i-1,
      colBefore = j == 0 ? boardState[0].length - 1 : j-1,
      rowAfter = i == boardState.length - 1 ? 0 : i+1,
      colAfter = j == boardState[0].length - 1 ? 0 : j+1;
    let liveNeighborCount = [
      boardState[rowBefore][colBefore], boardState[rowBefore][j], boardState[rowBefore][colAfter],
      boardState[i][colBefore]        ,                           boardState[i][colAfter],
      boardState[rowAfter][colBefore] , boardState[rowAfter][j] , boardState[rowAfter][colAfter]
    ].map(v => v ? 1 : 0).reduce((accumulator, currentValue) => accumulator + currentValue);
    return live
      ? (liveNeighborCount === 2 || liveNeighborCount === 3)
      : liveNeighborCount === 3;
  }

  const next = boardState => {
    return boardState.map((row, i)=>row.map((c,j) => conway(i,j, boardState)));
  }
  let boardState = bs(ibs);

  board.go = () => {
    boardState = next(boardState);
    for (let i = 0; i < x; i++) {
      for (let j = 0; j < y; j++) {
        board.n(i, j, boardState[j][i]);
      }
    }
  }
  setInterval(() => { board.go() }, t);
};