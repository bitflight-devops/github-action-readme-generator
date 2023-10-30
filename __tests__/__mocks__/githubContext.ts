import { context } from '@actions/github';
import type { Context } from '@actions/github/lib/context.js';
// Shallow clone original @actions/github context
export const mockContext = (): Context => {
  return {
    ...context,
    issue: { ...context.issue },
    repo: { ...context.repo },
  };
};

// afterEach(() => {
//   // Restore original @actions/github context
//   Object.defineProperty(github, 'context', {
//     value: originalContext,
//   });
// });
// export const createMockContext = (): Context => {
//   return {
//     payload: {},
//     eventName: 'push',
//     sha: '1234567890abcdef',
//     ref: 'refs/heads/main',
//     workflow: 'Test Workflow',
//     action: 'Test Action',
//     actor: 'testuser',
//     issue: {
//       owner: 'testowner',
//       repo: 'testrepo',
//       number: 1,
//     },
//     repo: {
//       owner: 'testowner',
//       repo: 'testrepo',
//     },
//     eventName: 'push',
//     sha: '1234567890abcdef',
//     ref: 'refs/heads/main',
//     workflow: 'Test Workflow',
//     action: 'Test Action',
//     actor: 'testuser',
//     issue: {},
//     repo: {
//       owner: 'testowner',
//       repo: 'testrepo',
//     },
//     repoUrl: 'https://github.com/testowner/testrepo',
//     runId: 123_456_789,
//     runNumber: 1,
//     serverUrl: 'https://github.com',
//     workflowUrl: 'https://github.com/testowner/testrepo/actions/runs/123456789',
//   };
// };
