'use client'

import { useState } from 'react'
import LoginForm from '@/components/LoginForm'
import RegisterForm from '@/components/RegisterForm'

export default function Home() {
  const [showLogin, setShowLogin] = useState(true)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-100 to-green-300 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-green-800 mb-2">
          植物大战僵尸
        </h1>
        <p className="text-xl text-green-700">Plants vs Zombies</p>
      </div>

      <div className="mb-4">
        <div className="flex gap-2 bg-white rounded-lg p-1">
          <button
            onClick={() => setShowLogin(true)}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              showLogin
                ? 'bg-green-600 text-white'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setShowLogin(false)}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              !showLogin
                ? 'bg-green-600 text-white'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            注册
          </button>
        </div>
      </div>

      {showLogin ? <LoginForm /> : <RegisterForm />}

      <div className="mt-8 text-center text-green-800">
        <p className="text-sm">
          保卫你的花园，击败僵尸入侵！
        </p>
      </div>
    </main>
  )
}
