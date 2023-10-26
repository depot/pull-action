import * as core from '@actions/core'
import * as context from './context'
import * as depot from './depot'

async function main() {
  if (!(await depot.isInstalled())) {
    return core.setFailed(
      'Depot CLI is not installed. See https://github.com/depot/setup-action to install it before this step.',
    )
  }

  await core.group('Depot version', async () => {
    await depot.version()
  })

  const inputs = context.getInputs()
  await depot.pull(inputs)
}

main().catch((error) => {
  if (error instanceof Error) {
    core.setFailed(error.message)
  } else {
    core.setFailed(`${error}`)
  }
})
