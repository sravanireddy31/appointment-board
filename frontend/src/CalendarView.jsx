import { useMemo, useState } from 'react'
import './CalendarView.css'

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function monthTitle(month) {
  return month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function CalendarView({ appointments, formatTime }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  const appointmentsByDate = useMemo(() => appointments.reduce((groups, appointment) => {
    groups[appointment.date] = [...(groups[appointment.date] || []), appointment]
    return groups
  }, {}), [appointments])

  const days = useMemo(() => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const firstWeekday = new Date(year, monthIndex, 1).getDay()
    const totalDays = new Date(year, monthIndex + 1, 0).getDate()
    return Array.from({ length: firstWeekday + totalDays }, (_, index) => {
      const day = index - firstWeekday + 1
      return day > 0 ? { day, key: dateKey(year, monthIndex, day) } : null
    })
  }, [month])

  function changeMonth(offset) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
    setSelectedAppointment(null)
  }

  return (
    <section className="calendar-card">
      <div className="calendar-header">
        <button className="action-button" type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">← Previous</button>
        <h2>{monthTitle(month)}</h2>
        <button className="action-button" type="button" onClick={() => changeMonth(1)} aria-label="Next month">Next →</button>
      </div>
      <div className="calendar-grid" role="grid" aria-label={`Appointments for ${monthTitle(month)}`}>
        {weekDays.map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
        {days.map((day, index) => day ? (
          <div className="calendar-day" key={day.key} role="gridcell">
            <span className="day-number">{day.day}</span>
            <div className="calendar-events">
              {(appointmentsByDate[day.key] || []).map((appointment) => (
                <button key={appointment.id} type="button" className={`calendar-event status-${appointment.status}`} onClick={() => setSelectedAppointment(appointment)}>
                  {formatTime(appointment.start_time)} · {appointment.title}
                </button>
              ))}
            </div>
          </div>
        ) : <div className="calendar-day calendar-day-empty" key={`empty-${index}`} aria-hidden="true" />)}
      </div>
      {selectedAppointment && <section className="appointment-details" aria-live="polite">
        <div><p className="eyebrow">APPOINTMENT DETAILS</p><h3>{selectedAppointment.title}</h3></div>
        <button className="action-button" type="button" onClick={() => setSelectedAppointment(null)}>Close</button>
        <p><strong>Date:</strong> {selectedAppointment.date}</p>
        <p><strong>Time:</strong> {formatTime(selectedAppointment.start_time)} – {formatTime(selectedAppointment.end_time)}</p>
        <p><strong>Status:</strong> <span className={`status status-${selectedAppointment.status}`}>{selectedAppointment.status}</span></p>
      </section>}
    </section>
  )
}

export default CalendarView
