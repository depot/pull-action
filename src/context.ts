import * as core from '@actions/core'
import * as csv from 'csv-parse/sync'

export interface Inputs {
  buildID: string
  platform?: string
  tags: string[]
  token?: string
}

export function getInputs(): Inputs {
  return {
    buildID: core.getInput('build-id'),
    platform: core.getInput('platform'),
    tags: parseCSV(core.getInput('tags')),
    token: core.getInput('token') || process.env.DEPOT_TOKEN,
  }
}

function parseCSV(source: string): string[] {
  source = source.trim()

  if (source === '') return []

  const items: string[][] = csv.parse(source, {
    columns: false,
    relaxColumnCount: true,
    relaxQuotes: true,
    skipEmptyLines: true,
  })

  return items
    .flatMap((i) => i)
    .map((i) => i.trim())
    .filter((i) => i)
}
