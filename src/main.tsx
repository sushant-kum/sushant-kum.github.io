import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { ViteReactSSG } from 'vite-react-ssg/single-page';

import './styles/global.scss';
import App from './App.tsx';

export const createRoot = ViteReactSSG(
  <StrictMode>
    <App />
  </StrictMode>,
);
