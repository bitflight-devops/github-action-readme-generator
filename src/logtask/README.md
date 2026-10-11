[`LogTask`](./index.ts) formats progress and error messages with a task name, step, and emoji. Chalk supplies local colors; `@actions/core` sends messages and workflow commands to GitHub Actions.

`start()` opens a group when `GITHUB_ACTIONS=true`. The same instance closes it through `success()`, `fail()`, or `end()`. Completion without a matching start emits only the message, and repeated cleanup does not end another task's group. Outside GitHub Actions, starts and completions remain ordinary log messages.

Workflow groups share an output stream across tasks. Section updaters open groups around synchronous rendering and close them in `finally`, so a thrown renderer or filesystem error still closes its group before propagating. Usage prepares descriptions asynchronously before opening its render group; overlapping preparation therefore does not create overlapping groups.
