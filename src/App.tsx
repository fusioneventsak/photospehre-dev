import React from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  Route, 
  createRoutesFromElements,
  Navigate
} from 'react-router-dom';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CollageEditorPage from './pages/CollageEditorPage';
import CollageViewerPage from './pages/CollageViewerPage';
import CollageModerationPage from './pages/CollageModerationPage';
import PhotoboothPage from './pages/PhotoboothPage';
import JoinCollage from './pages/JoinCollage';

// Create router with future flag enabled
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/join" element={<JoinCollage />} />
      <Route path="/collage/:code" element={<CollageViewerPage />} />
      <Route path="/photobooth/:code" element={<PhotoboothPage />} />
      
      {/* Redirect for common typo */}
      <Route path="/dashbaord" element={<Navigate to="/dashboard" replace />} />
      
      {/* Protected routes - require authentication */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/collage/:id" element={<CollageEditorPage />} />
      <Route path="/collage/:id/moderation" element={<CollageModerationPage />} />
      <Route path="/moderation/:id" element={<CollageModerationPage />} />
    </Route>
  ),
  {
    future: {
      v7_relativeSplatPath: true,
      v7_startTransition: true
    }
  }
);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;