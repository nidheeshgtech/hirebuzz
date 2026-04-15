import { NextResponse } from 'next/server'
import { initDB, getJobs } from '@/lib/db'

export async function GET(request: Request) {
  try {
    await initDB()

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200)

    const jobs = await getJobs(limit)

    return NextResponse.json({ jobs }, { status: 200 })
  } catch (err) {
    console.error('[/api/jobs] Error:', err)
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 })
  }
}
