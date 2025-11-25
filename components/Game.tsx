'use client'

import { useEffect, useRef, useState } from 'react'

interface GameProps {
  userId: number
}

interface Plant {
  id: string
  type: 'peashooter' | 'sunflower'
  row: number
  col: number
  health: number
  shootTimer: number
}

interface Zombie {
  id: string
  row: number
  x: number
  health: number
  speed: number
}

interface Bullet {
  id: string
  row: number
  x: number
}

interface Sun {
  id: string
  x: number
  y: number
  falling: boolean
}

const GRID_ROWS = 5
const GRID_COLS = 9
const CELL_SIZE = 80
const INITIAL_SUN = 150
const PEASHOOTER_COST = 100
const SUNFLOWER_COST = 50

export default function Game({ userId }: GameProps) {
  const [sunPoints, setSunPoints] = useState(INITIAL_SUN)
  const [plants, setPlants] = useState<Plant[]>([])
  const [zombies, setZombies] = useState<Zombie[]>([])
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [suns, setSuns] = useState<Sun[]>([])
  const [selectedPlant, setSelectedPlant] = useState<'peashooter' | 'sunflower' | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [score, setScore] = useState(0)
  const [wave, setWave] = useState(1)
  const [zombiesKilled, setZombiesKilled] = useState(0)

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const zombieSpawnRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Game loop
    gameLoopRef.current = setInterval(() => {
      if (gameOver || gameWon) return

      // Update bullets
      setBullets((prev) =>
        prev
          .map((bullet) => ({ ...bullet, x: bullet.x + 5 }))
          .filter((bullet) => bullet.x < GRID_COLS * CELL_SIZE)
      )

      // Update zombies
      setZombies((prev) =>
        prev.map((zombie) => {
          // Check if zombie reached the house
          if (zombie.x <= 0) {
            setGameOver(true)
          }
          return { ...zombie, x: zombie.x - zombie.speed }
        })
      )

      // Update suns falling
      setSuns((prev) =>
        prev.map((sun) => {
          if (sun.falling && sun.y < 400) {
            return { ...sun, y: sun.y + 2 }
          }
          return { ...sun, falling: false }
        })
      )

      // Plants shoot and generate sun
      setPlants((prev) =>
        prev.map((plant) => {
          if (plant.type === 'peashooter') {
            if (plant.shootTimer <= 0) {
              // Check if there's a zombie in this row
              const zombieInRow = zombies.some((z) => z.row === plant.row)
              if (zombieInRow) {
                const bulletId = `bullet-${Date.now()}-${Math.random()}`
                setBullets((bullets) => [
                  ...bullets,
                  { id: bulletId, row: plant.row, x: plant.col * CELL_SIZE + CELL_SIZE },
                ])
                return { ...plant, shootTimer: 30 }
              }
            }
            return { ...plant, shootTimer: plant.shootTimer - 1 }
          } else if (plant.type === 'sunflower') {
            if (plant.shootTimer <= 0) {
              const sunId = `sun-${Date.now()}-${Math.random()}`
              setSuns((suns) => [
                ...suns,
                {
                  id: sunId,
                  x: plant.col * CELL_SIZE + 20,
                  y: plant.row * CELL_SIZE,
                  falling: true,
                },
              ])
              return { ...plant, shootTimer: 300 }
            }
            return { ...plant, shootTimer: plant.shootTimer - 1 }
          }
          return plant
        })
      )

      // Collision detection
      setBullets((prevBullets) => {
        const remainingBullets: Bullet[] = []
        const bulletsToRemove = new Set<string>()

        prevBullets.forEach((bullet) => {
          let hit = false
          setZombies((prevZombies) =>
            prevZombies
              .map((zombie) => {
                if (
                  zombie.row === bullet.row &&
                  Math.abs(zombie.x - bullet.x) < 30 &&
                  !bulletsToRemove.has(bullet.id)
                ) {
                  hit = true
                  bulletsToRemove.add(bullet.id)
                  return { ...zombie, health: zombie.health - 20 }
                }
                return zombie
              })
              .filter((zombie) => {
                if (zombie.health <= 0) {
                  setScore((s) => s + 10)
                  setZombiesKilled((k) => k + 1)
                  return false
                }
                return true
              })
          )

          if (!hit) {
            remainingBullets.push(bullet)
          }
        })

        return remainingBullets
      })
    }, 50)

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [gameOver, gameWon, plants, zombies, bullets])

  useEffect(() => {
    // Spawn zombies
    if (!gameOver && !gameWon) {
      zombieSpawnRef.current = setInterval(
        () => {
          const row = Math.floor(Math.random() * GRID_ROWS)
          const zombieId = `zombie-${Date.now()}-${Math.random()}`
          setZombies((prev) => [
            ...prev,
            {
              id: zombieId,
              row,
              x: GRID_COLS * CELL_SIZE - 20,
              health: 100,
              speed: 0.5,
            },
          ])
        },
        Math.max(3000 - wave * 200, 1000)
      )
    }

    return () => {
      if (zombieSpawnRef.current) clearInterval(zombieSpawnRef.current)
    }
  }, [gameOver, gameWon, wave])

  useEffect(() => {
    // Check win condition
    if (zombiesKilled >= wave * 10 && zombies.length === 0) {
      setWave((w) => w + 1)
      setZombiesKilled(0)
      if (wave >= 5) {
        setGameWon(true)
        saveScore()
      }
    }
  }, [zombiesKilled, zombies, wave])

  const saveScore = async () => {
    try {
      await fetch('/api/game/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          level: 1,
          score,
          waves: wave,
        }),
      })
    } catch (error) {
      console.error('Failed to save score:', error)
    }
  }

  const handleCellClick = (row: number, col: number) => {
    if (!selectedPlant || gameOver || gameWon) return

    // Check if cell is occupied
    if (plants.some((p) => p.row === row && p.col === col)) return

    // Check if player has enough sun
    const cost = selectedPlant === 'peashooter' ? PEASHOOTER_COST : SUNFLOWER_COST
    if (sunPoints < cost) return

    // Place plant
    const plantId = `plant-${Date.now()}-${Math.random()}`
    setPlants([
      ...plants,
      {
        id: plantId,
        type: selectedPlant,
        row,
        col,
        health: 100,
        shootTimer: 0,
      },
    ])

    setSunPoints(sunPoints - cost)
    setSelectedPlant(null)
  }

  const collectSun = (sunId: string) => {
    setSuns((prev) => prev.filter((s) => s.id !== sunId))
    setSunPoints((prev) => prev + 25)
  }

  const restartGame = () => {
    setGameOver(false)
    setGameWon(false)
    setSunPoints(INITIAL_SUN)
    setPlants([])
    setZombies([])
    setBullets([])
    setSuns([])
    setScore(0)
    setWave(1)
    setZombiesKilled(0)
  }

  return (
    <div className="p-4">
      {/* Game Stats */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex justify-between items-center">
        <div className="flex gap-6">
          <div className="text-lg font-bold text-yellow-600">
            阳光: {sunPoints}
          </div>
          <div className="text-lg font-bold text-blue-600">
            分数: {score}
          </div>
          <div className="text-lg font-bold text-purple-600">
            波次: {wave}
          </div>
          <div className="text-lg font-bold text-red-600">
            击杀: {zombiesKilled}/{wave * 10}
          </div>
        </div>
      </div>

      {/* Plant Selection */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedPlant('sunflower')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              selectedPlant === 'sunflower'
                ? 'bg-yellow-500 text-white scale-105'
                : 'bg-gray-200 hover:bg-gray-300'
            } ${sunPoints < SUNFLOWER_COST ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={sunPoints < SUNFLOWER_COST}
          >
            🌻 向日葵 ({SUNFLOWER_COST})
          </button>
          <button
            onClick={() => setSelectedPlant('peashooter')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              selectedPlant === 'peashooter'
                ? 'bg-green-500 text-white scale-105'
                : 'bg-gray-200 hover:bg-gray-300'
            } ${sunPoints < PEASHOOTER_COST ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={sunPoints < PEASHOOTER_COST}
          >
            🌱 豌豆射手 ({PEASHOOTER_COST})
          </button>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative bg-green-200 rounded-lg shadow-lg overflow-hidden">
        <div
          style={{
            width: GRID_COLS * CELL_SIZE,
            height: GRID_ROWS * CELL_SIZE,
          }}
        >
          {/* Grid */}
          {Array.from({ length: GRID_ROWS }).map((_, row) =>
            Array.from({ length: GRID_COLS }).map((_, col) => (
              <div
                key={`${row}-${col}`}
                onClick={() => handleCellClick(row, col)}
                className="absolute border border-green-300 hover:bg-green-300 cursor-pointer transition-colors"
                style={{
                  left: col * CELL_SIZE,
                  top: row * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
              />
            ))
          )}

          {/* Plants */}
          {plants.map((plant) => (
            <div
              key={plant.id}
              className="absolute flex items-center justify-center text-4xl"
              style={{
                left: plant.col * CELL_SIZE,
                top: plant.row * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            >
              {plant.type === 'peashooter' ? '🌱' : '🌻'}
            </div>
          ))}

          {/* Zombies */}
          {zombies.map((zombie) => (
            <div
              key={zombie.id}
              className="absolute flex items-center justify-center text-4xl"
              style={{
                left: zombie.x,
                top: zombie.row * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                transition: 'left 50ms linear',
              }}
            >
              🧟
            </div>
          ))}

          {/* Bullets */}
          {bullets.map((bullet) => (
            <div
              key={bullet.id}
              className="absolute bg-green-600 rounded-full"
              style={{
                left: bullet.x,
                top: bullet.row * CELL_SIZE + CELL_SIZE / 2 - 5,
                width: 10,
                height: 10,
              }}
            />
          ))}

          {/* Suns */}
          {suns.map((sun) => (
            <div
              key={sun.id}
              onClick={() => collectSun(sun.id)}
              className="absolute text-3xl cursor-pointer hover:scale-110 transition-transform"
              style={{
                left: sun.x,
                top: sun.y,
              }}
            >
              ☀️
            </div>
          ))}
        </div>
      </div>

      {/* Game Over / Won Modal */}
      {(gameOver || gameWon) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md text-center">
            <h2 className="text-4xl font-bold mb-4">
              {gameWon ? '🎉 胜利！' : '💀 游戏结束'}
            </h2>
            <p className="text-xl mb-2">最终分数: {score}</p>
            <p className="text-lg mb-6">完成波次: {wave - 1}</p>
            <button
              onClick={restartGame}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
            >
              重新开始
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 bg-white rounded-lg shadow-lg p-4">
        <h3 className="font-bold mb-2">游戏说明：</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• 选择植物，然后点击草坪格子来种植</li>
          <li>• 向日葵会生产阳光（资源）</li>
          <li>• 豌豆射手会自动攻击僵尸</li>
          <li>• 点击掉落的阳光来收集</li>
          <li>• 每波需要击杀 10 只僵尸</li>
          <li>• 不要让僵尸到达房子！</li>
        </ul>
      </div>
    </div>
  )
}
