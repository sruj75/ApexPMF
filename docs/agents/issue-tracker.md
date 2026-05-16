# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues in `sruj75/zeroone`.

Use the `gh` CLI for issue operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels when needed.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

If the current shell is outside this repo or targets another remote, use `--repo sruj75/zeroone` explicitly.

## When a skill says "publish to the issue tracker"

Create a GitHub issue in `sruj75/zeroone`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --repo sruj75/zeroone --comments`.
