# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues in `iuriioapps/michigo`. Use the `gh` CLI for all operations. `gh` infers the repo from the git remote when you run it inside a clone.

## Conventions

| Operation | Command |
| --- | --- |
| Create an issue | `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies. |
| Read an issue | `gh issue view <number> --json number,title,body,labels,comments` |
| List issues | `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] \| {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with the applicable `--label` and `--state` filters |
| Comment on an issue | `gh issue comment <number> --body "..."` |
| Apply or remove labels | `gh issue edit <number> --add-label "..."` or `--remove-label "..."` |
| Close | `gh issue close <number> --comment "..."` |

## Sub-issues

Make an issue a sub-issue of a parent with `gh issue create --parent <parent> ...`, or with `gh issue edit <parent> --add-sub-issue <child>` afterwards (`gh` 2.94+).

With an older `gh`, use `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>`. The id is the database id, as described in the wayfinding blocking section. Without sub-issues, put `Part of #<parent>` at the top of the child body.

## Pull requests as a triage surface

**PRs as a request surface: no.** Set this to `yes` if this repo treats external PRs as feature requests. `/triage` reads this flag.

When set to `yes`, PRs run through the same labels and states as issues, with the `gh pr` equivalents:

| Operation | Command |
| --- | --- |
| Read a PR | `gh pr view <number> --comments`, and `gh pr diff <number>` for the diff |
| List external PRs for triage | `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] \| select(.author_association \| IN("OWNER","MEMBER","COLLABORATOR") \| not) \| {number, title, author: .user.login, author_association, labels: [.labels[].name]}'` |
| Comment, label, close | `gh pr comment`, `gh pr edit --add-label` or `--remove-label`, `gh pr close` |

GitHub shares one number space across issues and PRs, so a bare `#42` can be either. Resolve it with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Read it with the read command in the conventions table.

## Wayfinding operations

Used by `/wayfinder`. The map is a single issue, and its child issues are the tickets.

### Map

A single issue labelled `wayfinder:map` that holds the Notes, Decisions-so-far and Fog body. Create it with `gh issue create --label wayfinder:map`.

### Child ticket

An issue linked to the map as a GitHub sub-issue. Where sub-issues are not enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body.

Labels are `wayfinder:<type>`, where the type is `research`, `prototype`, `grilling` or `task`. A claimed ticket is assigned to the driving dev.

### Blocking

Use GitHub's native issue dependencies, which the UI shows. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`.

`<blocker-db-id>` is the blocker's numeric database id from `gh api repos/<owner>/<repo>/issues/<n> --jq .id`. It is not the `#number` or the `node_id`. GitHub reports `issue_dependencies_summary.blocked_by`, which counts open blockers only.

Where dependencies are not available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.

### Frontier query

List the map's open children with `gh issue list --state open`, scoped to the map's sub-issues or task list. Drop each child that has an assignee or an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line). The first remaining child in map order wins.

### Claim

`gh issue edit <n> --add-assignee @me`. This is the session's first write.

### Resolve

Run `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`. Then append a context pointer (gist and link) to the map's Decisions-so-far.
