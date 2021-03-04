l = () => {
  if (l.on) return;
  l.on = 1;
  const BOUNDARY_CONDITION_WRAP = 'wrap';
  const DEFAULT_UPDATE_TIME = 30; //ms
  const MIN_CELL_SIZE = 10; //px
  let win = window,
    w = win.innerWidth,
    h = win.innerHeight,
    boundaryCondition = BOUNDARY_CONDITION_WRAP,
    gosperCompressed = `@)|>)))|4*.*4*|3)+),*4*|(*0)-)+*|(*0)+))*,)))|2)-)/)|3)+)|4*`,
    simkinCompressed = `(*-*|(*-*||,*|,*|||||>*)*|=)-)|=).)**|=++)+*|B)||||<*|<)|=+|?)`,
    gosper = `........................O
......................O.O
............OO......OO............OO
...........O...O....OO............OO
OO........O.....O...OO
OO........O...O.OO....O.O
..........O.....O.......O
...........O...O
............OO`, //https://www.conwaylife.com/patterns/gosperglidergun.cells
    simkin = `OO.....OO........................
OO.....OO........................
.................................
....OO...........................
....OO...........................
.................................
.................................
.................................
.................................
......................OO.OO......
.....................O.....O.....
.....................O......O..OO
.....................OOO...O...OO
..........................O......
.................................
.................................
.................................
....................OO...........
....................O............
.....................OOO.........
.......................O.........`, // https://www.conwaylife.com/patterns/simkinglidergun.cells
    t = DEFAULT_UPDATE_TIME,
    d = document,
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
      bs = board.style,
      offX = (w - (x * cellSize))/2,
      offY = (h - (y * cellSize))/2,
      grid = [];
    bs.position = 'fixed';
    bs.top = 0;
    bs.left = 0;
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
      if (value != cell.value) {
        cell.value = value;
        cell[sA]('style', `fill:#09c;stroke:#03c;stroke-width:1;fill-opacity:0.${value ? 9 : 1};stroke-opacity:0.9;`) //TODO simplify this
      }
    }
    return board;
  }

  const makeBoardCanvas = () => {
    let sA = 'setAttribute',
      board = d.createElement`canvas`,
      bs = board.style,
      ctx = board.getContext`2d`,
      grid = A(y).fill().map(() => A(x));

    bs.position = 'fixed';
    bs.top = (h - (y * cellSize))/2 + 'px';
    bs.left = (w - (x * cellSize))/2 + 'px';
    board[sA]('width', w);
    board[sA]('height', h);

    board.go = (i, j, value) => {
      if (value != grid[j][i]) {
        grid[j][i] = value;
        ctx.fillStyle = `rgba(0,48,192,0.${value ? 9 : 1})`;
        ctx.clearRect(i*cellSize, j*cellSize, cellSize, cellSize);
        ctx.fillRect(i*cellSize, j*cellSize, cellSize, cellSize);

      }
    }
    return d.body.appendChild(board);
  }

  // Utility method used to translate from `cells` format to compressed
  // Valid only if max contiguous string is less than 52 characters (due to escaping \ at charcode 92)
  const compressBoardString = boardString =>
    boardString.split('\n')
      .map(b=>b.split(/(?<=O+)(?=\.+)|(?<=\.+)(?=O+)/) //zero-width regex for any time the string changes from . to O or vice versa
        .map((a,i,arr)=>(arr.length == i + 1 && arr[i][0] == '.') ? '' : ((!i && a[0] =='O' ? '(' : '')+String.fromCharCode(a.length+40)))
        .join('')).join('|');

  // translate from compressed to format readable by interpretBoardStrings
  const decompressBoardString = compressedBoardString =>
    compressedBoardString.split`|`
      .map(r=>r.split``
        .map((c,i)=>A(c.charCodeAt(0)-40).fill(i%2 ? 'O' : '.').join``)
        .join``);

  //interpret initial board state
  const interpretBoardStrings = (ibsStrings) => {
    const padWidth = ~~((x - Math.max(...ibsStrings.map(len)))/2),
      centerY = (a) => len(a) < y
        ? A(~~((y - len(a))/2)).fill('').concat(a, A(Math.ceil((y - len(a))/2)).fill(''))
        : a,
      centerX = (a) => len(a) < x
        ? A(padWidth).fill('.').concat(a, A(x - len(a) - padWidth).fill('.'))
        : a;
    return centerY(ibsStrings).map(row=>centerX(row.split``).map(cell => cell == 'O'))
  }

  // define conway rules
  const conway = (i, j, boardState, live) => {
    // rules https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
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
  // let board = location.search ? makeBoardSvg() : makeBoardCanvas(), boardState = interpretBoardStrings(gosper.split('\n'));
  // let board = makeBoardCanvas(), boardState = interpretBoardStrings(gosper.split('\n'));
  let board = makeBoardCanvas(), boardState = interpretBoardStrings(decompressBoardString(gosperCompressed));
  // let board = makeBoardSvg(), boardState = interpretBoardStrings(gosper.split('\n'));

  // run the animation
  setInterval(() => {
    boardState = boardState.map((row, i)=>row.map((live,j) => conway(i,j, boardState, live)));
    boardState.map((row, i)=>row.map((c,j) => board.go(j,i,c)));
  }, t);
};