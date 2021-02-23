l = () => {
  if (l.on) return;
  l.on = true;
  const BOUNDARY_CONDITION_WRAP = 'wrap', BOUNDARY_CONDITION_END = 'end';
  const DEFAULT_UPDATE_TIME = 50; //ms
  const MIN_CELL_SIZE = 10; //px
  const makeLife = ({
    w = window.innerWidth,
    h = window.innerHeight,
    x,
    y,
    boundaryCondition = BOUNDARY_CONDITION_WRAP,
    ibs = '',
    t = DEFAULT_UPDATE_TIME
  } = {}) => {

    const d = document, M = Math, A = Array, cENS = 'createElementNS', sA = 'setAttribute', NS = 'http://www.w3.org/2000/svg', makeBoard = ({
      w,
      h,
      cellSize = MIN_CELL_SIZE,
      x = M.floor(w / cellSize),
      y = M.floor(h / cellSize),
      ibs}) => {

      d.title = 'life';

      const styleCell = (cell, bs, i, j) => {
        // cell.style.fill = '#000';
        if (bs[j][i] !== cell.value) {
          cell.value = bs[j][i];
          cell[sA]('style', `fill:blue;stroke:pink;stroke-width:1;fill-opacity:0.${bs[j][i] ? 9 : 1};stroke-opacity:0.9;`) //TODO simplify this
        }
      }
      const makeCell = (i,j) => {
        const cell = d[cENS](NS, 'path'); //Create a path in SVG's namespace
        cell[sA]('d',`M ${i*cellSize} ${j*cellSize} `
          + `L ${(i+1)*cellSize} ${j*cellSize} ${(i+1)*cellSize} ${(j+1)*cellSize} ${i*cellSize} ${(j+1)*cellSize} ${i*cellSize} ${j*cellSize}`); //Set path's data
        svg.appendChild(cell);
        return cell;
      }

      //TODO redraw on resize?
      //TODO handle user interactions? minimally: spacebar or longpress for pause/resume, click/tap to change value
      //TODO keep track of golfing and performance
      //TODO prevent laggy-ness
      /**
       * efficiency improvements:
       *  use list of all on cells for iterating to render next generation
       */

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
      const inverse = (i, j, boardState) => {
        return !boardState[i][j];
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

      const nextCell = conway;
      const next = boardState => {
        return boardState.map((row, i)=>row.map((c,j) => nextCell(i,j, boardState)));
      }

      //create svg
      let svg = d[cENS](NS, 'svg'); //Get svg element
      svg.style.position = 'absolute';
      svg.style.top = 0;
      svg.style.left = 0;
      svg[sA]('width', w);
      svg[sA]('height', h);
      const offX = (w - (x * cellSize))/2, offY = (h - (y * cellSize))/2;
      svg[sA]('viewBox', `${0 - offX} ${0 - offY} ${w} ${h}`);
      svg = d.getElementsByTagName('body')[0].appendChild(svg);

      svg.grid = [];

      for (let i = 0; i < x; i++) {
        svg.grid.push([]);
        for (let j = 0; j < y; j++) {
          svg.grid[i].push(makeCell(i,j));
        }
      }

      let boardState = bs(ibs);
      svg.go = () => {
        boardState = next(boardState);
        for (let i = 0; i < x; i++) {
          for (let j = 0; j < y; j++) {
            styleCell(svg.grid[i][j], boardState, i, j);
          }
        }
      }
      return svg;
    }

    const board = makeBoard({w, h, x, y, ibs});
    setInterval(() => { board.go() }, t);
  };
  makeLife({ibs: `........................O
......................O.O
............OO......OO............OO
...........O...O....OO............OO
OO........O.....O...OO
OO........O...O.OO....O.O
..........O.....O.......O
...........O...O
............OO`}); //https://www.conwaylife.com/patterns/gosperglidergun.cells
};