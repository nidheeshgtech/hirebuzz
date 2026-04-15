import { sql } from '@vercel/postgres'

export { sql }

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id           SERIAL PRIMARY KEY,
      title        TEXT NOT NULL,
      company      TEXT NOT NULL,
      location     TEXT NOT NULL DEFAULT 'Dubai, UAE',
      description  TEXT,
      url          TEXT UNIQUE NOT NULL,
      source       TEXT NOT NULL,
      posted_at    TIMESTAMPTZ DEFAULT NOW(),
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         SERIAL PRIMARY KEY,
      endpoint   TEXT UNIQUE NOT NULL,
      p256dh     TEXT NOT NULL,
      auth       TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS email_subscribers (
      id         SERIAL PRIMARY KEY,
      email      TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export type Job = {
  id: number
  title: string
  company: string
  location: string
  description: string | null
  url: string
  source: string
  posted_at: string
  created_at: string
}

export type PushSubscription = {
  id: number
  endpoint: string
  p256dh: string
  auth: string
}

export async function insertJob(job: Omit<Job, 'id' | 'created_at' | 'posted_at'>) {
  try {
    await sql`
      INSERT INTO jobs (title, company, location, description, url, source)
      VALUES (${job.title}, ${job.company}, ${job.location}, ${job.description}, ${job.url}, ${job.source})
      ON CONFLICT (url) DO NOTHING
    `
    return true
  } catch {
    return false
  }
}

export async function getJobs(limit = 100): Promise<Job[]> {
  const result = await sql<Job>`
    SELECT * FROM jobs
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return result.rows
}

export async function getNewJobsSince(since: Date): Promise<Job[]> {
  const result = await sql<Job>`
    SELECT * FROM jobs
    WHERE created_at > ${since.toISOString()}
    ORDER BY created_at DESC
  `
  return result.rows
}

export async function getAllPushSubscriptions(): Promise<PushSubscription[]> {
  const result = await sql<PushSubscription>`
    SELECT * FROM push_subscriptions
  `
  return result.rows
}

export async function getAllEmailSubscribers(): Promise<{ email: string }[]> {
  const result = await sql<{ email: string }>`
    SELECT email FROM email_subscribers
  `
  return result.rows
}
