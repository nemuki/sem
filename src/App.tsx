import { Button, Code, Container, Text } from '@mantine/core'
import { applicationConstants } from './constant.ts'
import { useAuth } from './hooks/useAuth.tsx'

function App() {
  const {
    slackOauthToken,
    userProfile,
    error,
    handleLogout,
    handleRemoveValue,
  } = useAuth()

  if (!slackOauthToken || !userProfile) {
    return (
      <Container>
        <Button
          component={'a'}
          href={applicationConstants.slackOAuthAuthorizeUrl}
        >
          Login with Slack
        </Button>
        <Code block>Not logged in</Code>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Button
          onClick={() => {
            handleRemoveValue()
          }}
        >
          ログイン情報を削除
        </Button>
        <Text c={'red'} fw={500}>
          {error}
        </Text>
      </Container>
    )
  }

  return (
    <Container>
      <Button
        onClick={() => {
          handleLogout()
        }}
      >
        ログアウト
      </Button>
      <Text>{userProfile.profile?.real_name} でログイン中</Text>
      <Code block>{JSON.stringify(userProfile, undefined, 2)}</Code>
    </Container>
  )
}

export default App
