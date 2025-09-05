import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(url, key)
}

export async function GET() {
  try {
    const supabase = getSupabase()
    console.log('Rising API: Starting request')
    console.log('Supabase URL:', process.env.SUPABASE_URL)
    console.log('Service role key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Get articles with positive temperature, ordered by highest slope
    // Use more lenient criteria for development/testing
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    console.log('Querying article_temperatures table...')
    const { data: risingArticles, error } = await supabase
      .from('article_temperatures')
      .select('article_id, temperature, vote_count, created_at')
      .gt('temperature', 0) // Only positive slopes
      .gte('created_at', thirtyDaysAgo.toISOString()) // Last 30 days (more lenient)
      .gte('vote_count', 1) // Minimum 1 vote (more lenient)
      .order('temperature', { ascending: false })
      .limit(12) // Get top 12 to have some buffer

    if (error) {
      console.error('Rising articles query error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))

      // Check if table doesn't exist
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.log('Table article_temperatures does not exist, returning empty array')
        return NextResponse.json([])
      }

      return NextResponse.json(
        { error: 'Failed to fetch rising articles', details: error.message },
        { status: 500 }
      )
    }

    // If no positive temperature articles found, fall back to any articles with votes
    if (!risingArticles || risingArticles.length === 0) {
      console.log('No positive temperature articles found, falling back to any voted articles')

      const { data: fallbackArticles } = await supabase
        .from('article_temperatures')
        .select('article_id, temperature, vote_count, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .gte('vote_count', 1)
        .order('vote_count', { ascending: false })
        .limit(8)

      return NextResponse.json(fallbackArticles || [])
    }

    return NextResponse.json(risingArticles)
  } catch (error) {
    console.error('Rising articles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
