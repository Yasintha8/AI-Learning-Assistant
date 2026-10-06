import React, { Suspense } from 'react'
import AppLayout from '../layout/AppLayout'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../common/Spinner'

const ContentLoader = () => (
  <div className="flex-1 w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 text-text-muted">
    <Spinner size="lg" tone="primary" />
    <span className="text-xs font-semibold animate-pulse tracking-wide text-text-muted">Loading view...</span>
  </div>
)

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg-main z-50">
        <Spinner size="lg" tone="primary" label="Verifying session..." />
      </div>
    )
  }

  return isAuthenticated ? (
    <AppLayout>
      <Suspense fallback={<ContentLoader />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  ) : (
    <Navigate to="/login" replace />
  )
}

export default ProtectedRoute