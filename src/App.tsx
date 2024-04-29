import { Button, Code, Container, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import {
  ConversationsHistoryResponse,
  ConversationsInfoResponse,
} from '@slack/web-api'
import { useEffect, useMemo, useState } from 'react'
import { applicationConstants } from './constant.ts'
import { useAuth } from './hooks/useAuth.tsx'
import {
  fetchConversationsHistory,
  fetchConversationsInfo,
} from './slackApi.ts'

function App() {
  const {
    slackOauthToken,
    userProfile,
    error,
    handleLogout,
    handleRemoveValue,
  } = useAuth()

  const [conversationsHistory, setConversationsHistory] = useState<
    ConversationsHistoryResponse | undefined
  >(undefined)

  const filteredConversations = useMemo(() => {
    return conversationsHistory?.messages
      ?.filter((message) => message.type === 'message')
      .filter((message) => message?.text?.includes('スレッド'))
  }, [conversationsHistory])

  const [channelInfo, setChannelInfo] = useState<
    ConversationsInfoResponse | undefined
  >(undefined)

  const form = useForm<{ channelId: string }>()

  const getConversationsHistory = async (channelId: string) => {
    if (slackOauthToken.accessToken) {
      try {
        const response = await fetchConversationsHistory(
          slackOauthToken.accessToken,
          channelId,
        )

        if (!response.ok) {
          console.error(response.error)
        }

        setConversationsHistory(response)
      } catch (error) {
        console.error(error)
      }
    }
  }

  const getConversationsInfo = async (channelId: string) => {
    if (slackOauthToken.accessToken) {
      try {
        const response = await fetchConversationsInfo(
          slackOauthToken.accessToken,
          channelId,
        )

        if (!response.ok) {
          console.error(response.error)
        }

        setChannelInfo(response)
      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleSubmit = (values: typeof form.values) => {
    getConversationsInfo(values.channelId)
    getConversationsHistory(values.channelId)
  }

  useEffect(() => {
    getConversationsHistory('')
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
      <Code block>{JSON.stringify(userProfile.profile, undefined, 2)}</Code>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="Channel ID"
          key={form.key('channelId')}
          {...form.getInputProps('channelId')}
        />
      </form>
      <Text>
        チャンネル名:{' '}
        <Text span fw={700}>
          {channelInfo?.channel?.name}
        </Text>
      </Text>
      <Text>Messages</Text>
      <Code block>{JSON.stringify(filteredConversations, undefined, 2)}</Code>
      <Text>Conversations</Text>
      <Code block>{JSON.stringify(conversationsHistory, undefined, 2)}</Code>
    </Container>
  )
}

export default App
