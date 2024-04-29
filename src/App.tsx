import { Button, Code, Container, Text } from '@mantine/core'
import { ConversationsListResponse } from '@slack/web-api'
import { useEffect, useState } from 'react'
import { applicationConstants } from './constant.ts'
import { useAuth } from './hooks/useAuth.tsx'
import { fetchConversationsHistory } from './slackApi.ts'

function App() {
  const {
    slackOauthToken,
    userProfile,
    error,
    handleLogout,
    handleRemoveValue,
  } = useAuth()

  const [conversations, setConversations] = useState<
    ConversationsListResponse | undefined
  >(undefined)

  const getConversationsHistory = async () => {
    if (slackOauthToken.accessToken) {
      try {
        const response = await fetchConversationsHistory(
          slackOauthToken.accessToken,
          '',
        )

        if (!response.ok) {
          console.error(response.error)
        }

        setConversations(response)
      } catch (error) {
        console.error(error)
      }
    }
  }

  useEffect(() => {
    getConversationsHistory()
  }, [])

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
      <Text>{userProfile.profile?.real_name} でログイン中</Text>
      <Button
        onClick={() => {
          handleLogout()
        }}
        w={'fit-content'}
      >
        ログアウト
      </Button>
      <Text>User profile</Text>
      <Code block>{JSON.stringify(userProfile, undefined, 2)}</Code>
      <Text>Conversations</Text>
      <Code block>{JSON.stringify(conversations, undefined, 2)}</Code>
    </Container>
  )
}

export default App
