import { Navigate, Route, Routes } from 'react-router-dom'
import { PagePlaceholder } from './components/PagePlaceholder'
import { AppLayout } from './layouts/AppLayout'
import { ActivityLogPage } from './pages/employee/ActivityLogPage'
import { ConvertLeaveRequestPage } from './pages/employee/ConvertLeaveRequestPage'
import { DashboardPage } from './pages/employee/DashboardPage'
import { EditLeaveRequestPage } from './pages/employee/EditLeaveRequestPage'
import { FileLeavePage } from './pages/employee/FileLeavePage'
import { LeaveRequestDetailsPage } from './pages/employee/LeaveRequestDetailsPage'
import { LeaveApprovalsPage } from './pages/team/LeaveApprovalsPage'
import { FileLeaveForMemberPage } from './pages/team/FileLeaveForMemberPage'
import { LeaveRequestReviewPage } from './pages/team/LeaveRequestReviewPage'
import { TeamLeaveCalendarPage } from './pages/team/TeamLeaveCalendarPage'
import { UpcomingApprovedLeavesPage } from './pages/team/UpcomingApprovedLeavesPage'
import { AdminLeaveBalancesPage } from './pages/admin/AdminLeaveBalancesPage'
import { AdminLeaveRequestsPage } from './pages/admin/AdminLeaveRequestsPage'
import { AdminLeaveRequestViewPage } from './pages/admin/AdminLeaveRequestViewPage'
import { AdminLeaveValidatePage } from './pages/admin/AdminLeaveValidatePage'
import { AnnualDistributionEmployeesPage } from './pages/admin/AnnualDistributionEmployeesPage'
import { AnnualDistributionReviewPage } from './pages/admin/AnnualDistributionReviewPage'
import { NewlyRegularizedEmployeesPage } from './pages/admin/NewlyRegularizedEmployeesPage'
import { NewlyRegularizedReviewPage } from './pages/admin/NewlyRegularizedReviewPage'
import { ParentalDistributionEmployeesPage } from './pages/admin/ParentalDistributionEmployeesPage'
import { ParentalDistributionReviewPage } from './pages/admin/ParentalDistributionReviewPage'
import { ContractualDistributionAssignPage } from './pages/admin/ContractualDistributionAssignPage'
import { ContractualDistributionReviewPage } from './pages/admin/ContractualDistributionReviewPage'
import { AdminAdministrativeLogPage } from './pages/admin/AdminAdministrativeLogPage'
import { MonthlyAttendanceReportPage } from './pages/admin/MonthlyAttendanceReportPage'
import {
  distributionAssignPath,
  leaveBalancesLandingPath,
} from './utils/distributionPaths'

/**
 * TODO(REMOVE): PagePlaceholder usages below are temporary route shells.
 * Replace each with a real page under pages/team or pages/admin, then delete PagePlaceholder.tsx.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Employee — src/pages/employee */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="my-leave/file" element={<FileLeavePage />} />
        <Route path="my-leave/activity-log" element={<ActivityLogPage />} />
        <Route
          path="my-leave/requests/:leaveRequestId"
          element={<LeaveRequestDetailsPage />}
        />
        <Route
          path="my-leave/requests/:leaveRequestId/edit"
          element={<EditLeaveRequestPage />}
        />
        <Route
          path="my-leave/requests/:leaveRequestId/convert"
          element={<ConvertLeaveRequestPage />}
        />

        {/* Approver / Team — src/pages/team */}
        <Route path="team/leave-approvals" element={<LeaveApprovalsPage />} />
        <Route
          path="team/leave-approvals/:leaveRequestId"
          element={<LeaveRequestReviewPage />}
        />
        <Route path="team/file-leave" element={<FileLeaveForMemberPage />} />
        <Route path="team/leave-calendar" element={<TeamLeaveCalendarPage />} />
        <Route
          path="team/leave-calendar/upcoming"
          element={<UpcomingApprovedLeavesPage />}
        />
        <Route
          path="team/leave-requests/:leaveRequestId"
          element={<LeaveRequestReviewPage />}
        />

        {/* Admin — src/pages/admin */}
        <Route
          path="admin/leave-requests"
          element={<AdminLeaveRequestsPage />}
        />
        <Route
          path="admin/leave-requests/:leaveRequestId/validate"
          element={<AdminLeaveValidatePage />}
        />
        <Route
          path="admin/leave-requests/:leaveRequestId"
          element={<AdminLeaveRequestViewPage />}
        />
        <Route
          path="admin/leave-balances"
          element={<AdminLeaveBalancesPage />}
        />
        <Route
          path="admin/leave-balances/distributions/annual/employees"
          element={<AnnualDistributionEmployeesPage />}
        />
        <Route
          path="admin/leave-balances/distributions/annual/review"
          element={<AnnualDistributionReviewPage />}
        />
        <Route
          path="admin/leave-balances/distributions/newly-regularized/employees"
          element={<NewlyRegularizedEmployeesPage />}
        />
        <Route
          path="admin/leave-balances/distributions/newly-regularized/review"
          element={<NewlyRegularizedReviewPage />}
        />
        <Route
          path="admin/leave-balances/distributions/parental/employees"
          element={<ParentalDistributionEmployeesPage />}
        />
        <Route
          path="admin/leave-balances/distributions/parental/review"
          element={<ParentalDistributionReviewPage />}
        />
        <Route
          path="admin/leave-balances/distributions/contractual/employees"
          element={
            <Navigate to={distributionAssignPath('contractual')} replace />
          }
        />
        <Route
          path="admin/leave-balances/distributions/contractual/assign"
          element={<ContractualDistributionAssignPage />}
        />
        <Route
          path="admin/leave-balances/distributions/contractual/review"
          element={<ContractualDistributionReviewPage />}
        />
        <Route
          path="admin/leave-balances/distributions/*"
          element={<Navigate to={leaveBalancesLandingPath()} replace />}
        />
        <Route
          path="admin/logs"
          element={<AdminAdministrativeLogPage />}
        />
        <Route
          path="admin/logs/:logId"
          element={<Navigate to="/admin/logs" replace />}
        />
        <Route
          path="admin/reports"
          element={
            <Navigate to="/admin/reports/monthly-attendance" replace />
          }
        />
        <Route
          path="admin/reports/monthly-attendance"
          element={<MonthlyAttendanceReportPage />}
        />
        <Route
          path="admin/reports/leave-monetization-candidates"
          element={
            <PagePlaceholder title="Leave Monetization Candidates" />
          }
        />
        <Route
          path="admin/reports/employees-with-lwop"
          element={<PagePlaceholder title="Employees with LWOP" />}
        />
      </Route>
    </Routes>
  )
}

export default App
