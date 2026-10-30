import { createRoot } from 'react-dom/client'
import '../styles/global.css'
import { OptionsPage } from './options'

const container = document.getElementById('root')
if (container) createRoot(container).render(<OptionsPage />)
