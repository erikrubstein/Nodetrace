import { spawn } from 'node:child_process'
import process from 'node:process'

const children = []
let shuttingDown = false

function shutdown(code = 0) {
  if (shuttingDown) {
    return
  }
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) {
      child.kill()
    }
  }
  process.exit(code)
}

function start(name, command, args, env) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    stdio: 'inherit',
    shell: true,
  })
  children.push(child)
  child.on('exit', (code) => {
    if (shuttingDown) {
      return
    }
    const normalizedCode = code ?? 1
    console.error(`${name} exited with code ${normalizedCode}`)
    shutdown(normalizedCode)
  })
  return child
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

start('server', 'npm', ['run', 'start', '--workspace', 'nodetrace-server'], {
  HOST: '127.0.0.1',
  PORT: '3101',
})

start('renderer', 'npm', ['run', 'dev', '--workspace', 'nodetrace-renderer', '--', '--host', '127.0.0.1'], {
  VITE_HOST: '127.0.0.1',
  VITE_PORT: '4173',
  VITE_API_BASE_URL: 'http://127.0.0.1:3101',
})

setInterval(() => {}, 1000)
