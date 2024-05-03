import { Button, Code, Container, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import {
  ConversationsHistoryResponse,
  ConversationsInfoResponse,
} from '@slack/web-api'
import { useMemo, useState } from 'react'
import { applicationConstants } from './constant.ts'
import { useAuth } from './hooks/useAuth.tsx'
import {
  chatPostMessage,
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

  const form = useForm<{ channelId: string }>({ mode: 'uncontrolled' })
  const form2 = useForm<{ message: string }>({ mode: 'uncontrolled' })

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

  const handleSubmit2 = (values: typeof form2.values) => {
    const channelId = form.getValues().channelId
    if (slackOauthToken.accessToken) {
      chatPostMessage(slackOauthToken.accessToken, channelId, values.message)
    }
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

  if (!slackOauthToken || !userProfile) {
    return (
      <Container>
        <Button
          component={'a'}
          href={applicationConstants.slackOauthAuthorizeUrl}
        >
          Login with Slack
        </Button>
        <Code block>Not logged in</Code>
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
      <form onSubmit={form2.onSubmit(handleSubmit2)}>
        <TextInput
          label="Message"
          key={form2.key('message')}
          {...form2.getInputProps('message')}
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
