# FaithDive - Claude Code Guidelines

## Development Philosophy

**CRITICAL: All development on FaithDive MUST use superpowers-driven workflows.** Same rigor as every other project Mike develops with Claude Code. No exceptions.

### Non-Negotiable Rules for ALL Claude Code Agents:

1. **EVERY agent MUST use superpowers for EVERY task** - no exceptions
2. **NO task is too small** for superpowers - even typo fixes go through proper workflow
3. **NO agent operates autonomously** without superpowers and user consent
4. **100% compliance** to this directive on this project and any other project I develop with Claude Code
5. **All spawned subagents** must follow these same rules - superpowers are mandatory at every level

**If you are a Claude Code agent reading this:** You are required to use the appropriate superpowers skill for the task at hand. Do not proceed with coding, debugging, or implementation without invoking the relevant superpower. This is not optional.

## Mandatory Superpowers Workflows

### Before ANY Coding

1. **`superpowers:brainstorming`** - Use for ALL design decisions before writing code
   - Refines rough ideas through collaborative questioning
   - Explores alternatives and validates approaches incrementally
   - Skip only for purely mechanical changes (typo fixes, etc.)

2. **`superpowers:writing-plans`** - Create detailed implementation plans
   - For engineers with zero codebase context
   - Include exact file paths, complete code examples, verification steps

### During Implementation

3. **`superpowers:test-driven-development`** - MANDATORY for all features
   - Write the test FIRST
   - Watch it FAIL (Red)
   - Write minimal code to pass (Green)
   - Refactor if needed
   - **Never skip TDD**

4. **`superpowers:subagent-driven-development`** - For independent tasks
   - Dispatch fresh subagent for each task
   - Code review between tasks
   - Enables fast iteration with quality gates

5. **`superpowers:systematic-debugging`** - For ANY bug or unexpected behavior
   - Four phases: root cause investigation, pattern analysis, hypothesis testing, implementation
   - Understand BEFORE attempting fixes

6. **`superpowers:using-git-worktrees`** - For feature isolation
   - Create isolated worktrees for feature work
   - Smart directory selection and safety verification

### Quality Assurance

7. **`superpowers:requesting-code-review`** - Before completing any task
   - Review implementation against plan/requirements
   - Catch issues before they're committed

8. **`superpowers:verification-before-completion`** - Before claiming work is done
   - Run verification commands
   - Confirm output before success claims
   - Evidence before assertions, ALWAYS

9. **`superpowers:receiving-code-review`** - When getting feedback
   - Requires technical rigor, not performative agreement
   - Verify suggestions before implementing

### Specialized Workflows

10. **`superpowers:dispatching-parallel-agents`** - For 3+ independent failures
    - Investigate and fix independent problems concurrently

11. **`superpowers:root-cause-tracing`** - When errors occur deep in execution
    - Trace bugs backward through call stack
    - Add instrumentation when needed

12. **`superpowers:condition-based-waiting`** - For flaky tests
    - Replace arbitrary timeouts with condition polling
    - Wait for actual state changes

13. **`superpowers:defense-in-depth`** - When invalid data causes deep failures
    - Validate at every layer data passes through
    - Make bugs structurally impossible

14. **`superpowers:testing-anti-patterns`** - When writing/changing tests
    - Prevent testing mock behavior instead of real code
    - No test-only methods in production code
    - Don't mock without understanding dependencies

15. **`superpowers:finishing-a-development-branch`** - When implementation is complete
    - Guides completion with merge, PR, or cleanup options

16. **`superpowers:executing-plans`** - Execute plans in controlled batches
    - Review checkpoints between batches

### Skill Development

17. **`superpowers:writing-skills`** - For creating new skills
    - TDD for process documentation
    - Test with subagents before deploying

18. **`superpowers:testing-skills-with-subagents`** - Verify skills work under pressure
    - RED-GREEN-REFACTOR for documentation

19. **`superpowers:sharing-skills`** - Contribute skills upstream via PR

## Workflow Decision Tree

```
Starting new work?
├── Is it a bug/unexpected behavior?
│   └── YES → superpowers:systematic-debugging
├── Is it a new feature/significant change?
│   ├── Need to understand approach? → superpowers:brainstorming
│   ├── Ready to plan? → superpowers:writing-plans
│   └── Ready to implement? → superpowers:test-driven-development
├── Is it a refactor?
│   └── superpowers:test-driven-development (ensure tests exist first)
└── Is it exploration/research?
    └── Use Task tool with Explore agent

During implementation:
├── Multiple independent tasks? → superpowers:subagent-driven-development
├── Flaky tests? → superpowers:condition-based-waiting
├── Deep validation issues? → superpowers:defense-in-depth
└── Always before claiming done → superpowers:verification-before-completion

Before merging:
├── superpowers:requesting-code-review
└── superpowers:finishing-a-development-branch
```

## Product Directives

FaithDive is a personal Bible study PWA. Privacy and offline capability are non-negotiable.

### Privacy Model
- All user data stays in the browser (sql.js / LocalStorage)
- No user accounts, no analytics, no tracking
- The only external call is the API.Bible proxy through Express (protects the API key)
- Offline-capable after first load via service worker caching

### Technology Stack
- **Runtime:** Node.js
- **Backend:** Express.js (serves static files + API proxy)
- **Frontend:** Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Database:** sql.js (SQLite in the browser)
- **Testing:** Jest with supertest
- **Caching:** Service worker with stale-while-revalidate strategy

### Code Style
- Frontend: ES6 modules (`import/export`) in `public/js/`
- Server: CommonJS (`require/module.exports`) in `server/`
- No build step — frontend files are served directly from `public/`
- All async functions must handle errors explicitly

### Testing Requirements
- **100% passing tests required** - no exceptions
- All tests must pass before any code is committed
- Tests live in `server/__tests__/`
- Frontend tests use file-based static analysis (no jsdom/browser mocking)
- Integration tests for API endpoints
- Structural consistency tests guard against drift between sw.js, app.js, and index.html
- **TDD is mandatory** - no exceptions
- Code coverage is secondary to test quality

### Git Workflow
- Single `main` branch
- Conventional commit messages
- All tests pass before commit

### Directory Structure
```
FaithDive/
├── public/                 # Frontend (served directly, no build step)
│   ├── css/style.css       # Styling with CSS variables
│   ├── js/                 # ES6 modules
│   │   ├── app.js          # Main application logic
│   │   ├── bibleSearch.js  # Bible API integration
│   │   ├── database.js     # sql.js wrapper
│   │   ├── favorites.js    # Favorites management
│   │   ├── journal.js      # Journal management
│   │   └── theme.js        # Theme switching
│   ├── icons/              # App icons
│   ├── index.html          # Single-page app shell
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker
├── server/                 # Express backend
│   ├── __tests__/          # All tests (Jest)
│   ├── routes/bible.js     # Bible API proxy routes
│   ├── services/bibleApi.js # API.Bible client
│   ├── config.js           # Configuration
│   └── index.js            # Server entry point
├── .env                    # API keys (not committed)
├── CLAUDE.md               # This file
└── package.json            # Dependencies
```

## Quick Reference

| Situation | Superpower |
|-----------|------------|
| New feature idea | `brainstorming` |
| Ready to code | `test-driven-development` |
| Bug to fix | `systematic-debugging` |
| Writing tests | `testing-anti-patterns` |
| Flaky tests | `condition-based-waiting` |
| About to commit | `verification-before-completion` |
| PR ready | `requesting-code-review` |
| Got feedback | `receiving-code-review` |
| Branch done | `finishing-a-development-branch` |

---

**Remember:** FaithDive serves people in their faith journey. Quality and reliability matter. Every test, every review, every verification step is worth doing right.
