import { NextResponse } from 'next/server'

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

export async function GET() {
  return NextResponse.json({ 
    timestamp: Date.now(),
    message: 'pong' 
  })
}