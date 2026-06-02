const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const version = require('../package.json').version
const productName = require('../package.json').build.productName

const releaseDir = path.resolve(__dirname, '..', 'release')
const unpackedDir = path.join(releaseDir, 'win-unpacked')
const zipName = `${productName}-Portable-${version}.zip`
const zipPath = path.join(releaseDir, zipName)

if (!fs.existsSync(unpackedDir)) {
  console.error(`Error: ${unpackedDir} does not exist.`)
  console.error('Run "npm run electron:build:zip" first, or use --win dir to produce the unpacked directory.')
  process.exit(1)
}

const psCommand = [
  'powershell',
  '-NoProfile',
  '-Command',
  `"Compress-Archive -Path '${unpackedDir}\\*' -DestinationPath '${zipPath}' -Force"`
].join(' ')

console.log(`Creating ${zipName}...`)
try {
  execSync(psCommand, { stdio: 'inherit' })
  const stats = fs.statSync(zipPath)
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1)
  console.log(`Done: ${zipPath} (${sizeMB} MB)`)
} catch (err) {
  console.error('Failed to create zip archive.', err.message)
  process.exit(1)
}
