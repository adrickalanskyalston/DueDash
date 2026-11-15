import { useStore } from '../mock/store'
import { fmtDate } from '../mock/data'
import BackToDashboard from '../components/BackToDashboard'

export default function Courses() {
  const { data, actions } = useStore()

  // US-12: group by semester; archived courses stay visible as history.
  const active = data.courses.filter((c) => !c.is_archived)
  const archived = data.courses.filter((c) => c.is_archived)
  const semesters = [...new Set(active.map((c) => c.semester))]

  const countFor = (id) =>
    data.assignments.filter((a) => a.course_id === id && !a.deleted_at).length

  return (
    <main>
      <BackToDashboard />
      <h1>Courses</h1>
      <p className="muted">Organized by semester. Archiving keeps history — nothing is erased (US-12).</p>

      {semesters.map((sem) => (
        <div className="card" key={sem}>
          <h3>{sem}</h3>
          {active.filter((c) => c.semester === sem).map((c) => (
            <div className="row" key={c.course_id}>
              <span className="grow">
                <strong>{c.course_name}</strong>{' '}
                <span className="muted">{c.course_number}</span>
                {c.instructor_name && <div className="muted">{c.instructor_name}{c.office_hours ? ` · ${c.office_hours}` : ''}</div>}
              </span>
              <span className="muted">{countFor(c.course_id)} assignments</span>
              <button className="small" onClick={() => actions.archiveCourse(c.course_id)}>
                Archive
              </button>
            </div>
          ))}
        </div>
      ))}

      {archived.length > 0 && (
        <div className="card">
          <h3>Archived (history kept)</h3>
          {archived.map((c) => (
            <div className="row" key={c.course_id}>
              <span className="grow">
                <strong>{c.course_name}</strong>{' '}
                <span className="muted">{c.course_number} · {c.semester}</span>
              </span>
              <span className="muted">archived {fmtDate(c.archived_at)}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
