const { run } = require('../src/main')
const core = require('@actions/core')
const github = require('@actions/github')

jest.mock('@actions/core')

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn().mockReturnValue({
    rest: {
      issues: {
        addLabels: jest.fn().mockResolvedValue({}),
        removeLabel: jest.fn().mockResolvedValue({}),
        listLabelsOnIssue: jest
          .fn()
          .mockResolvedValueOnce({
            data: [{ name: 'A' }, { name: 'D' }]
          })
          .mockResolvedValueOnce({
            data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }]
          })
          .mockResolvedValueOnce({
            data: [{ name: 'A' }, { name: 'B' }]
          })
          .mockResolvedValueOnce({
            data: []
          })
          .mockResolvedValueOnce({
            data: [{ name: 'C' }]
          })
          .mockResolvedValue({
            data: [{ name: 'C' }]
          })
      }
    }
  }),
  context: {
    eventName: 'pull_request',
    payload: {
      pull_request: {
        base: { repo: { name: 'repoName' } },
        number: 1
      },
      repository: {
        owner: { login: 'ownerName' }
      }
    }
  }
}))

const parameters = {
  owner: 'ownerName',
  repo: 'repoName',
  issue_number: 1
}

describe('Add RemovPR Labels Test Suite', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    core.getInput.mockImplementation()
  })

  it('should successfully add and remove labels based on inputs', async () => {
    // Mock implementation of core.getInput to return different values based on input name
    core.getInput.mockImplementation(name => {
      switch (name) {
        case 'labelsToAdd':
          return 'A,B,C'
        case 'labelsToRemove':
          return 'C,D,E'
        case 'githubToken':
          return 'fake-token' // Mocking GITHUB_TOKEN if required for octokit initialization
        default:
          return ''
      }
    })
    await run()
    expect(github.getOctokit().rest.issues.addLabels).toHaveBeenCalledWith(
      expect.objectContaining({
        ...parameters,
        labels: expect.arrayContaining(['B']) // Checks if the labels string includes "A, B"
      })
    )

    expect(github.getOctokit().rest.issues.removeLabel).toHaveBeenCalledWith(
      expect.objectContaining({
        ...parameters,
        name: 'C'
      })
    )

    expect(github.getOctokit().rest.issues.removeLabel).toHaveBeenCalledWith(
      expect.objectContaining({
        ...parameters,
        name: 'D'
      })
    )

    // This assertion checks that removeLabel is called, adjust as necessary for your implementation
    expect(github.getOctokit().rest.issues.addLabels).toHaveBeenCalledTimes(1) // Assuming two labels to remove based on the mock
    expect(github.getOctokit().rest.issues.removeLabel).toHaveBeenCalledTimes(2) // Assuming two labels to remove based on the mock

    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('should handle null remove labels', async () => {
    // Mock implementation of core.getInput to return different values based on input name
    core.getInput.mockImplementation(name => {
      switch (name) {
        case 'labelsToAdd':
          return 'A,B,C'
        case 'GITHUB_TOKEN':
          return 'fake-token' // Mocking GITHUB_TOKEN if required for octokit initialization
        default:
          return ''
      }
    })
    await run()
    expect(github.getOctokit().rest.issues.addLabels).toHaveBeenCalledWith(
      expect.objectContaining({
        ...parameters,
        labels: expect.arrayContaining(['A', 'B', 'C'])
      })
    )
    expect(github.getOctokit().rest.issues.addLabels).toHaveBeenCalledTimes(1)
    expect(github.getOctokit().rest.issues.removeLabel).toHaveBeenCalledTimes(0)
  })

  it('should handle null add labels', async () => {
    // Mock implementation of core.getInput to return different values based on input name
    core.getInput.mockImplementation(name => {
      switch (name) {
        case 'labelsToRemove':
          return 'C'
        case 'GITHUB_TOKEN':
          return 'fake-token' // Mocking GITHUB_TOKEN if required for octokit initialization
        default:
          return ''
      }
    })
    await run()

    expect(github.getOctokit().rest.issues.removeLabel).toHaveBeenCalledWith(
      expect.objectContaining({
        ...parameters,
        name: 'C'
      })
    )
    expect(github.getOctokit().rest.issues.addLabels).toHaveBeenCalledTimes(0)
    expect(github.getOctokit().rest.issues.removeLabel).toHaveBeenCalledTimes(1)
  })

  it('should handle when labelsToAdd and labelsToRemove are not supplied', async () => {
    await run()
    expect(core.setFailed).toHaveBeenCalledWith(
      'You must provide at least one of labelsToAdd or labelsToRemove'
    )
    expect(github.getOctokit().rest.issues.addLabels).toHaveBeenCalledTimes(0)
    expect(github.getOctokit().rest.issues.removeLabel).toHaveBeenCalledTimes(0)
  })

  it('should handle errors gracefully', async () => {
    // Simulate an error condition, e.g., by throwing an error when trying to add labels
    core.getInput.mockImplementation(name => {
      switch (name) {
        case 'labelsToAdd':
          return 'A,B,C'
        case 'GITHUB_TOKEN':
          return 'fake-token' // Mocking GITHUB_TOKEN if required for octokit initialization
        default:
          return ''
      }
    })
    github
      .getOctokit()
      .rest.issues.addLabels.mockRejectedValue(new Error('Test error'))
    await run()

    expect(core.setFailed).toHaveBeenCalledWith('Test error')
  })
})
