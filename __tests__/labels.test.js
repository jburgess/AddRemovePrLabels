const { createAddLabelsSet, createRemoveLabelsSet } = require('../src/labels') // Adjust the path to match your file structure

describe('Label Utilities', () => {
  describe('createLabelsArray', () => {
    it('should create a unique array of labels to add, excluding removals', () => {
      const labelsToAdd = 'enhancement, bug, duplicate'
      const labelsToRemove = 'bug, invalid'
      const result = createAddLabelsSet(labelsToAdd, labelsToRemove)
      expect(result).toEqual(new Set(['enhancement', 'duplicate']))
    })

    it('should handle empty strings without errors', () => {
      const labelsToAdd = ''
      const labelsToRemove = ''
      const result = createAddLabelsSet(labelsToAdd, labelsToRemove)
      expect(result).toEqual(new Set([]))
    })

    it('should return an empty array when all labels to add are also marked for removal', () => {
      const labelsToAdd = 'bug, enhancement'
      const labelsToRemove = 'enhancement, bug'
      const result = createAddLabelsSet(labelsToAdd, labelsToRemove)
      expect(result).toEqual(new Set([]))
    })

    it('should handle null inputs by returning an empty array', () => {
      const result = createAddLabelsSet(null, null)
      expect(result).toEqual(new Set([]))
    })

    it('should ignore extra whitespace and treat labels case-sensitively', () => {
      const labelsToAdd = 'bug  ,  enhancement'
      const labelsToRemove = 'Bug'
      const result = createAddLabelsSet(labelsToAdd, labelsToRemove)
      expect(result).toEqual(new Set(['bug', 'enhancement']))
    })
  })

  describe('createLabelsToRemoveArray', () => {
    it('should create an array of labels to remove', () => {
      const labelsToRemove = 'bug, invalid, duplicate'
      const result = createRemoveLabelsSet(labelsToRemove)
      expect(result).toEqual(new Set(['bug', 'invalid', 'duplicate']))
    })

    it('should handle empty strings without errors', () => {
      const labelsToRemove = ''
      const result = createRemoveLabelsSet(labelsToRemove)
      expect(result).toEqual(new Set([]))
    })

    it('should handle null inputs by returning an empty array', () => {
      const result = createRemoveLabelsSet(null)
      expect(result).toEqual(new Set([]))
    })

    it('should ignore extra whitespace around labels', () => {
      const labelsToRemove = '  bug  ,  invalid  '
      const result = createRemoveLabelsSet(labelsToRemove)
      expect(result).toEqual(new Set(['bug', 'invalid']))
    })
  })
})
