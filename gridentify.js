const read = require('read')
const beeper = require('beeper')

const _ROWS_ = 5
const _COLUMNS_ = 5

const _MAX_EVAL_GAMES_ = 1000000

const initGame = [
  [3, 2, 1, 2, 2],
  [1, 3, 1, 2, 3],
  [2, 1, 3, 3, 1],
  [1, 3, 3, 2, 1],
  [1, 3, 2, 3, 1]
]

function cloneGame(game) {
  const cloned = [
    [],
    [],
    [],
    [],
    []
  ]

  for(let r = 0; r < _ROWS_; r++) {
    for(let c = 0; c < _COLUMNS_; c++) {
      cloned[r].push(getValue(game, [r, c]))
    }
  }

  return cloned
}

function getValue(game, [r, c]) {
  return game[r][c]
}

function isInPath(path, [r, c]) {
  return path.find(([pR, pC]) => {
    return pR === r && pC === c
  }) !== undefined
}

function tracePath(game, currentPos, currentPath, paths) {
  const [r, c] = currentPos
  const topIndex = r-1
  const leftIndex = c-1
  const bottomIndex = r+1
  const rightIndex = c+1

  if(topIndex > 0) {
    const newPos = [topIndex, c]
    if(getValue(game, currentPos) === getValue(game, newPos) && !isInPath(currentPath, newPos)) {
      const newPath = currentPath.concat([newPos])
      paths.push(newPath)
      tracePath(game, newPos, newPath, paths)
    }
  }

  if(leftIndex > 0) {
    const newPos = [r, leftIndex]
    if(getValue(game, currentPos) === getValue(game, newPos) && !isInPath(currentPath, newPos)) {
      const newPath = currentPath.concat([newPos])
      paths.push(newPath)
      tracePath(game, newPos, newPath, paths)
    }
  }

  if(bottomIndex < _ROWS_) {
    const newPos = [bottomIndex, c]
    if(getValue(game, currentPos) === getValue(game, newPos) && !isInPath(currentPath, newPos)) {
      const newPath = currentPath.concat([newPos])
      paths.push(newPath)
      tracePath(game, newPos, newPath, paths)
    }
  }

  if(rightIndex < _COLUMNS_) {
    const newPos = [r, rightIndex]
    if(getValue(game, currentPos) === getValue(game, newPos) && !isInPath(currentPath, newPos)) {
      const newPath = currentPath.concat([newPos])
      paths.push(newPath)
      tracePath(game, newPos, newPath, paths)
    }
  }
}

function pathStr(path) {
  return path.reduce((accum, [r, c]) => {
    return accum.length === 0 ? `(${r}, ${c})`: `${accum} -> (${r}, ${c})`
  }, '')
}

function printGame(game) {
  let columns = '\t'
  for(let c = 0; c < _COLUMNS_; c++) {
    columns = `${columns}\t${c}:`
  }
  console.log(columns)

  for(let r = 0; r < _ROWS_; r++) {
    let row = `${r}:\t`
    for(let c = 0; c < _COLUMNS_; c++) {
      row = `${row}\t${getValue(game, [r, c])}`
    }
    console.log(row)
  }
}

function computeScore(game, path) {
  return getValue(game, path[0]) * path.length
}

function getFillStrs(currentStr, currentIndex, accumStrs) {
  if(currentIndex < currentStr.length) {
    const left = currentStr.substr(0, currentIndex)
    const right = currentStr.substr(currentIndex+1)

    const v1 = `${left}1${right}`
    const v2 = `${left}2${right}`
    const v3 = `${left}3${right}`


    getFillStrs(v1, currentIndex+1, accumStrs)
    getFillStrs(v2, currentIndex+1, accumStrs)
    getFillStrs(v3, currentIndex+1, accumStrs)

    if(!accumStrs.includes(v1)) {
      accumStrs.push(v1)
    }

    if(!accumStrs.includes(v2)) {
      accumStrs.push(v2)
    }

    if(!accumStrs.includes(v3)) {
      accumStrs.push(v3)
    }
  }
}

function fillPath(game, path, values) {
  const cloned = cloneGame(game)
  for(let p = 0; p < path.length; p++) {
    const [fR, fC] = path[p]
    cloned[fR][fC] = values[p]
  }
  return cloned
}

function applyPath(game, path, fillValues) {
  const cloned = cloneGame(game)
  const [lR, lC] = path[path.length-1]
  cloned[lR][lC] = computeScore(game, path)

  const fPath = path.slice(0, path.length-1)
  const filled = fillPath(cloned, fPath, fillValues)
  return filled
}

function enumPath(game, path) {
  const fillStrs = []
  getFillStrs('1'.repeat(path.length-1), 0, fillStrs)

  const possibleGames = []

  fillStrs.forEach(fStr => {
    const possibleGame = applyPath(game, path, Array.from(fStr).map(parseInt))
    possibleGames.push(possibleGame)
  })

  return possibleGames
}

function evalStep({game, score, games, counterRef}) {
  if(counterRef.numGames < _MAX_EVAL_GAMES_) {
    const evalGames = []

    for(let r = 0; r < _ROWS_; r++) {
      for(let c = 0; c < _COLUMNS_; c++) {
        const possiblePaths = []
        const currentPos = [r, c]
        tracePath(game, currentPos, [currentPos], possiblePaths)
        // if(possiblePaths.length > 0) {
        //   console.log(`(${r}, ${c}) has ${possiblePaths.length} paths (step: ${numStep})`)
        // }

        possiblePaths.forEach(path => {
          const pushedGame = {
            state: game, path,
            pos: currentPos,
            score: score+computeScore(game, path),
            children: []
          }

          games.push(pushedGame)
          counterRef.numGames++

          const possibleGames = enumPath(game, path)
          // console.log(`(${r}, ${c}) with path ${pathStr(path)} has ${possibleGames.length} games`)
          // console.log('')

          possibleGames.forEach(possibleGame => {
            evalGames.push({
              game: possibleGame,
              score: pushedGame.score,
              games: pushedGame.children,
              counterRef
            })
          })
        })
      }
    }

    evalGames.forEach(evalStep)
  }
}

function countGames(games) {
  if(games.length > 0) {
    return games.length + games.reduce((accum, g) => {
      return accum + countGames(g.children)
    }, 0)
  } else {
    return 0
  }
}

function populateMinMaxScores(game) {
  game.minScore = game.score
  game.maxScore = game.score
  if(game.children.length > 0) {
    game.children.forEach(populateMinMaxScores)

    const [minScore, maxScore] = game.children.reduce(([curMin, curMax], child) => {
      return [
        child.minScore < curMin ? child.minScore: curMin,
        child.maxScore > curMax ? child.maxScore: curMax
      ]
    }, [game.minScore, game.maxScore])

    game.minScore = game.score+minScore
    game.maxScore = game.score+maxScore
  }
}

function bruteForce(game) {
  const games = []
  evalStep({game, score: 0, games, counterRef: {numGames: 0}})

  if(games.length > 0) {
    games.forEach(populateMinMaxScores)
    console.log('Total Games', countGames(games))

    const bestGameIndex = games.reduce((maxIndex, g, cI) => {
      const bGame = games[maxIndex]
      return g.minScore > bGame.minScore? cI: maxIndex
    }, 0)

    const bestGame = games[bestGameIndex]
    return bestGame
  } else {
    return null
  }
}

function prompt(msg, options) {
  return new Promise((resolve, reject) => {
    const args = Object.assign({}, {prompt: msg}, options)
    read(args, (err, input) => {
      if(err) {
        reject(new Error('Input error:', msg))
      }
      resolve(input)
    })
  })
}

async function main() {
  let playing = true
  let game = initGame
  let score = 0
  while(playing) {
    printGame(game)
    const chosenStep = bruteForce(game)

    if(chosenStep !== null) {
      score += chosenStep.score

      console.log(pathStr(chosenStep.path), 'score:', score, 'Expected Min Score', chosenStep.minScore)
      const path = chosenStep.path
      const subPath = path.slice(0, path.length-1)
      const promptPath = subPath.map(([pR, pC]) => {
        return `Enter value for (${pR}, ${pC}):`
      })

      await beeper(3)

      const parsedInputs = []
      for(let p = 0; p < promptPath.length; p++) {
        const res = await prompt(promptPath[p])
        parsedInputs.push(parseInt(res))
      }

      // const parsedInputs = [2]

      const nextGame = applyPath(chosenStep.state, chosenStep.path, parsedInputs)

      console.log('')
      game = nextGame
    } else {
      playing = false
    }
  }

  console.log('Finised with score: ', score)
}

main()