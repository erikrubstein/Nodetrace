import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import AdmZip from 'adm-zip'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRootDir = path.resolve(scriptDir, '..')
const packageJsonPath = path.join(repoRootDir, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const version = packageJson.version || '0.0.0'
const distDir = path.join(repoRootDir, 'dist')
const releaseDir = path.join(repoRootDir, 'release', 'web')
const outputPath = path.join(releaseDir, `Nodetrace-Web-v${version}.zip`)

if (!fs.existsSync(distDir)) {
  throw new Error(`Built web bundle not found at ${distDir}. Run npm run build:web first.`)
}

fs.mkdirSync(releaseDir, { recursive: true })

const zip = new AdmZip()
zip.addLocalFolder(distDir, 'dist')
zip.writeZip(outputPath)

console.log(outputPath)
