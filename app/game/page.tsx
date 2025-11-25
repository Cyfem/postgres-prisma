'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Game from '@/components/Game'

export default function GamePage() {
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    const storedUsername = localStorage.getItem('username')

    if (!storedUserId || !storedUsername) {
      router.push('/')
      return
    }

    setUserId(parseInt(storedUserId))
    setUsername(storedUsername)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    router.push('/')
  }

  if (!userId) {
    return null
  }

  return (
    <div className="min-h-screen bg-green-50">
      <div className="p-4 bg-green-800 text-white flex justify-between items-center">
        <h1 className="text-2xl font-bold">植物大战僵尸</h1>
        <div className="flex items-center gap-4">
          <span>欢迎, {username}!</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            退出
          </button>
        </div>
      </div>
      <Game userId={userId} />
    </div>
  )
}
