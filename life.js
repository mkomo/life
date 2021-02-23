l = () => {
  if (l.on) return;
  l.on = true;
  const BOUNDARY_CONDITION_WRAP = 'wrap', BOUNDARY_CONDITION_END = 'end';
  const DEFAULT_UPDATE_TIME = 50; //ms
  const MIN_CELL_SIZE = 10; //px
  const makeLife = ({
    width = window.innerWidth,
    height = window.innerHeight,
    cellCountX,
    cellCountY,
    boundaryCondition = BOUNDARY_CONDITION_WRAP,
    initialBoardState = '',
    documentTitle = 'life',
    updateTime = DEFAULT_UPDATE_TIME
  } = {}) => {
    document.title = documentTitle;

    const makeBoard = ({
      width,
      height,
      cellSize = MIN_CELL_SIZE,
      cellCountX = Math.floor(width / cellSize),
      cellCountY = Math.floor(height / cellSize),
      initialBoardState}) => {

      const styleCell = (cell, bs, i, j) => {
        // cell.style.fill = '#000';
        if (bs[j][i] !== cell.value) {
          cell.value = bs[j][i];
          cell.setAttribute('style', `fill:blue;stroke:pink;stroke-width:1;fill-opacity:0.${bs[j][i] ? 9 : 1};stroke-opacity:0.9;`) //TODO simplify this
        }
      }
      const makeCell = (i,j) => {
        const cell = document.createElementNS('http://www.w3.org/2000/svg', 'path'); //Create a path in SVG's namespace
        cell.setAttribute('d',`M ${i*cellSize} ${j*cellSize} `
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

      //interpret initialBoardState
      const bs = (ibsString) => {
        const maxWidth = Math.min(Math.max(...ibsString.split('\n').map(row => row.length)), cellCountX);
        const padWidth = Math.floor((cellCountX - maxWidth)/2);

        const centerY = (a,l, fillVal) => a.length < l
          ? new Array(Math.floor((l - a.length)/2)).fill(fillVal).concat(a, new Array(Math.ceil((l - a.length)/2)).fill(fillVal))
          : a;
        const centerX = (a, fillVal) => a.length < cellCountX
          ? new Array(padWidth).fill(fillVal).concat(a, new Array(cellCountX - a.length - padWidth).fill(fillVal))
          : a;

        return centerY(ibsString.split('\n'), cellCountY, '').map(row=>centerX(row.split(''), '.').map(cell => cell === 'O'))
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
      let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); //Get svg element
      svg.style.position = 'absolute';
      svg.style.top = 0;
      svg.style.left = 0;
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
      const offX = (width - (cellCountX * cellSize))/2, offY = (height - (cellCountY * cellSize))/2;
      svg.setAttribute('viewBox', `${0 - offX} ${0 - offY} ${width} ${height}`);
      svg = document.getElementsByTagName('body')[0].appendChild(svg);

      svg.grid = [];

      for (let i = 0; i < cellCountX; i++) {
        svg.grid.push([]);
        for (let j = 0; j < cellCountY; j++) {
          svg.grid[i].push(makeCell(i,j));
        }
      }

      let boardState = bs(initialBoardState);
      svg.iterateState = () => {
        boardState = next(boardState);
        for (let i = 0; i < cellCountX; i++) {
          for (let j = 0; j < cellCountY; j++) {
            styleCell(svg.grid[i][j], boardState, i, j);
          }
        }
      }
      return svg;
    }

    const board = makeBoard({width, height, cellCountX, cellCountY, initialBoardState});
    setInterval(() => { board.iterateState() }, updateTime);
  };
  makeLife({initialBoardState: `........................O
......................O.O
............OO......OO............OO
...........O...O....OO............OO
OO........O.....O...OO
OO........O...O.OO....O.O
..........O.....O.......O
...........O...O
............OO`}); //https://www.conwaylife.com/patterns/gosperglidergun.cells
};