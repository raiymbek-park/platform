import { readFileSync } from 'node:fs'

const SENTINEL = '__via_skill__'

const readStdin = () => {
  try {
    return readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

const parse = raw => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const payload = parse(readStdin())
if (payload?.tool_name !== 'Bash') process.exit(0)

const command = payload?.tool_input?.command ?? ''
if (command.includes(SENTINEL)) process.exit(0)

const rules = [
  { re: /\bgit\s+commit\b/, skill: '/git commit create' },
  { re: /\bgit\s+push\b/, skill: '/git push' },
  { re: /\bgit\s+(switch\s+-c\b|switch\s+--create\b|checkout\s+-b\b|branch\s+[^\s-])/, skill: '/git branch create' },
  { re: /\bgit\s+merge\b/, skill: '/git merge' },
  { re: /\bgit\s+rebase\b/, skill: '/git rebase' },
  { re: /\bgh\s+pr\s+(create|merge|edit|comment|close|ready|review)\b/, skill: '/github pull-request create · /github code-review resolve' },
  { re: /\bgh\s+issue\s+(create|edit|comment|close)\b/, skill: '/github issue create · /github issue update' },
]

const hit = rules.find(rule => rule.re.test(command))
if (!hit) process.exit(0)

const message = [
  '⛔ Blocked: this is a skill-owned git/GitHub operation, run from raw Bash.',
  '',
  'Raw git/gh mutations must go through the /git and /github skills. They enforce',
  'conventional branch names, conventional commits, PR title+emoji format, the',
  'no-promotional-text rule, and the no-AI-co-author trailer. A hand-typed command',
  'skips every one of those checks — which is exactly what keeps happening.',
  '',
  `→ Route this through: ${hit.skill}`,
  '',
  'All entrypoints: /git branch create · /git commit create · /git push · /git merge ·',
  '/git rebase · /github pull-request create · /github pull-request update ·',
  '/github code-review resolve · /github issue create · /github issue update',
  '',
  'If you are ALREADY executing one of those skills, run the exact command as written',
  'in the skill file (do not retype it from memory) and it will pass the guard.',
].join('\n')

process.stderr.write(message)
process.exit(2)
