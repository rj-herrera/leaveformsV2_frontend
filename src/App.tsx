import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { RequireCapability } from './auth/RequireCapability'
import { AppLayout } from './layouts/AppLayout'
import { EmployeeIdEntryPage } from './pages/auth/EmployeeIdEntryPage'
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
import { ContractualDistributionAssignPage } from './pages/admin/ContractualDistributionAssignPage'
import { ContractualDistributionReviewPage } from './pages/admin/ContractualDistributionReviewPage'
import { AdminAdministrativeLogPage } from './pages/admin/AdminAdministrativeLogPage'
import { EmployeesWithLwopPage } from './pages/admin/EmployeesWithLwopPage'
import { LeaveMonetizationCandidatesPage } from './pages/admin/LeaveMonetizationCandidatesPage'
import { MonthlyAttendanceReportPage } from './pages/admin/MonthlyAttendanceReportPage'
import { AccessDeniedPage } from './pages/errors/AccessDeniedPage'
import { ConflictPage } from './pages/errors/ConflictPage'
import { LeaveRequestNotFoundPage } from './pages/errors/LeaveRequestNotFoundPage'
import { NotFoundPage } from './pages/errors/NotFoundPage'
import { OfflinePage } from './pages/errors/OfflinePage'
import { ServiceUnavailablePage } from './pages/errors/ServiceUnavailablePage'
import { SessionExpiredPage } from './pages/errors/SessionExpiredPage'
import { SystemErrorPage } from './pages/errors/SystemErrorPage'
import {
  distributionAssignPath,
  leaveBalancesLandingPath,
} from './utils/distributionPaths'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<EmployeeIdEntryPage />} />

      {/* Error previews — outside AppLayout (no sidebar / auth gate) */}
      <Route path="/401" element={<SessionExpiredPage />} />
      <Route path="/403" element={<AccessDeniedPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route
        path="/leave-request-not-found"
        element={<LeaveRequestNotFoundPage />}
      />
      <Route path="/409" element={<ConflictPage />} />
      <Route path="/500" element={<SystemErrorPage />} />
      <Route path="/503" element={<ServiceUnavailablePage />} />
      <Route path="/offline" element={<OfflinePage />} />

      <Route element={<RequireAuth />}>
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
          <Route element={<RequireCapability capability="approver" />}>
            <Route
              path="team/leave-approvals"
              element={<LeaveApprovalsPage />}
            />
            <Route
              path="team/leave-approvals/:leaveRequestId"
              element={<LeaveRequestReviewPage />}
            />
            <Route
              path="team/file-leave"
              element={<FileLeaveForMemberPage />}
            />
            <Route
              path="team/leave-calendar"
              element={<TeamLeaveCalendarPage />}
            />
            <Route
              path="team/leave-calendar/upcoming"
              element={<UpcomingApprovedLeavesPage />}
            />
            <Route
              path="team/leave-requests/:leaveRequestId"
              element={<LeaveRequestReviewPage />}
            />
          </Route>

          {/* Admin — src/pages/admin */}
          <Route element={<RequireCapability capability="admin" />}>
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
              path="admin/leave-balances/distributions/contractual/employees"
              element={
                <Navigate
                  to={distributionAssignPath('contractual')}
                  replace
                />
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
            <Route path="admin/logs" element={<AdminAdministrativeLogPage />} />
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
              element={<LeaveMonetizationCandidatesPage />}
            />
            <Route
              path="admin/reports/employees-with-lwop"
              element={<EmployeesWithLwopPage />}
            />
          </Route>
        </Route>
      </Route>

      {/* Keep invalid URL visible — do not redirect to /404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
