/**
 * This utility function performs label merging and removal operations.
 */

/**
 * Splits a string into an array of non-empty, trimmed strings based on a comma separator.
 * @param {string} inputString - The string to be processed.
 * @returns {Set<string>} An array of non-empty, trimmed strings.
 */
function _splitMapFilter(inputString) {
  if (inputString === null || inputString === undefined) {
    return new Set()
  }
  return new Set(
    inputString
      .split(',')
      .map(label => label.trim())
      .filter(label => label.length > 0)
  )
}

/**
 * This function creates an array of labels to add to a pull request
 * given a string of comma-separated labels to add and a string of
 * comma-separated labels to remove.
 * Utilizes Set to ensure uniqueness and simplify addition/removal of labels.
 * @param {string} labelsToAdd - The string of comma-separated labels to add.
 * @param {string} labelsToRemove - The string of comma-separated labels to remove.
 * @returns {Set<string>} An array of unique labels to add to a pull request.
 */
function createAddLabelsSet(labelsToAdd, labelsToRemove) {
  // Handle null or undefined for labelsToAdd and labelsToRemove
  const addSet = _splitMapFilter(labelsToAdd)
  const removeSet = _splitMapFilter(labelsToRemove)

  // Remove labels in removeSet from addSet
  for (const label of removeSet) {
    addSet.delete(label)
  }
  return addSet
}

/**
 * This function creates an array of labels to remove from a pull request.
 * @param {string} labelsToRemove - The string of comma-separated labels to remove.
 * @returns {Set<string>} An array of labels to remove from a pull request.
 */
function createRemoveLabelsSet(labelsToRemove) {
  return _splitMapFilter(labelsToRemove)
}

module.exports = { createAddLabelsSet, createRemoveLabelsSet }
