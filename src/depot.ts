import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import * as io from '@actions/io'
import * as publicOIDC from '@depot/actions-public-oidc-client'
import {execa, Options} from 'execa'
import type {Inputs} from './context'

export async function isInstalled(): Promise<boolean> {
  try {
    const {exitCode} = await exec.getExecOutput('depot', [], {ignoreReturnCode: true, silent: true})
    return exitCode === 0
  } catch {
    return false
  }
}

export async function version() {
  await exec.exec('depot', ['version'], {failOnStdErr: false})
}

async function execDepot(cmd: string, args: string[], options?: Options) {
  const resolved = await io.which(cmd, true)
  console.log(`[command]${resolved} ${args.join(' ')}`)
  const proc = execa(resolved, args, {...options, reject: false, stdin: 'inherit', stdout: 'pipe', stderr: 'pipe'})

  if (proc.pipeStdout) proc.pipeStdout(process.stdout)
  if (proc.pipeStderr) proc.pipeStderr(process.stdout)

  function signalHandler(signal: NodeJS.Signals) {
    proc.kill(signal)
  }

  process.on('SIGINT', signalHandler)
  process.on('SIGTERM', signalHandler)

  try {
    const res = await proc
    if (res.stderr.length > 0 && res.exitCode != 0) {
      throw new Error(`failed with: ${res.stderr.match(/(.*)\s*$/)?.[0]?.trim() ?? 'unknown error'}`)
    }
  } finally {
    process.off('SIGINT', signalHandler)
    process.off('SIGTERM', signalHandler)
  }
}

export async function pull(inputs: Inputs) {
  const args = [...flag('--platform', inputs.platform), ...flag('--tag', inputs.tags)]

  let token = inputs.token ?? process.env.DEPOT_TOKEN

  const isOSSPullRequest =
    !token &&
    github.context.eventName === 'pull_request' &&
    github.context.payload.repository?.private === false &&
    github.context.payload.pull_request &&
    github.context.payload.pull_request.head?.repo?.full_name !== github.context.payload.repository?.full_name

  if (isOSSPullRequest) {
    try {
      core.info('Attempting to acquire open-source pull request OIDC token')
      const oidcToken = await publicOIDC.getIDToken('https://depot.dev')
      core.info(`Using open-source pull request OIDC token for Depot authentication`)
      token = oidcToken
    } catch (err) {
      core.info(`Unable to exchange open-source pull request OIDC token for temporary Depot token: ${err}`)
    }
  }

  await execDepot('depot', ['pull', ...args, inputs.buildID], {
    env: {...process.env, ...(token ? {DEPOT_TOKEN: token} : {})},
  })
}

function flag(name: string, value: string | string[] | boolean | undefined): string[] {
  if (!value) return []
  if (value === true) return [name]
  if (Array.isArray(value)) return value.flatMap((item) => [name, item])
  return [name, value]
}
