import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Páginas extras, carregadas só quando acessadas.
const PAGES: Record<string, ReturnType<typeof lazy>> = {
  '/momentos': lazy(() => import('./pages/Momentos')),
  '/fotos': lazy(() => import('./pages/Fotos')),
};

const Page = PAGES[window.location.pathname.replace(/\/+$/, '').toLowerCase()];

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {Page ? (
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
