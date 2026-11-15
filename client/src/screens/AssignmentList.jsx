import { Link } from 'react-router-dom'
import { useStore } from '../mock/store'
import { displayState, fmtDate } from '../mock/data'
import BackToDashboard from '../components/BackToDashboard'
import StatusBadge from '../components/StatusBadge'

export default function AssignmentList() {
  const { data } = useStore()

  // US-03: overdue first, then due date within each group.
  const sortForDisplay = (list) =>
    [...list].sort((a, b) => {
      const ao = displayState(a) === 'Overdue' ? 0 : 1
      const bo = displayState(b) === 'Overdue' ? 0 : 1
      return ao - bo || new Date(a.due_at) - new Date(b.due_at)
    })

  const groups = data.courses.map((c) => ({
    course: c,
    items: sortForDisplay(
      data.assignments.filter((a) => a.course_id === c.course_id && !a.deleted_at)
    ),
  }))

  return (
    <main>
      <BackToDashboard />
      <h1>Assignment List</h1>
      <p className="muted">Grouped by course; overdue work surfaces first.</p>

      {groups.map(({ course, items }) => (
        <div className="card" key={course.course_id}>
          <h3>
            {course.course_name} <span className="muted">({course.course_number})</span>
            {course.is_archived && <span className="badge"> archived</span>}
          </h3>
          {items.length === 0 && <p className="muted">No assignments.</p>}
          {items.map((a) => (
            <div className="row" key={a.assignment_id}>
              <span className="grow">
                <Link to={`/assignments/${a.assignment_id}`}>{a.title}</Link>
              </span>
              <span className="muted">{course.course_number}</span>
              <span className="muted">due {fmtDate(a.due_at)}</span>
              <StatusBadge state={displayState(a)} />
            </div>
          ))}
        </div>
      ))}

      <div className="nav-links">
        <Link to="/assignments/new">+ Add Assignment</Link>
        <Link to="/courses">Manage courses</Link>
      </div>
    </main>
  )
}
