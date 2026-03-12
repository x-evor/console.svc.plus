import { getConsoleIntegrationDefaults } from '@/server/consoleIntegrations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  return Response.json(getConsoleIntegrationDefaults())
}
