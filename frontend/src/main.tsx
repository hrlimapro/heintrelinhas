// Ponto de entrada do frontend: monta o componente App na div #root (index.html).
// StrictMode ajuda a detectar efeitos colaterais em desenvolvimento.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
