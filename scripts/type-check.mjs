import { execSync } from 'child_process'

try {
  console.log('[v0] Running TypeScript type check...')
  const output = execSync('npx tsc --noEmit 2>&1', { cwd: '/vercel/share/v0-project', encoding: 'utf-8' })
  console.log('[v0] Type check output:', output || 'No errors found')
} catch (e) {
  console.log('[v0] Type check FAILED:')
  console.log(e.stdout)
  console.log(e.stderr)
}
