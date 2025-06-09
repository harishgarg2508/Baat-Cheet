import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter as Browserrouter } from "react-router-dom"
import { Provider } from 'react-redux'
import { store } from './redux/store.ts'


createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    
    <Browserrouter>
      <App />
    </Browserrouter>
  </Provider>
)
