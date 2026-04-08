import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import AuthGuard, { RoleGuard, AuthProvider } from '../guards/AuthGuard';
import CandidateGuard from '../guards/CandidateGuard';
import MainLayout from '../layouts/MainLayout';
import { APP_ROUTES } from '../config/routes';

// Lazy load components
const LiveInterview = React.lazy(() => import('../pages/LiveInterview'));
const CandidateInterview = React.lazy(() => import('../pages/CandidateInterview'));

// Candidate Portal Components (Lazy loaded)
const Careers = React.lazy(() => import('../pages/Careers'));
const CandidateLogin = React.lazy(() => import('../pages/CandidateLogin'));
const CandidateRegister = React.lazy(() => import('../pages/CandidateRegister'));
const CandidateDashboard = React.lazy(() => import('../pages/CandidateDashboard'));

// Assessment Components (Lazy loaded)
const TakeAssessment = React.lazy(() => import('../pages/TakeAssessment'));
const AssessmentResults = React.lazy(() => import('../pages/AssessmentResults'));

// Loading fallback
const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
);

const AppRoutes = () => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {/* PUBLIC ROUTES - CANDIDATE PORTAL */}
                <Route path="/careers" element={<Careers />} />
                <Route path="/careers/:id" element={<Careers />} />
                <Route path="/candidate/login" element={<CandidateLogin />} />
                <Route path="/candidate/register" element={<CandidateRegister />} />
                <Route path="/login" element={<Login />} />
                <Route path="/live/:token" element={<CandidateInterview />} />

                {/* PUBLIC ROUTES - ASSESSMENT */}
                <Route path="/take-assessment/:attemptId" element={<TakeAssessment />} />
                <Route path="/assessment-results/:attemptId" element={<AssessmentResults />} />

                {/* PROTECTED ROUTES - CANDIDATE PORTAL */}
                <Route element={<CandidateGuard />}>
                    <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
                </Route>

                {/* PROTECTED ROUTES - RECRUITER/ADMIN */}
                <Route element={
                    <AuthProvider>
                        <AuthGuard />
                    </AuthProvider>
                }>
                    <Route element={<MainLayout />}>
                        {APP_ROUTES.map((route) => (
                            <Route
                                key={route.path}
                                path={route.path}
                                element={
                                    route.roles ? (
                                        <RoleGuard allowedRoles={route.roles}>
                                            <route.component />
                                        </RoleGuard>
                                    ) : (
                                        <route.component />
                                    )
                                }
                            />
                        ))}
                        {/* Default Redirect */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
