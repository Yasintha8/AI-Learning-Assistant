import React, { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Navigate, Route } from 'react-router-dom'
import Spinner from './components/common/Spinner'
import InitialAppLoader from './components/common/InitialAppLoader'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import OfflineBanner from './components/common/OfflineBanner'
import { useAuth } from './context/AuthContext'

// Primary entry views imported directly for instantaneous first-paint
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import DashboardPage from './pages/Dashboard/DashboardPage'

// Secondary feature pages lazy-loaded on-demand to keep initial bundle lightweight
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const DocumentListPage = lazy(() => import('./pages/Documents/DocumentListPage'))
const DocumentDetailPage = lazy(() => import('./pages/Documents/DocumentDetailPage'))
const DocumentPreviewPage = lazy(() => import('./pages/Documents/DocumentPreviewPage'))
const FlashcardsListPage = lazy(() => import('./pages/Flashcards/FlashcardsListPage'))
const FlashcardPage = lazy(() => import('./pages/Flashcards/FlashcardPage'))
const QuizTakePage = lazy(() => import('./pages/Quizzes/QuizTakePage'))
const QuizResultPage = lazy(() => import('./pages/Quizzes/QuizResultPage'))
const LearningPathPage = lazy(() => import('./pages/LearningPath/LearningPathPage'))
const LearningPathsOverviewPage = lazy(() => import('./pages/LearningPath/LearningPathsOverviewPage'))
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'))
const CareerPage = lazy(() => import('./pages/Career/CareerPage'))

const App = () => {
  const { isAuthenticated } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  // Single unified initial boot splash to ensure smooth, flicker-free startup
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  if (isInitializing) {
    return <InitialAppLoader label="Preparing your workspace..." />;
  }

  return (
    <ErrorBoundary>
      <OfflineBanner />
      <Router>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentListPage />} />
            <Route path="/documents/:id" element={<DocumentDetailPage />} />
            <Route path="/documents/:id/preview" element={<DocumentPreviewPage />} />
            <Route path="/flashcards" element={<FlashcardsListPage />} />
            <Route path="/documents/:id/flashcards" element={<FlashcardPage />} />
            <Route path="/quizzes/:quizId" element={<QuizTakePage />} />
            <Route path="/quizzes/:quizId/results" element={<QuizResultPage />} />
            <Route path="/learning-paths" element={<LearningPathsOverviewPage />} />
            <Route path="/documents/:id/learning-path" element={<LearningPathPage />} />
            <Route path="/career" element={<CareerPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route
            path="*"
            element={
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-[50vh]">
                    <Spinner size="md" tone="primary" />
                  </div>
                }
              >
                <NotFoundPage />
              </Suspense>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App