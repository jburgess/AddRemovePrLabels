# Add Remove PR Labels

[![GitHub Super-Linter](https://github.com/jburgess/AddRemovePrLabels/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)

This action adds or removes labels from a pull request based on input
parameters.

If a label is specified in both `labelsToAdd` and `labelsToRemove`, it will be
removed.

## Usage

```yaml
steps:
  - name: Label Pull Request
    id: labelPr
    uses: jburgess/AddRemovePrLabels@v1.0.0
    with:
      githubToken: ${{ github.token }}
      labelsToAdd: label1,label2
      labelsToRemove: label2,label3

  - name: Print Labels
    id: labelsAfterAction
    run: echo "${{ steps.labelPr.outputs.labelsAfterAction }}"
```

The above example will add `label1` and remove `label2` and `label3` from the
pull request.
If `label2` is present, it will be removed.
If `label3` is present, it will be removed. If `label1` is not present,
it will be added.
