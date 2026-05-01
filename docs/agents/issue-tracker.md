# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues in `sruj75/the-mom-test-simulator`.

Use the `gh` CLI for issue operations. Until this folder has a Git remote configured, pass `--repo sruj75/the-mom-test-simulator` explicitly.

## Conventions

- **Create an issue**: `gh issue create --repo sruj75/the-mom-test-simulator --title "..." --body "..."`
- **Read an issue**: `gh issue view <number> --repo sruj75/the-mom-test-simulator --comments`, filtering comments by `jq` and also fetching labels when needed.
- **List issues**: `gh issue list --repo sruj75/the-mom-test-simulator --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --repo sruj75/the-mom-test-simulator --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --repo sruj75/the-mom-test-simulator --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --repo sruj75/the-mom-test-simulator --comment "..."`

After the repo is initialized locally and `origin` points to GitHub, `gh` can infer the repo automatically from `git remote -v`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue in `sruj75/the-mom-test-simulator`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --repo sruj75/the-mom-test-simulator --comments`.
