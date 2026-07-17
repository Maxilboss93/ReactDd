import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'

const customCharactersDir = path.resolve('src/data/characters/custom')
const customCharactersIndexPath = path.resolve('src/data/characters/custom-characters.json')

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function readRequestJson(req) {
  const chunks = []

  for await (const chunk of req) {
    chunks.push(chunk)
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')

  return rawBody ? JSON.parse(rawBody) : null
}

async function readCustomCharacterIndex() {
  try {
    const rawIndex = await fs.readFile(customCharactersIndexPath, 'utf8')
    const index = JSON.parse(rawIndex)

    return Array.isArray(index) ? index : []
  } catch {
    return []
  }
}

async function writeCustomCharacterIndex(index) {
  await fs.mkdir(path.dirname(customCharactersIndexPath), { recursive: true })
  await fs.writeFile(
    customCharactersIndexPath,
    `${JSON.stringify(index, null, 2)}\n`,
    'utf8'
  )
}

async function deleteCustomCharacter(id) {
  const index = await readCustomCharacterIndex()
  const entry = index.find((candidate) => candidate.id === id)

  if (!entry) {
    return { deleted: false }
  }

  const filePath = path.resolve(customCharactersDir, entry.file)
  const relativeToCustomDir = path.relative(customCharactersDir, filePath)

  if (relativeToCustomDir.startsWith('..') || path.isAbsolute(relativeToCustomDir)) {
    throw new Error('Invalid custom character file path')
  }

  try {
    await fs.unlink(filePath)
  } catch {
    // The index is the source of truth; removing a stale entry is still valid.
  }

  await writeCustomCharacterIndex(index.filter((candidate) => candidate.id !== id))

  return { deleted: true, file: path.relative(process.cwd(), filePath) }
}

async function readCustomCharacters() {
  const index = await readCustomCharacterIndex()
  const characters = []

  for (const entry of index) {
    try {
      const filePath = path.join(customCharactersDir, entry.file)
      const rawCharacter = await fs.readFile(filePath, 'utf8')
      characters.push(JSON.parse(rawCharacter))
    } catch {
      // Ignore stale index entries; the next write will keep valid files.
    }
  }

  return characters
}

function customCharacterFileName(character) {
  const id = slugify(character.id)
  const name = slugify(character.name || 'personaggio')

  return `${id}-${name}.json`
}

function devCharacterFileApi() {
  return {
    name: 'dev-character-file-api',
    configureServer(server) {
      server.middlewares.use('/api/dev/characters', async (req, res) => {
        try {
          if (req.method === 'GET') {
            const characters = await readCustomCharacters()

            sendJson(res, 200, { characters })
            return
          }

          if (req.method === 'POST') {
            const character = await readRequestJson(req)

            if (!character?.id) {
              sendJson(res, 400, { error: 'CHARACTER_ID_REQUIRED' })
              return
            }

            await fs.mkdir(customCharactersDir, { recursive: true })

            const file = customCharacterFileName(character)
            const filePath = path.join(customCharactersDir, file)

            await fs.writeFile(filePath, `${JSON.stringify(character, null, 2)}\n`, 'utf8')

            const index = await readCustomCharacterIndex()
            const nextEntry = {
              id: character.id,
              name: character.name,
              file,
            }
            const nextIndex = [
              nextEntry,
              ...index.filter((entry) => entry.id !== character.id),
            ]

            await writeCustomCharacterIndex(nextIndex)

            sendJson(res, 200, {
              character,
              file: path.relative(process.cwd(), filePath),
            })
            return
          }

          if (req.method === 'DELETE') {
            const payload = await readRequestJson(req)
            const id = payload?.id

            if (!id) {
              sendJson(res, 400, { error: 'CHARACTER_ID_REQUIRED' })
              return
            }

            const result = await deleteCustomCharacter(id)

            sendJson(res, result.deleted ? 200 : 404, result)
            return
          }

          sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' })
        } catch (error) {
          sendJson(res, 500, {
            error: 'CHARACTER_FILE_API_ERROR',
            message: error instanceof Error ? error.message : String(error),
          })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), devCharacterFileApi()],
})
