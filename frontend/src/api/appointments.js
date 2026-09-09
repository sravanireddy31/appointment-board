import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export async function getAppointments(filters) {
  const params = {}
  if (filters.date) params.date = filters.date
  if (filters.status) params.status = filters.status
  const response = await api.get('/appointments', { params })
  return response.data
}

export async function createAppointment(appointment) {
  const response = await api.post('/appointments', appointment)
  return response.data
}

export async function updateAppointment(id, appointment) {
  const response = await api.put(`/appointments/${id}`, appointment)
  return response.data
}

export async function completeAppointment(id) {
  const response = await api.patch(`/appointments/${id}/complete`)
  return response.data
}

export async function cancelAppointment(id) {
  const response = await api.patch(`/appointments/${id}/cancel`)
  return response.data
}
