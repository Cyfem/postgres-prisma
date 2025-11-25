import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { userId, level, score, waves } = await request.json()

    if (!userId || level === undefined || score === undefined || waves === undefined) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const gameScore = await prisma.gameScore.create({
      data: {
        userId: parseInt(userId),
        level,
        score,
        waves,
      },
    })

    return NextResponse.json(gameScore)
  } catch (error) {
    console.error('Save score error:', error)
    return NextResponse.json(
      { error: '保存分数失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      )
    }

    const scores = await prisma.gameScore.findMany({
      where: {
        userId: parseInt(userId),
      },
      orderBy: {
        score: 'desc',
      },
      take: 10,
    })

    return NextResponse.json(scores)
  } catch (error) {
    console.error('Get scores error:', error)
    return NextResponse.json(
      { error: '获取分数失败' },
      { status: 500 }
    )
  }
}
