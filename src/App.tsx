import '@mantine/core/styles.css'

import { Button, Code, Container, MantineProvider, Space } from '@mantine/core'
import { applicationConstants } from './constant.ts'
import { useAuth } from './hooks/useAuth.tsx'

function App() {
  const { userProfile } = useAuth()

  return (
    <MantineProvider>
      <Container>
        <Button
          component={'a'}
          href={applicationConstants.slackOAuthAuthorizeUrl}
        >
          Login with Slack
        </Button>
        <Space />
        <Code block>
          {userProfile
            ? JSON.stringify(userProfile, undefined, 2)
            : 'No access token'}
        </Code>
      </Container>
    </MantineProvider>
  )
}

export default App
