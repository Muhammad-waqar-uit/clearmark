import { createRoot } from 'react-dom/client'
import '../styles/global.css'
import { ManagerPage } from './manager'

const container = document.getElementById('root')
if (container) createRoot(container).render(<ManagerPage />)
