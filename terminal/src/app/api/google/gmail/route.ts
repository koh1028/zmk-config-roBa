import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { fetchGmailMessages } from '@/lib/google'

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get('account') || 'personal'

  try {
    let accessToken: string | undefined

    if (account === 'work') {
      const cookieStore = cookies()
      accessToken = cookieStore.get('g_work_token')?.value
      if (!accessToken) {
        return NextResponse.json({ error: 'work_not_connected' }, { status: 401 })
      }
    } else {
      const session = await getServerSession(authOptions)
      if (!session?.accessToken) {
        return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
      }
      accessToken = session.accessToken
    }

    const messages = await fetchGmailMessages(accessToken)
    return NextResponse.json({ messages })
  } catch (err: any) {
    console.error('Gmail fetch error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
