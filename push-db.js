// Direct Prisma schema push script
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_vUNRaI0gST4e@ep-bold-union-b4tg2fcz-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require'

const { spawn } = require('child_process')
const path = require('path')

const prismaPath = path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js')

const child = spawn(process.execPath, [prismaPath, 'db', 'push', '--skip-generate'], {
  env: { ...process.env },
  stdio: 'inherit',
  cwd: __dirname
})

child.on('exit', (code) => {
  process.exit(code)
})
