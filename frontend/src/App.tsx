/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Profile from './pages/Profile';
import CurrentKPI from './pages/performance/CurrentKPI';
import HistoryKPI from './pages/performance/HistoryKPI';
import HistoryKPIDetail from './pages/performance/HistoryKPIDetail';
import Dispute from './pages/Dispute';
import CurrentGoals from './pages/goals/CurrentGoals';
import HistoryGoals from './pages/goals/HistoryGoals';
import PeriodHistoryGoals from './pages/goals/PeriodHistoryGoals';
import HistoryGoalDetail from './pages/goals/HistoryGoalDetail';
import GoalDetail from './pages/goals/GoalDetail';
import NewGoal from './pages/goals/NewGoal';
import EditGoal from './pages/goals/EditGoal';

import ReviewCycles from './pages/hr/ReviewCycles';
import CreateReviewCycle from './pages/hr/CreateReviewCycle';
import ReviewCycleDetail from './pages/hr/ReviewCycleDetail';
import ReviewTemplates from './pages/hr/ReviewTemplates';
import ReviewTemplateDetail from './pages/hr/ReviewTemplateDetail';
import QuestionnaireTemplates from './pages/hr/QuestionnaireTemplates';
import ViewQuestionnaireTemplate from './pages/hr/ViewQuestionnaireTemplate';
import EditQuestionnaireTemplate from './pages/hr/EditQuestionnaireTemplate';
import CreateQuestionnaireTemplate from './pages/hr/CreateQuestionnaireTemplate';
import CreateTemplate from './pages/hr/CreateTemplate';
import DepartmentsDemo from './pages/demo/DepartmentsDemo';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Profile />} />
          <Route path="performance">
            <Route path="current" element={<CurrentKPI />} />
            <Route path="history" element={<HistoryKPI />} />
            <Route path="history/:id" element={<HistoryKPIDetail />} />
          </Route>
          <Route path="dispute" element={<Dispute />} />
          <Route path="goals">
            <Route path="current" element={<CurrentGoals />} />
            <Route path="history" element={<HistoryGoals />} />
            <Route path="history/:periodId" element={<PeriodHistoryGoals />} />
            <Route path="history/:periodId/:goalId" element={<HistoryGoalDetail />} />
            <Route path=":id" element={<GoalDetail />} />
            <Route path="new" element={<NewGoal />} />
            <Route path="edit/:id" element={<EditGoal />} />
          </Route>
          <Route path="hr">
            <Route path="cycles" element={<ReviewCycles />} />
            <Route path="cycles/new" element={<CreateReviewCycle />} />
            <Route path="cycles/:id" element={<ReviewCycleDetail />} />
            <Route path="templates" element={<ReviewTemplates />} />
            <Route path="templates/new" element={<CreateTemplate />} />
            <Route path="templates/:id" element={<ReviewTemplateDetail />} />
            <Route path="questionnaires" element={<QuestionnaireTemplates />} />
            <Route path="questionnaires/new" element={<CreateQuestionnaireTemplate />} />
            <Route path="questionnaires/:id" element={<ViewQuestionnaireTemplate />} />
            <Route path="questionnaires/:id/edit" element={<EditQuestionnaireTemplate />} />
          </Route>
          
          {/* Cloud Setup Demo Route */}
          <Route path="demo" element={<DepartmentsDemo />} />

          {/* Catch-all redirect to profile */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
