const core = require('@actions/core')
const github = require('@actions/github')
const { createAddLabelsSet, createRemoveLabelsSet } = require('./labels')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const eventName = github.context.eventName
    if (!eventName.includes('pull_request')) {
      core.setFailed(
        `This action is intended to run only on pull_request events, not on ${eventName} events.`
      )
      return
    }

    const labelsToAddStr = core.getInput('labelsToAdd', { required: false })
    const labelsToRemoveStr = core.getInput('labelsToRemove', {
      required: false
    })
    const token = core.getInput('GITHUB_TOKEN')

    if (!labelsToAddStr && !labelsToRemoveStr) {
      core.setFailed(
        'You must provide at least one of labelsToAdd or labelsToRemove'
      )
      return
    }

    const labelsToAdd = Array.from(
      createAddLabelsSet(labelsToAddStr, labelsToRemoveStr)
    )
    const labelsToRemove = Array.from(createRemoveLabelsSet(labelsToRemoveStr))

    const octokit = github.getOctokit(token)
    const owner = github.context.payload.repository.owner.login
    const repo = github.context.payload.pull_request.base.repo.name
    const pullRequestNumber = github.context.payload.pull_request.number

    const parameters = {
      owner,
      repo,
      issue_number: pullRequestNumber
    }

    // Add labels to the pull request if the Set contains any labels
    if (labelsToAdd.length > 0) {
      // Convert the Set to a Comma-Separated String
      await octokit.rest.issues.addLabels({
        ...parameters,
        labels: labelsToAdd.join(', ')
      })
    }

    // Remove labels from the pull request if the Set contains any labels
    if (labelsToRemove.length > 0) {
      for (const label of labelsToRemove) {
        try {
          core.debug(`Removing label: ${label}`)
          await octokit.rest.issues.removeLabel({
            ...parameters,
            name: label
          })
        } catch (error) {
          // Log the error and continue with the next label
          core.error(`Error removing label ${label}: ${error.message}`)
        }
      }
    }

    // Get the labels for the pull request after the changes
    const { data: labelsAfterAction } =
      await octokit.rest.issues.listLabelsOnIssue(parameters)

    // Log the current timestamp, wait, then log the new timestamp
    core.debug(new Date().toTimeString())
    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Labels to add: ${labelsToAddStr}`)
    core.debug(`Labels to remove: ${labelsToRemoveStr}`)

    // Set outputs for other workflow steps to use
    core.setOutput('labelsAfterAction', labelsAfterAction)
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
