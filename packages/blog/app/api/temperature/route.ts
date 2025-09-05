import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(url, key)
}

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
const RATE_LIMIT_MAX = 10 // max requests per window

async function checkRateLimit(client: SupabaseClient, ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW)

  const { count } = await client
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', windowStart.toISOString())

  if ((count || 0) >= RATE_LIMIT_MAX) {
    return false
  }

  // Record this request
  await client.from('rate_limits').insert({ ip_address: ip })

  return true
}

async function getVoterIdFromCookies(): Promise<string> {
  const cookieStore = await cookies()
  let voterId = cookieStore.get('voter_id')?.value

  if (!voterId) {
    voterId = uuidv4()
  }

  return voterId
}

function getTemperatureStatus(temp: number): string {
  if (temp >= 10) return 'hot'
  if (temp <= -10) return 'cold'
  return 'normal'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Rate limiting
    const rateLimitOk = await checkRateLimit(supabase, ip)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { id, delta } = await request.json()

    if (!id || (delta !== 1 && delta !== -1)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const voterId = await getVoterIdFromCookies()

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('article_votes')
      .select('vote_value')
      .eq('article_id', id)
      .eq('voter_id', voterId)
      .single()

    if (existingVote) {
      return NextResponse.json({ error: 'Already voted' }, { status: 409 })
    }

    // First, insert the vote
    const { error: voteError } = await supabase.from('article_votes').insert({
      article_id: id,
      voter_id: voterId,
      vote_value: delta,
    })

    if (voteError) {
      console.error('Vote insert error:', voteError)
      return NextResponse.json({ error: `Vote error: ${voteError.message}` }, { status: 500 })
    }

    // Then update or insert article temperature
    const { data: tempData, error: tempError } = await supabase
      .from('article_temperatures')
      .select('temperature, vote_count')
      .eq('article_id', id)
      .single()

    let newTemp = delta
    let newCount = 1

    if (tempData) {
      // Update existing
      newTemp = tempData.temperature + delta
      newCount = tempData.vote_count + 1

      const { error: updateError } = await supabase
        .from('article_temperatures')
        .update({
          temperature: newTemp,
          vote_count: newCount,
        })
        .eq('article_id', id)

      if (updateError) {
        console.error('Temperature update error:', updateError)
        return NextResponse.json({ error: `Update error: ${updateError.message}` }, { status: 500 })
      }
    } else {
      // Insert new
      const { error: insertError } = await supabase.from('article_temperatures').insert({
        article_id: id,
        temperature: newTemp,
        vote_count: newCount,
      })

      if (insertError) {
        console.error('Temperature insert error:', insertError)
        return NextResponse.json({ error: `Insert error: ${insertError.message}` }, { status: 500 })
      }
    }

    const status = getTemperatureStatus(newTemp)

    // Create response with voter cookie
    const response = NextResponse.json({
      temp: Math.round(newTemp * 10) / 10,
      thumbscount: newCount,
      status,
    })

    // Set voter cookie (if new)
    const cookieStore = await cookies()
    if (!cookieStore.get('voter_id')?.value) {
      response.cookies.set('voter_id', voterId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
    }

    return response
  } catch (error) {
    console.error('Temperature vote error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing article id' }, { status: 400 })
    }

    // Get article temperature data
    const { data: articleTemp } = await supabase
      .from('article_temperatures')
      .select('temperature, vote_count')
      .eq('article_id', id)
      .single()

    const temperature = articleTemp?.temperature || 0
    const voteCount = articleTemp?.vote_count || 0
    const status = getTemperatureStatus(temperature)

    // Check if current user has voted
    const voterId = await getVoterIdFromCookies()
    const { data: userVote } = await supabase
      .from('article_votes')
      .select('vote_value')
      .eq('article_id', id)
      .eq('voter_id', voterId)
      .single()

    return NextResponse.json({
      temp: Math.round(temperature * 10) / 10,
      thumbscount: voteCount,
      status,
      userVoted: !!userVote,
      userVote: userVote?.vote_value || null,
    })
  } catch (error) {
    console.error('Temperature get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
