const read = require('read')

const _ROWS_ = 5
const _COLUMNS_ = 5

const initGame = [
  [2, 1, 2, 2, 3],
  [2, 1, 3, 1, 1],
  [1, 2, 3, 2, 2],
  [2, 3, 3, 1, 3],
  [2, 1, 2, 1, 3]
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

function accumPath(game, currentPos, currentPath, paths) {
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
      accumPath(game, newPos, newPath, paths)
    }
  }

  if(leftIndex > 0) {
    const newPos = [r, leftIndex]
    if(getValue(game, currentPos) === getValue(game, newPos) && !isInPath(currentPath, newPos)) {
      const newPath = currentPath.concat([newPos])
      paths.push(newPath)
      accumPath(game, newPos, newPath, paths)
    }
  }

  if(bottomIndex < _ROWS_) {
    const newPos = [bottomIndex, c]
    if(getValue(game, currentPos) === getValue(game, newPos) && !isInPath(currentPath, newPos)) {
      const newPath = currentPath.concat([newPos])
      paths.push(newPath)
      accumPath(game, newPos, newPath, paths)
    }
  }

  if(rightIndex < _COLUMNS_) {
    const newPos = [r, rightIndex]
    if(getValue(game, currentPos) === getValue(game, newPos) && !isInPath(currentPath, newPos)) {
      const newPath = currentPath.concat([newPos])
      paths.push(newPath)
      accumPath(game, newPos, newPath, paths)
    }
  }
}

function pathStr(path) {
  return path.reduce((accum, [r, c], i) => {
    if(accum.length === 0) {
      return `(${r}, ${c})`
    } else {
      return `${accum} -> (${r}, ${c})`
    }
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

function computeScore(game, currentPos, path) {
  return getValue(game, currentPos) * path.length
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

function applyPath(game, currentPos, path) {
  const nextGame = cloneGame(game)
  const [lR, lC] = path[path.length-1]
  nextGame[lR][lC] = computeScore(game, currentPos, path)

  const fillLength = path.length-1

  const fillStrs = []
  getFillStrs('1'.repeat(fillLength), 0, fillStrs)

  possibleGames = []

  fillStrs.forEach(fStr => {
    const possibleGame = cloneGame(nextGame)
    for(p = 0; p < fillLength; p++) {
      const [fR, fC] = path[p]
      possibleGame[fR][fC] = parseInt(fStr[p])
    }

    possibleGames.push(possibleGame)
  })

  return possibleGames
}

function evalStep({game, score}, games, numStep, maxPathLength) {
  if(numStep >= 0) {
    for(let r = 0; r < _ROWS_; r++) {
      for(let c = 0; c < _COLUMNS_; c++) {
        const possiblePaths = []
        const currentPos = [r, c]
        accumPath(game, currentPos, [currentPos], possiblePaths)
        // if(possiblePaths.length > 0) {
        //   console.log(`(${r}, ${c}) has ${possiblePaths.length} paths (step: ${numStep})`)
        // }

        const filteredPaths = possiblePaths.filter(p => p.length <= maxPathLength)
        if(filteredPaths.length > 0) {
          const pathScores = filteredPaths.map(p => computeScore(game, currentPos, p))

          const maxIndex = pathScores.reduce((maxIndex, pScore, cIndex) => {
            const maxScore = pathScores[maxIndex]
            return pScore > maxScore ? cIndex: maxIndex
          }, 0)

          const path = possiblePaths[maxIndex]

          const nextGame = {
            state: game, path,
            score: score+computeScore(game, currentPos, path),
            children: []
          }

          games.push(nextGame)

          const possibleGames = applyPath(game, currentPos, path)
          // console.log(`(${r}, ${c}) with path ${pathStr(path)} has ${possibleGames.length} games`)
          // console.log('')

          possibleGames.forEach(pGame => {
            evalStep({game: pGame, score: nextGame.score}, nextGame.children, numStep-1, maxPathLength)
          })
        }
      }
    }
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

function bruteForce(game, maxSteps, maxPathLength) {
  const games = []
  evalStep({game, score: 0}, games, maxSteps, maxPathLength)

  if(games.length > 0) {
    games.forEach(populateMinMaxScores)
    console.log('Total Games', countGames(games))

    const bestGameIndex = games.reduce((maxIndex, g, cI) => {
      const bGame = games[maxIndex]
      return g.maxScore > bGame.maxScore? cI: maxIndex
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

function selectGame(games, path, values) {
  return games.find(g => {
    return path.find((p, pIndex) => {
      return getValue(g.state, p) !== values[pIndex]
    }) === undefined
  })
}

async function main() {
  let playing = true
  let game = initGame
  let score = 0
  while(playing) {
    const nextStep = bruteForce(game, 4, 2)

    if(nextStep !== null) {
      score += nextStep.score
      printGame(nextStep.state)

      console.log(pathStr(nextStep.path), 'score:', score)
      const path = nextStep.path
      const subPath = path.slice(0, path.length-1)
      const promptPath = subPath.map(([pR, pC]) => {
        return `Enter value for (${pR}, ${pC}):`
      })

      const parsedInputs = []
      for(let p = 0; p < promptPath.length; p++) {
        const res = await prompt(promptPath[p])
        parsedInputs.push(parseInt(res))
      }

      const selectedGame = selectGame(nextStep.children, subPath, parsedInputs)

      if(selectedGame !== undefined) {
        printGame(selectedGame.state)
        console.log('')
        game = selectedGame.state
      } else {
        playing = false
        console.log('No game found :/')
      }
    } else {
      paying = false
    }
  }

  console.log('Finised with score: ', score)
}

main()
