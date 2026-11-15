const CLASS = {
  'Overdue': 'badge overdue',
  'Completed': 'badge completed',
  'In Progress': 'badge inprogress',
  'Not Started': 'badge notstarted',
}

export default function StatusBadge({ state }) {
  return <span className={CLASS[state] || 'badge'}>{state}</span>
}
