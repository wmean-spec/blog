import bcrypt from 'bcrypt'
import crypto from 'crypto'
import config from 'config'

const saltRounds = config.get('saltRounds')

export async function hashPassword (password) {
  return bcrypt.hash(password, saltRounds)
}
export async function comparePasswords (password, hash) {
  return bcrypt.compare(password, hash)
}
export async function createToken () {
  const token = crypto.randomBytes(48)
  return token.toString('hex')
}
export async function randomPassword () {
  const token = crypto.randomBytes(8)
  return token.toString('hex')
}
