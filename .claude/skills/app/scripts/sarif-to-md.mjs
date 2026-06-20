#!/usr/bin/env node
// Convert a SARIF file into a grouped, human-readable Markdown report.
//
// Usage:
//   node sarif-to-md.mjs <input.sarif> [--out <output.md>]
//
// Reads SARIF v2.1.0 (the format fallow emits via `fallow --format sarif`),
// groups results by rule and severity, and writes a Markdown summary.
// Standalone: no dependencies beyond Node built-ins.

import { readFileSync, writeFileSync } from 'node:fs'

const SEVERITY_ORDER = ['error', 'warning', 'note', 'none']
const SEVERITY_LABEL = { error: '🔴 error', warning: '🟡 warning', note: '🔵 note', none: '⚪ none' }

const parseArgs = argv => {
  const args = argv.slice(2)
  const outFlag = args.findIndex(a => a === '--out' || a === '-o')
  const out = outFlag === -1 ? 'fallow-report.md' : args[outFlag + 1]
  const input = args.find(a => !a.startsWith('-') && a !== out)
  return { input, out }
}

const normalizeLevel = level => (SEVERITY_ORDER.includes(level) ? level : 'warning')

const locationOf = result => {
  const physical = result.locations?.[0]?.physicalLocation
  const uri = physical?.artifactLocation?.uri
  const line = physical?.region?.startLine
  if (!uri) return '(no location)'
  return line ? `${uri}:${line}` : uri
}

const ruleTitleOf = (rulesById, ruleId) => {
  const text = rulesById.get(ruleId)?.shortDescription?.text
  return text ? `${ruleId} — ${text}` : ruleId
}

const collect = sarif => {
  const runs = sarif.runs ?? []
  const rulesById = new Map()
  const results = []
  runs.forEach(run => {
    ;(run.tool?.driver?.rules ?? []).forEach(rule => rulesById.set(rule.id, rule))
    ;(run.results ?? []).forEach(result =>
      results.push({
        ruleId: result.ruleId ?? '(unknown rule)',
        level: normalizeLevel(result.level),
        message: result.message?.text ?? '',
        location: locationOf(result),
      }),
    )
  })
  const toolName = runs[0]?.tool?.driver?.name ?? 'fallow'
  const toolVersion = runs[0]?.tool?.driver?.version ?? ''
  return { results, rulesById, toolName, toolVersion }
}

const countBy = (results, key) =>
  results.reduce((acc, r) => ({ ...acc, [r[key]]: (acc[r[key]] ?? 0) + 1 }), {})

const groupByRule = results =>
  results.reduce((acc, r) => ({ ...acc, [r.ruleId]: [...(acc[r.ruleId] ?? []), r] }), {})

const severityWeight = level => SEVERITY_ORDER.indexOf(level)

const renderSummary = (results, toolName, toolVersion) => {
  const bySeverity = countBy(results, 'level')
  const tool = toolVersion ? `${toolName} v${toolVersion}` : toolName
  const rows = SEVERITY_ORDER.filter(s => bySeverity[s]).map(
    s => `| ${SEVERITY_LABEL[s]} | ${bySeverity[s]} |`,
  )
  return [
    '# Fallow report',
    '',
    `**Tool:** ${tool} · **Total findings:** ${results.length}`,
    '',
    '| Severity | Count |',
    '|----------|-------|',
    ...(rows.length ? rows : ['| — | 0 |']),
    '',
  ].join('\n')
}

const renderRuleSection = (rulesById, ruleId, items) => {
  const sorted = [...items].sort((a, b) => severityWeight(a.level) - severityWeight(b.level))
  const lines = sorted.map(
    r => `- ${SEVERITY_LABEL[r.level]} \`${r.location}\`${r.message ? ` — ${r.message}` : ''}`,
  )
  return [`## ${ruleTitleOf(rulesById, ruleId)} (${items.length})`, '', ...lines, ''].join('\n')
}

const render = ({ results, rulesById, toolName, toolVersion }) => {
  if (!results.length) {
    return `${renderSummary(results, toolName, toolVersion)}\n✅ No findings.\n`
  }
  const grouped = groupByRule(results)
  const rankOf = ruleId => Math.min(...grouped[ruleId].map(r => severityWeight(r.level)))
  const sections = Object.keys(grouped)
    .sort((a, b) => rankOf(a) - rankOf(b) || grouped[b].length - grouped[a].length)
    .map(ruleId => renderRuleSection(rulesById, ruleId, grouped[ruleId]))
  return `${renderSummary(results, toolName, toolVersion)}\n${sections.join('\n')}`
}

const main = () => {
  const { input, out } = parseArgs(process.argv)
  if (!input) {
    console.error('Usage: node sarif-to-md.mjs <input.sarif> [--out <output.md>]')
    process.exit(1)
  }
  const raw = readFileSync(input, 'utf8').trim()
  if (!raw) {
    console.error(`Empty SARIF file: ${input} (nothing to convert — did the analysis/download fail?)`)
    process.exit(1)
  }
  const sarif = (() => {
    try {
      return JSON.parse(raw)
    } catch (error) {
      console.error(`Invalid SARIF JSON in ${input}: ${error.message}`)
      process.exit(1)
    }
  })()
  const markdown = render(collect(sarif))
  writeFileSync(out, markdown)
  const total = (sarif.runs ?? []).reduce((n, run) => n + (run.results?.length ?? 0), 0)
  console.log(`Wrote ${out} (${total} finding${total === 1 ? '' : 's'})`)
}

main()
