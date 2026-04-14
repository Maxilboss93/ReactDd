import shisui from '../data/characters/shisui.json'

const fakeUsers = [
  {
    id: 'user_demo',
    username: 'demoplayer',
    email: 'demo@dd.it',
    password: 'demo123',
    name: 'Demo Player',
  },
]

const shisuiClone = {
  ...shisui,
  id: 'pg_002',
  name: 'Imbrathil',
  race: 'Elfo dei boschi',
  alignment: 'Neutrale',
  classes: [
    {
      name: 'Ranger',
      level: 3,
      subclass: 'Cacciatore',
    },
  ],
}

const fakeCharacters = [
  { ...shisui, ownerId: 'user_demo' },
  { ...shisuiClone, ownerId: 'user_demo' },
]

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  return fakeCharacters.filter((c) => c.ownerId === userId)
}

export async function fetchCharacterById(userId, id) {
  await wait(300)
  return fakeCharacters.find((c) => c.ownerId === userId && c.id === id) ?? null
}
