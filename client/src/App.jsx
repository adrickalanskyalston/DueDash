import { Route, Routes } from 'react-router-dom'
import { StoreProvider } from './mock/store'
import Dashboard from './screens/Dashboard'
import AssignmentList from './screens/AssignmentList'
import Courses from './screens/Courses'
import WeeklyPlan from './screens/WeeklyPlan'
import Commitments from './screens/Commitments'
import Reminders from './screens/Reminders'
import AssignmentForm from './screens/AssignmentForm'
import AssignmentDetail from './screens/AssignmentDetail'
import DailyChecklist from './screens/DailyChecklist'
import SubtaskSuggestions from './screens/SubtaskSuggestions'

// Prototype 2 mock frontend. Sign-In is conditional on the site map and is
// skipped — auth is unconfirmed; the demo starts on Dashboard.
export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/assignments" element={<AssignmentList />} />
        <Route path="/assignments/new" element={<AssignmentForm />} />
        <Route path="/assignments/:id" element={<AssignmentDetail />} />
        <Route path="/assignments/:id/edit" element={<AssignmentForm />} />
        <Route path="/assignments/:id/suggestions" element={<SubtaskSuggestions />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/plan" element={<WeeklyPlan />} />
        <Route path="/plan/checklist" element={<DailyChecklist />} />
        <Route path="/commitments" element={<Commitments />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </StoreProvider>
  )
}
