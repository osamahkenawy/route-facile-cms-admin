import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'

import App from './App'
import store from './store'
import AppState from './components/context/AppState'

createRoot(document.getElementById('root')).render(
  <AppState>
  <Provider store={store}>
    <App />
  </Provider>
  </AppState>,
)
