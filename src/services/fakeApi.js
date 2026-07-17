import shisui from '../data/characters/shisui.json'
import imbrathil from '../data/characters/imbrathil.json'
import escanor from '../data/characters/escanor.json'
import jackTheGull from '../data/characters/jack-the-gull.json'
import { repairFeatGrantedSpells } from './featChoiceService.js'
import { repairSubclassGrantedSpells } from './progressionService.js'

const fakeUsers = [
  {
    id: 'user_demo',
    username: 'demoplayer',
    email: 'demo@dd.it',
    password: 'demo123',
    name: 'Demo Player',
  },
]

const fakeCharacters = [
  { ...shisui, ownerId: 'user_demo' },
  { ...imbrathil, ownerId: 'user_demo' },
  { ...escanor, ownerId: 'user_demo' },
  { ...jackTheGull, ownerId: 'user_demo' },
]

let customCharactersCache = []
let deletedCharacterIdsCache = null

const DELETED_CHARACTER_IDS_STORAGE_KEY = 'reactDd.deletedCharacterIds'

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function mergeCharacters(...characterLists) {
  const byId = new Map()

  characterLists.flat().forEach((character) => {
    if (!character?.id) return

    byId.set(character.id, character)
  })

  return [...byId.values()]
}

function hydrateCharacter(character) {
  return repairSubclassGrantedSpells(repairFeatGrantedSpells(character))
}

function getDeletedCharacterIds() {
  if (deletedCharacterIdsCache) {
    return deletedCharacterIdsCache
  }

  try {
    const rawDeletedIds = localStorage.getItem(DELETED_CHARACTER_IDS_STORAGE_KEY)
    const deletedIds = JSON.parse(rawDeletedIds)

    deletedCharacterIdsCache = new Set(Array.isArray(deletedIds) ? deletedIds : [])
  } catch {
    deletedCharacterIdsCache = new Set()
  }

  return deletedCharacterIdsCache
}

function rememberDeletedCharacterId(id) {
  const deletedIds = getDeletedCharacterIds()

  deletedIds.add(id)

  try {
    localStorage.setItem(
      DELETED_CHARACTER_IDS_STORAGE_KEY,
      JSON.stringify([...deletedIds])
    )
  } catch {
    // Ignore localStorage failures; the in-memory cache still updates this session.
  }
}

async function fetchFileCharacters() {
  try {
    const response = await fetch('/api/dev/characters')

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    return Array.isArray(data.characters) ? data.characters : []
  } catch {
    return []
  }
}

async function persistCharacterFile(character) {
  try {
    const response = await fetch('/api/dev/characters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(character),
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch {
    return null
  }
}

async function deleteCharacterFile(id) {
  try {
    const response = await fetch('/api/dev/characters', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    })

    return response.ok
  } catch {
    return false
  }
}

export async function login(identifier, password) {
  await wait(500)
  const user = fakeUsers.find(
    (u) => (u.email === identifier || u.username === identifier) && u.password === password
  )

  if (!user) {
    const error = new Error('Credenziali non valide')
    error.code = 'INVALID_CREDENTIALS'
    throw error
  }

  return {
    token: `fake-token-${user.id}`,
    user: { id: user.id, username: user.username, email: user.email, name: user.name },
  }
}

export async function register({ username, email, password }) {
  await wait(500)

  const exists = fakeUsers.some(
    (u) => u.email === email || u.username === username
  )

  if (exists) {
    const error = new Error('Utente già esistente')
    error.code = 'USER_EXISTS'
    throw error
  }

  const newUser = {
    id: `user_${Date.now()}`,
    username,
    email,
    password,
    name: username,
  }

  fakeUsers.push(newUser)

  return {
    token: `fake-token-${newUser.id}`,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      name: newUser.name,
    },
  }
}


export async function fetchCharacters(userId) {
  await wait(400)
  const fileCharacters = await fetchFileCharacters()
  const deletedIds = getDeletedCharacterIds()

  customCharactersCache = mergeCharacters(customCharactersCache, fileCharacters)

  return mergeCharacters(fakeCharacters, customCharactersCache)
    .filter((c) => c.ownerId === userId && !deletedIds.has(c.id))
    .map(hydrateCharacter)
}

export async function fetchCharacterById(userId, id) {
  await wait(300)
  const fileCharacters = await fetchFileCharacters()
  const deletedIds = getDeletedCharacterIds()

  if (deletedIds.has(id)) {
    return null
  }

  customCharactersCache = mergeCharacters(customCharactersCache, fileCharacters)

  return mergeCharacters(fakeCharacters, customCharactersCache)
    .map(hydrateCharacter)
    .find((c) => c.ownerId === userId && c.id === id) ?? null
}

export async function createCharacter(userId, character) {
  await wait(300)

  const createdCharacter = {
    ...character,
    ownerId: userId,
  }

  customCharactersCache = mergeCharacters(customCharactersCache, [createdCharacter])

  await persistCharacterFile(createdCharacter)

  return hydrateCharacter(createdCharacter)
}

export async function updateCharacter(userId, character) {
  await wait(250)

  const updatedCharacter = {
    ...character,
    ownerId: userId,
  }

  customCharactersCache = mergeCharacters(customCharactersCache, [updatedCharacter])

  await persistCharacterFile(updatedCharacter)

  return hydrateCharacter(updatedCharacter)
}

export async function deleteCharacter(userId, id) {
  await wait(250)

  rememberDeletedCharacterId(id)
  customCharactersCache = customCharactersCache.filter((character) => {
    return !(character.ownerId === userId && character.id === id)
  })

  await deleteCharacterFile(id)

  return { id, deleted: true }
}
