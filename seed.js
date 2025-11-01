#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

const cwd = path.resolve(__dirname)

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

const child = spawn(pnpmCommand, ['db:seed'], {
  cwd,
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code) => {
  process.exit(code ?? 0)
})

child.on('error', (error) => {
  console.error('Failed to start seeding process:', error)
  process.exit(1)
})
