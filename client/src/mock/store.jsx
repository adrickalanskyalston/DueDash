import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api'
import { todayStr } from './data'

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

const EMPTY = {
  student: null, courses: [], assignments: [], subtasks: [],
  commitments: [], weeklyPlans: [], planItems: [], planSuggestions: [], alerts: [],
}

// Live store — same {data, actions} shape as the mock checkpoint, but every
// read/write goes through Express to Supabase. Weekly plans arrive nested
// (plan_items inside each plan) and are flattened for the screens.
export function StoreProvider({ children }) {
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadAll() {
    try {
      // Server-side missed-plan scan before fetching alerts (idempotent —
      // no duplicates on reload).
      await apiPost('/api/alerts/generate-missed').catch(() => null)
      const [me, courses, assignments, subtasks, plans, commitments, alerts] =
        await Promise.all([
          apiGet('/api/me'), apiGet('/api/courses?include_archived=true'),
          apiGet('/api/assignments'), apiGet('/api/subtasks'),
          apiGet('/api/weekly-plans'), apiGet('/api/commitments'), apiGet('/api/alerts'),
        ])
      const planItems = plans.flatMap((p) =>
        (p.plan_items ?? []).map((i) => ({ ...i, weekly_plan_id: p.weekly_plan_id })),
      )
      const weeklyPlans = plans.map(({ plan_items: _items, ...p }) => p)
      setData((d) => ({
        ...d, student: me, courses, assignments, subtasks,
        commitments, weeklyPlans, planItems, alerts,
      }))
      setError(null)
    } catch (e) {
      setError(`API unavailable: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // Draft plan suggestions are generated client-side from unfinished work
  // (generation mechanism intentionally simple — see OPEN_QUESTIONS). They
  // stay drafts until approved, which writes a real plan_item via the API.
  useEffect(() => {
    if (!data.assignments.length || data.planSuggestions.length) return
    const items = [
      ...data.assignments.filter((a) => a.progress_state !== 'completed').slice(0, 1)
        .map((a) => ({ assignment_id: a.assignment_id, subtask_id: null })),
      ...data.subtasks.filter((s) => s.progress_state !== 'completed').slice(0, 1)
        .map((s) => ({ assignment_id: null, subtask_id: s.subtask_id })),
    ].map((s, i) => ({ ...s, id: `ps-${i}`, planned_date: todayStr(), planned_minutes: 60 }))
    setData((d) => ({ ...d, planSuggestions: items }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.assignments.length, data.subtasks.length])

  // Every action: call the API, then reload so screens reflect server truth.
  const actions = useMemo(() => ({
    async addAssignment(fields) {
      const created = await apiPost('/api/assignments', fields)
      await loadAll()
      return created.assignment_id
    },
    async updateAssignment(id, fields) {
      await apiPatch(`/api/assignments/${id}`, fields)
      await loadAll()
    },
    async toggleAssignment(id) {
      const a = data.assignments.find((x) => x.assignment_id === id)
      await apiPatch(`/api/assignments/${id}`, {
        progress_state: a.progress_state === 'completed' ? 'in_progress' : 'completed',
      })
      await loadAll()
    },
    async toggleSubtask(id) {
      const s = data.subtasks.find((x) => x.subtask_id === id)
      await apiPatch(`/api/subtasks/${id}`, {
        progress_state: s.progress_state === 'completed' ? 'not_started' : 'completed',
      })
      await loadAll()
    },
    async deleteAssignment(id, mode) {
      await apiDelete(`/api/assignments/${id}?mode=${mode}`)
      await loadAll()
    },
    async archiveCourse(id) {
      await apiPost(`/api/courses/${id}/archive`)
      await loadAll()
    },
    async addCommitment(fields) {
      await apiPost('/api/commitments', fields)
      await loadAll()
    },
    async approveSuggestion(id) {
      const s = data.planSuggestions.find((x) => x.id === id)
      const plan = data.weeklyPlans.find((w) => w.plan_state === 'current')
      if (!plan) throw new Error('no current weekly plan to add to')
      await apiPost('/api/plan-items', {
        weekly_plan_id: plan.weekly_plan_id, assignment_id: s.assignment_id,
        subtask_id: s.subtask_id, planned_date: s.planned_date, planned_minutes: s.planned_minutes,
      })
      setData((d) => ({ ...d, planSuggestions: d.planSuggestions.filter((x) => x.id !== id) }))
      await loadAll()
    },
    async createPlan(week_start) {
      await apiPost('/api/weekly-plans', { week_start })
      await loadAll()
    },
    async addPlanItem(fields) {
      await apiPost('/api/plan-items', fields)
      await loadAll()
    },
    async updatePlanItem(id, fields) {
      await apiPatch(`/api/plan-items/${id}`, fields)
      await loadAll()
    },
    async removePlanItem(id) {
      await apiDelete(`/api/plan-items/${id}`)
      await loadAll()
    },
    declineSuggestion(id) {
      setData((d) => ({ ...d, planSuggestions: d.planSuggestions.filter((x) => x.id !== id) }))
    },
    async addSubtasks(assignment_id, steps) {
      await apiPost('/api/subtasks', { assignment_id, steps })
      await loadAll()
    },
    async resolveAlert(id, state) {
      await apiPatch(`/api/alerts/${id}`, { alert_state: state })
      await loadAll()
    },
    reload: loadAll,
  }), [data])

  return (
    <StoreCtx.Provider value={{ data, loading, error, actions }}>
      {error && (
        <div className="api-error">
          {error} — start the API (<code>npm run dev</code> in <code>api/</code>) and make sure
          the hosted Supabase schema + seed have been applied.
        </div>
      )}
      {children}
    </StoreCtx.Provider>
  )
}
