/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../../shared/layout/Layout';
import Login from '../../features/auth/pages/Login';
import Profile from '../../features/profile/pages/Profile';
import CurrentKPI from '../../features/performance/pages/CurrentKPI';
import HistoryKPI from '../../features/performance/pages/HistoryKPI';
import HistoryKPIDetail from '../../features/performance/pages/HistoryKPIDetail';
import Dispute from '../../features/performance/pages/Dispute';
import CurrentGoals from '../../features/goals/pages/CurrentGoals';
import HistoryGoals from '../../features/goals/pages/HistoryGoals';
import PeriodHistoryGoals from '../../features/goals/pages/PeriodHistoryGoals';
import HistoryGoalDetail from '../../features/goals/pages/HistoryGoalDetail';
import GoalDetail from '../../features/goals/pages/GoalDetail';
import NewGoal from '../../features/goals/pages/NewGoal';
import EditGoal from '../../features/goals/pages/EditGoal';

import ReviewCycles from '../../features/hr/review-cycles/pages/ReviewCycles';
import CreateReviewCycle from '../../features/hr/review-cycles/pages/CreateReviewCycle';
import ReviewCycleDetail from '../../features/hr/review-cycles/pages/ReviewCycleDetail';
import ReviewTemplates from '../../features/hr/review-templates/pages/ReviewTemplates';
import ReviewTemplateDetail from '../../features/hr/review-templates/pages/ReviewTemplateDetail';
import QuestionnaireTemplates from '../../features/hr/questionnaires/pages/QuestionnaireTemplates';
import ViewQuestionnaireTemplate from '../../features/hr/questionnaires/pages/ViewQuestionnaireTemplate';
import EditQuestionnaireTemplate from '../../features/hr/questionnaires/pages/EditQuestionnaireTemplate';
import CreateQuestionnaireTemplate from '../../features/hr/questionnaires/pages/CreateQuestionnaireTemplate';
import CreateTemplate from '../../features/hr/review-templates/pages/CreateTemplate';
import PublishResults from '../../features/hr/publish-results/pages/PublishResults';
import AuditLogs from '../../features/hr/audit-logs/pages/AuditLogs';

import ManagerOverview from '../../features/manager/overview/pages/Overview';
import ManagerGoals from '../../features/manager/goals/pages/Goals';
import ManagerHistory from '../../features/manager/history/pages/History';
import ManagerDispute from '../../features/manager/disputes/pages/Dispute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Profile />} />
          <Route path="dashboard" element={<Profile />} />
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
          <Route path="manager">
            <Route path="overview" element={<ManagerOverview />} />
            <Route path="goals" element={<ManagerGoals />} />
            <Route path="history" element={<ManagerHistory />} />
            <Route path="dispute" element={<ManagerDispute />} />
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
            <Route path="publish" element={<PublishResults />} />
            <Route path="audit" element={<AuditLogs />} />
          </Route>
          {/* Catch-all redirect to profile */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
