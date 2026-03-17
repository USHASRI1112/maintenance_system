import api from './axios'

export const login = async (email, password) => {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  const res = await api.post('/auth/login', form)
  return res.data
}

export const getMe = async () => {
  const res = await api.get('/auth/me')
  return res.data
}

export const register = async (data) => {
  const res = await api.post('/auth/register', data)
  return res.data
}