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
import { AdminLeaveRequestsPage } from './pages/admin/AdminLeaveRequestsPage'
import { AdminLeaveRequestViewPage } from './pages/admin/AdminLeaveRequestViewPage'
import { AdminLeaveValidatePage } from './pages/admin/AdminLeaveValidatePage'

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
          element={<PagePlaceholder title="Leave Balances" />}
        />
        <Route
          path="admin/leave-balances/distributions/new"
          element={<PagePlaceholder title="Select Distribution Type" />}
        />
        <Route
          path="admin/leave-balances/distributions/new/configure"
          element={<PagePlaceholder title="Configure Distribution" />}
        />
        <Route
          path="admin/leave-balances/distributions/new/employees"
          element={<PagePlaceholder title="Select Employees" />}
        />
        <Route
          path="admin/leave-balances/distributions/new/review"
          element={<PagePlaceholder title="Review Distribution" />}
        />
        <Route
          path="admin/leave-balances/distributions/:distributionId"
          element={<PagePlaceholder title="Distribution Details" />}
        />
        <Route
          path="admin/logs"
          element={<PagePlaceholder title="Administrative Log" />}
        />
        <Route
          path="admin/logs/:logId"
          element={<PagePlaceholder title="Administrative Log Details" />}
        />
        <Route
          path="admin/reports"
          element={<PagePlaceholder title="Leave Reports" />}
        />
      </Route>
    </Routes>
  )
}

export default App
