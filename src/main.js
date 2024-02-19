const core = require('@actions/core')
const github = require('@actions/github')
const { createAddLabelsSet, createRemoveLabelsSet } = require('./labels')

/**
 * Fetches the current labels on the pull request.
 * @param octokit The Octokit instance.
 * @param parameters The parameters for the GitHub API call.
 * @returns {Promise<Set<string>>} A promise that resolves to a set of label names.
 */
async function getCurrentLabels(octokit, parameters) {
  const { data: labels } =
    await octokit.rest.issues.listLabelsOnIssue(parameters)
  return new Set(labels.map(label => label.name))
}

/**
 * Adds labels to the pull request if they are not already applied.
 * @param octokit The Octokit instance.
 * @param parameters The parameters for the GitHub API call.
 * @param labelsToAdd The labels to add.
 * @param currentLabels The current labels on the pull request.
 */
async function addLabelsIfNeeded(
  octokit,
  parameters,
  labelsToAdd,
  currentLabels
) {
  const labelsToAddFiltered = labelsToAdd.filter(
    label => !currentLabels.has(label)
  )
  if (labelsToAddFiltered.length > 0) {
    await octokit.rest.issues.addLabels({
      ...parameters,
      labels: labelsToAddFiltered
    })
  }
}

/**
 * Removes labels from the pull request if they are applied.
 * @param octokit The Octokit instance.
 * @param parameters The parameters for the GitHub API call.
 * @param labelsToRemove The labels to remove.
 * @param currentLabels The current labels on the pull request.
 */
async function removeLabelsIfNeeded(
  octokit,
  parameters,
  labelsToRemove,
  currentLabels
) {
  const labelsToRemoveFiltered = labelsToRemove.filter(label =>
    currentLabels.has(label)
  )
  for (const label of labelsToRemoveFiltered) {
    try {
      core.debug(`Removing label: ${label}`)
      await octokit.rest.issues.removeLabel({
        ...parameters,
        name: label
      })
    } catch (error) {
      core.error(`Error removing label ${label}: ${error.message}`)
    }
  }
}

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
    const token = core.getInput('githubToken')

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

    // Fetch current labels before any operations
    let currentLabels = await getCurrentLabels(octokit, parameters)

    // Add labels if needed
    await addLabelsIfNeeded(octokit, parameters, labelsToAdd, currentLabels)

    // Refresh current labels after adding labels before removing
    currentLabels = await getCurrentLabels(octokit, parameters)

    // Remove labels if needed
    await removeLabelsIfNeeded(
      octokit,
      parameters,
      labelsToRemove,
      currentLabels
    )

    // Final fetch of labels to set output accurately
    const labelsAfterAction = await getCurrentLabels(octokit, parameters)
    core.setOutput('labelsAfterAction', Array.from(labelsAfterAction))
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
