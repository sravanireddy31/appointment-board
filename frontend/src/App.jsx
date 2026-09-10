import { useCallback, useEffect, useState } from 'react'
import './App.css'
import './Form.css'
import CalendarView from './CalendarView'
import { cancelAppointment, completeAppointment, createAppointment, getAppointments, updateAppointment } from './api/appointments'

const statuses = ['scheduled', 'completed', 'cancelled']
const emptyForm = { title: '', description: '', date: '', start_time: '', end_time: '', status: 'scheduled' }

function errorMessage(error) {
  const detail = error.response?.data?.detail

  // FastAPI validation errors use an array of detail objects.
  // Convert them to text before rendering them in the UI.
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || 'Invalid input.').join(' ')
  }

  return detail || error.message || 'Unable to reach the appointment service. Please try again.'
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString()
}

function formatTime(value) {
  const [hour, minute] = value.split(':')
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function App() {
  const [appointments, setAppointments] = useState([])
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState('board')

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setAppointments(await getAppointments({ date, status }))
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [date, status])

  useEffect(() => { loadAppointments() }, [loadAppointments])

  async function changeStatus(id, action) {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      if (action === 'complete') {
        await completeAppointment(id)
        setMessage('Appointment marked as completed.')
      } else {
        await cancelAppointment(id)
        setMessage('Appointment cancelled. It remains visible in the board.')
      }
      await loadAppointments()
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  function openCreateForm() {
    setEditingId(null); setForm(emptyForm); setShowForm(true); setError('')
  }

  function openEditForm(appointment) {
    setEditingId(appointment.id)
    setForm({ ...appointment, description: appointment.description || '', start_time: appointment.start_time.slice(0, 5), end_time: appointment.end_time.slice(0, 5) })
    setShowForm(true); setError('')
  }

  async function submitForm(event) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const appointment = { ...form, description: form.description || null }
      if (editingId === null) { await createAppointment(appointment); setMessage('Appointment created successfully.') }
      else { await updateAppointment(editingId, appointment); setMessage('Appointment updated successfully.') }
      setShowForm(false); await loadAppointments()
    } catch (requestError) { setError(errorMessage(requestError)) }
    finally { setSaving(false) }
  }

  return (
    <main className="page-shell">
      <section className="board">
        <header className="board-header">
          <div>
            <p className="eyebrow">APPOINTMENT BOARD</p>
            <h1>Keep your day on track</h1>
            <p className="subtitle">View, filter, and manage your scheduled appointments.</p>
          </div>
          <button className="primary-button" type="button" onClick={openCreateForm}>+ Add Appointment</button>
        </header>

        <nav className="view-navigation" aria-label="Appointment views">
          <button className={`view-tab ${view === 'board' ? 'view-tab-active' : ''}`} type="button" onClick={() => setView('board')}>Board view</button>
          <button className={`view-tab ${view === 'calendar' ? 'view-tab-active' : ''}`} type="button" onClick={() => setView('calendar')}>Calendar view</button>
        </nav>

        {view === 'board' && <><section className="filters" aria-label="Appointment filters">
          <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label>Status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              {statuses.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
            </select>
          </label>
          <button className="text-button" type="button" onClick={loadAppointments}>Refresh</button>
        </section>

        {message && <p className="alert success" role="status">{message}</p>}
        {error && <p className="alert error" role="alert">{error}</p>}
        {showForm && <form className="appointment-form" onSubmit={submitForm}>
          <h2>{editingId === null ? 'Add appointment' : 'Edit appointment'}</h2>
          <label>Title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <label>Date<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
          <label>Start time<input required type="time" value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} /></label>
          <label>End time<input required type="time" value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} /></label>
          <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{statuses.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></label>
          <div className="form-actions"><button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save appointment'}</button><button className="text-button" disabled={saving} type="button" onClick={() => setShowForm(false)}>Cancel</button></div>
        </form>}

        <section className="table-card" aria-live="polite">
          <div className="table-heading"><h2>Appointments</h2><span>{appointments.length} shown</span></div>
          {loading ? <p className="empty-state">Loading appointments…</p> : appointments.length === 0 ? <p className="empty-state">No appointments match the selected filters.</p> : (
            <div className="table-scroll"><table>
              <thead><tr><th>Title</th><th>Date</th><th>Start time</th><th>End time</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{appointments.map((appointment) => <tr key={appointment.id}>
                <td data-label="Title"><strong>{appointment.title}</strong>{appointment.description && <span className="description">{appointment.description}</span>}</td>
                <td data-label="Date">{formatDate(appointment.date)}</td>
                <td data-label="Start time">{formatTime(appointment.start_time)}</td>
                <td data-label="End time">{formatTime(appointment.end_time)}</td>
                <td data-label="Status"><span className={`status status-${appointment.status}`}>{appointment.status}</span></td>
                <td data-label="Actions"><div className="actions">
                  <button className="action-button" type="button" disabled={appointment.status !== 'scheduled'} onClick={() => openEditForm(appointment)}>Edit</button>
                  <button className="action-button" type="button" disabled={saving || appointment.status !== 'scheduled'} onClick={() => changeStatus(appointment.id, 'complete')}>Complete</button>
                  <button className="action-button danger-button" type="button" disabled={saving || appointment.status !== 'scheduled'} onClick={() => changeStatus(appointment.id, 'cancel')}>Cancel</button>
                </div></td>
              </tr>)}</tbody>
            </table></div>
          )}
        </section></>}
        {view === 'calendar' && <CalendarView appointments={appointments} formatTime={formatTime} />}
      </section>
    </main>
  )
}

export default App
