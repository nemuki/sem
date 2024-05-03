import '@mantine/core/styles.css'

import { MantineProvider } from '@mantine/core'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { Layout } from './Layout.tsx'
import { AuthProvider } from './hooks/useAuth.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider>
      <AuthProvider>
        <Layout>
          <App />
        </Layout>
      </AuthProvider>
    </MantineProvider>
  </React.StrictMode>,
)
