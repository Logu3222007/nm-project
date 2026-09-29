import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingState } from "@/components/common/LoadingState";

const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Documents = lazy(() => import("@/pages/Documents"));
const NewDocument = lazy(() => import("@/pages/NewDocument"));
const DocumentEditor = lazy(() => import("@/pages/DocumentEditor"));
const Templates = lazy(() => import("@/pages/Templates"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function withSuspense(el: JSX.Element) {
  return <Suspense fallback={<LoadingState fullPage />}>{el}</Suspense>;
}

const router = createBrowserRouter([
  { path: "/login", element: withSuspense(<Login />) },
  { path: "/register", element: withSuspense(<Register />) },
  { path: "/forgot-password", element: withSuspense(<ForgotPassword />) },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: withSuspense(<Dashboard />) },
      { path: "documents", element: withSuspense(<Documents />) },
      { path: "documents/new", element: withSuspense(<NewDocument />) },
      { path: "documents/:id", element: withSuspense(<DocumentEditor />) },
      { path: "templates", element: withSuspense(<Templates />) },
      { path: "settings", element: withSuspense(<Settings />) },
    ],
  },
  { path: "*", element: withSuspense(<NotFound />) },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
