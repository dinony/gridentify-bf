const read = require('read')
const beeper = require('beeper')

const _ROWS_ = 5
const _COLUMNS_ = 5

const _MAX_EVAL_GAMES_ = 3000000
const _MAX_PATH_LENGTH_ = 4
// const _MIN_PROBABILITY_ = 0.03
const _MIN_PPATH_ = 1.0
const _MAX_EVAL_DEPTH_ = 2

const initGame = [
  [3, 2, 1, 2, 2],
  [1, 3, 1, 2, 3],
  [2, 1, 3, 3, 1],
  [1, 3, 3, 2, 1],
  [1, 3, 2, 3, 1]
]

function cloneGame(game) {
  const cloned = [
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1]
  ]

  forEachPos(([r, c]) => {
    cloned[r][c] = game[r][c]
  })

  return cloned
}

function clonePGame(pGame) {
  const cloned = [
    [1.0, 1.0, 1.0, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0, 1.0]
  ]

  forEachPos(([r, c]) => {
    cloned[r][c] = pGame[r][c]
  })

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

function tracePath({game, pGame}, currentPos, currentPath, paths) {
  if(currentPath.path.length < _MAX_PATH_LENGTH_) {
    const [r, c] = currentPos
    const topIndex = r-1
    const leftIndex = c-1
    const bottomIndex = r+1
    const rightIndex = c+1

    if(topIndex > 0) {
      const newPos = [topIndex, c]
      if(getValue(game, currentPos) === getValue(game, newPos) && !isInPath(currentPath.path, newPos)) {
        const newPath = {
          path: currentPath.path.concat([newPos]), 
          pPath: currentPath.pPath * getValue(pGame, newPos)
        }
        paths.push(newPath)
        tracePath({game, pGame}, newPos, newPath, paths)
      }
    }

    if(leftIndex > 0) {
      const newPos = [r, leftIndex]
      if(getValue(game, currentPos) === getValue(game, newPos) && !isInPath(currentPath.path, newPos)) {
        const newPath = {
          path: currentPath.path.concat([newPos]), 
          pPath: currentPath.pPath * getValue(pGame, newPos)
        }
        paths.push(newPath)
        tracePath({game, pGame}, newPos, newPath, paths)
      }
    }

    if(bottomIndex < _ROWS_) {
      const newPos = [bottomIndex, c]
      if(getValue(game, currentPos) === getValue(game, newPos) && !isInPath(currentPath.path, newPos)) {
        const newPath = {
          path: currentPath.path.concat([newPos]), 
          pPath: currentPath.pPath * getValue(pGame, newPos)
        }
        paths.push(newPath)
        tracePath({game, pGame}, newPos, newPath, paths)
      }
    }

    if(rightIndex < _COLUMNS_) {
      const newPos = [r, rightIndex]
      if(getValue(game, currentPos) === getValue(game, newPos) && !isInPath(currentPath.path, newPos)) {
        const newPath = {
          path: currentPath.path.concat([newPos]), 
          pPath: currentPath.pPath * getValue(pGame, newPos)
        }
        paths.push(newPath)
        tracePath({game, pGame}, newPos, newPath, paths)
      }
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

// function getFillStrs(currentStr, currentIndex, accumStrs, counterRef={k:0}) {
//   if(currentIndex >= 0) {
//     const left = currentStr.substr(0, currentIndex)
//     const right = currentStr.substr(currentIndex+1)

//     const v1 = `${left}1${right}`
//     const v2 = `${left}2${right}`
//     const v3 = `${left}3${right}`

//     if(counterRef.k % 3 !== 0 || counterRef.k === 0) {
//       accumStrs.push(v1)
//     }
//     counterRef.k+=1
//     if(counterRef.k % 3 !== 0) {
//       accumStrs.push(v2)
//     }    
//     counterRef.k+=1
//     if(counterRef.k % 3 !== 0) {
//       accumStrs.push(v3)
//     }
//     counterRef.k+=1

//     getFillStrs(v1, currentIndex-1, accumStrs, counterRef)
//     getFillStrs(v2, currentIndex-1, accumStrs, counterRef)
//     getFillStrs(v3, currentIndex-1, accumStrs, counterRef)
//   }
// }

function getFillNumsFixed(length) {
  switch(length) {
    case 1: {
      return [[1], [2], [3]]
    }
    case 2: {
      return [[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [3, 3]]
    } 
    case 3: {
      return [
        [1, 1, 1], [1, 1, 2], [1, 1, 3], [1, 2, 1], [1, 2, 2], [1, 2, 3], [1, 3, 1], [1, 3, 2], [1, 3, 3],
        [2, 1, 1], [2, 1, 2], [2, 1, 3], [2, 2, 1], [2, 2, 2], [2, 2, 3], [2, 3, 1], [2, 3, 2], [2, 3, 3],
        [3, 1, 1], [3, 1, 2], [3, 1, 3], [3, 2, 1], [3, 2, 2], [3, 2, 3], [3, 3, 1], [3, 3, 2], [3, 3, 3]
      ]
    }
    default: {
      throw new Error(`getFillNumsFixed(${length}): Length not supported!`)
    }
  }
}

function fillPath(game, path, values) {
  for(let p = 0; p < path.length-1; p++) {
    const [fR, fC] = path[p]
    game[fR][fC] = values[p]
  }
}

function applyPath(game, path, fillValues) {
  const cloned = cloneGame(game)
  const [lR, lC] = path[path.length-1]
  cloned[lR][lC] = computeScore(game, path)

  fillPath(cloned, path, fillValues)
  return cloned
}

function applyPPath(pGame, path, pPath) {
  const pCloned = clonePGame(pGame)
  for(let p = 0; p < path.length-1; p++) {
    const [r, c] = path[p]
    pCloned[r][c] = pGame[r][c]/3
  }

  const [lR, lC] = path[path.length-1]
  pCloned[lR][lC] = pGame[lR][lC] * pPath
  return pCloned
}


function enumPath(game, pGame, path, pPath) {
  const fillNums = getFillNumsFixed(path.length-1)

  const pCloned = applyPPath(pGame, path, pPath)

  return fillNums.map(digits => {
    const possibleGame = applyPath(game, path, digits)
    return {game: possibleGame, pGame: pCloned}
  })
}

function forEachPos(cb) {
  for(let r = 0; r < _ROWS_; r++) {
    for(let c = 0; c < _COLUMNS_; c++) {
      cb([r, c])
    }
  }
}

// function getNumPossibleGames(length) {
//   return Math.pow(3, length-1)
// }

function evalBreadthFirst(gameMeta) {
  const queue = [gameMeta]
  // let numGames = 0
  let queuePointer = 0
  while(/*numGames < _MAX_EVAL_GAMES_ &&*/ queuePointer < queue.length) {
    const {game, pGame, score, target/*, p*/ , depth} = queue[queuePointer]

    if(depth <= _MAX_EVAL_DEPTH_) {
      forEachPos(currentPos => {
        const possiblePaths = []
        tracePath({game, pGame}, currentPos, {path: [currentPos], pPath: getValue(pGame, currentPos)}, possiblePaths)

        if(possiblePaths.length > 0) {

          const posPaths = possiblePaths.map(({pPath, path}) => {
            const s = score+computeScore(game, path)
            return {
              path, 
              pPath, 
              pScore: s*pPath,
              s
            }
          })
          
          const bestIndex = posPaths.reduce((bestIndex, {pScore}, idx, src) => {
            return pScore > src[bestIndex].pScore? idx: bestIndex
          }, 0)

          const {path, pPath, s} = posPaths[bestIndex]
          
          // forEach(({pPath, path}) => {
          //   if(pPath >= _MIN_PPATH_) {
              const pushedGame = { 
                state: game,
                pPath, 
                path,
                depth,
                // p,
                score: s,
                children: []
              }
      
              target.push(pushedGame)
              // numGames++
      
              // const pPossibleGame = p/getNumPossibleGames(path.length)
              // if(pPossibleGame > _MIN_PROBABILITY_) {
                const possibleGames = enumPath(game, pGame, path, pPath)
                possibleGames.forEach(({game: possibleGame, pGame: pPossibleGame}) => {
                  queue.push({
                    game: possibleGame,
                    pGame: pPossibleGame,
                    depth: depth+1,
                    // p: pPossibleGame,
                    score: pushedGame.score,
                    target: pushedGame.children
                  })
                })
              // }
            // }
          // })  
        }
      })
    }
    
    queuePointer++
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
    }, [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])

    game.minScore = game.score+minScore
    game.maxScore = game.score+maxScore
  }
}

function bruteForce(game, score) {
  const evaledGames = []
  // evalStep({game, score: 0, games, counterRef: {numGames: 0}})
  const pGame = [
    [1.0, 1.0, 1.0, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0, 1.0]
  ]
  evalBreadthFirst({game, pGame, score, target: evaledGames/*, p: 1.0*/, depth: 0})

  if(evaledGames.length > 0) {
    evaledGames.forEach(g => {populateMinMaxScores(g)})
    // evaledGames.forEach(populateDepth)
    evaledGames.forEach(g => {
      populateHeight(g)
    })
    console.log('Total Games', countGames(evaledGames))

    const bestGameIndex = evaledGames.reduce((maxIndex, g, cI) => {
      const bGame = evaledGames[maxIndex]
      return g.minScore > bGame.minScore? cI: maxIndex
    }, 0)

    const bestGame = evaledGames[bestGameIndex]
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
    const chosenStep = bruteForce(game, score)

    if(chosenStep !== null) {
      score = chosenStep.score

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