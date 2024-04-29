import '@mantine/core/styles.css'

import { Code, MantineProvider } from '@mantine/core'
import { applicationConstants } from './constant.ts'
import { useAuth } from './hooks/useAuth.tsx'

function App() {
  const { localStorageSlackOauthToken } = useAuth()

  return (
    <MantineProvider>
      <a href={applicationConstants.slackOAuthAuthorizeUrl}>Slack</a>
      <Code block>
        {localStorageSlackOauthToken
          ? JSON.stringify(localStorageSlackOauthToken, undefined, 2)
          : 'No access token'}
      </Code>
    </MantineProvider>
  )
}

export default App
