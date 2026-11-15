import { createContext, useContext, useState } from 'react'
import { buildSeedData } from './data'

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

const uid = () => `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export function StoreProvider({ children }) {
  const [data, setData] = useState(buildSeedData)
  const patch = (fn) => setData((d) => fn(structuredClone(d)))

  const actions = {
    addAssignment(fields) {
      const id = uid()
      patch((d) => {
        d.assignments.push({
          assignment_id: id, progress_state: 'not_started',
          completed_at: null, deleted_at: null, estimate_note: null, ...fields,
        })
      })
      return id
    },
    updateAssignment(id, fields) {
      patch((d) => {
        Object.assign(d.assignments.find((a) => a.assignment_id === id), fields)
      })
    },
    toggleAssignment(id) {
      patch((d) => {
        const a = d.assignments.find((x) => x.assignment_id === id)
        if (a.progress_state === 'completed') {
          a.progress_state = 'in_progress'
          a.completed_at = null
        } else {
          a.progress_state = 'completed'
          a.completed_at = new Date().toISOString()
        }
      })
    },
    toggleSubtask(id) {
      patch((d) => {
        const s = d.subtasks.find((x) => x.subtask_id === id)
        if (s.progress_state === 'completed') {
          s.progress_state = 'not_started'
          s.completed_at = null
        } else {
          s.progress_state = 'completed'
          s.completed_at = new Date().toISOString()
        }
      })
    },
    // BR-09/US-16: confirmation already happened in the UI; `mode` chooses
    // how linked work is treated — 'keep' leaves subtasks/plan items as
    // history, 'remove' soft-deletes subtasks and drops plan items.
    deleteAssignment(id, mode) {
      patch((d) => {
        const a = d.assignments.find((x) => x.assignment_id === id)
        a.deleted_at = new Date().toISOString()
        if (mode === 'remove') {
          const now = a.deleted_at
          d.subtasks.forEach((s) => {
            if (s.assignment_id === id) s.deleted_at = now
          })
          d.planItems = d.planItems.filter((p) => p.assignment_id !== id)
        }
      })
    },
    archiveCourse(id) {
      patch((d) => {
        const c = d.courses.find((x) => x.course_id === id)
        c.is_archived = true
        c.archived_at = new Date().toISOString()
      })
    },
    addCommitment(fields) {
      patch((d) => d.commitments.push({ commitment_id: uid(), recurrence_rule: null, ...fields }))
    },
    approveSuggestion(id) {
      patch((d) => {
        const s = d.planSuggestions.find((x) => x.id === id)
        d.planSuggestions = d.planSuggestions.filter((x) => x.id !== id)
        const plan = d.weeklyPlans.find((w) => w.plan_state === 'current')
        d.planItems.push({
          plan_item_id: uid(), weekly_plan_id: plan.weekly_plan_id,
          assignment_id: s.assignment_id, subtask_id: s.subtask_id,
          planned_date: s.planned_date, planned_minutes: s.planned_minutes,
          sort_order: d.planItems.length + 1,
        })
      })
    },
    declineSuggestion(id) {
      patch((d) => { d.planSuggestions = d.planSuggestions.filter((x) => x.id !== id) })
    },
    addSubtasks(assignment_id, steps) {
      patch((d) => {
        const start = d.subtasks.filter((s) => s.assignment_id === assignment_id).length
        steps.forEach((s, i) =>
          d.subtasks.push({
            subtask_id: uid(), assignment_id, title: s.title,
            due_at: s.due_at || null, estimated_minutes: s.estimated_minutes ?? null,
            progress_state: 'not_started', sort_order: start + i + 1, completed_at: null,
          })
        )
      })
    },
    resolveAlert(id, state) {
      patch((d) => {
        d.alerts.find((a) => a.alert_id === id).alert_state = state
      })
    },
  }

  return <StoreCtx.Provider value={{ data, actions }}>{children}</StoreCtx.Provider>
}
