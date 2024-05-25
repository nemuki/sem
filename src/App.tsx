import {
  Avatar,
  Button,
  Checkbox,
  Code,
  Container,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks'
import {
  ConversationsHistoryResponse,
  ConversationsInfoResponse,
} from '@slack/web-api'
import { MessageElement } from '@slack/web-api/dist/types/response/ConversationsHistoryResponse'
import { useMemo, useState } from 'react'
import { applicationConstants } from './constant.ts'
import { useAuth } from './hooks/useAuth.tsx'
import {
  fetchConversationsHistory,
  fetchConversationsInfo,
} from './slackApi.ts'

type Conversations = {
  channelId: string
  searchMessage: string
}

type WorkStatus = {
  office?: string
  telework?: string
  leave?: string
}

type AppSettings = {
  conversations: Conversations
  status?: {
    emoji: WorkStatus
    text: WorkStatus
  }
}

function App() {
  const {
    authIsLoading,
    authErrorMessage,
    slackOauthToken,
    userProfile,
    handleLogout,
    handleRemoveLocalStorageSlackOauthToken,
  } = useAuth()

  const [localStorageAppSettings, setLocalStorageAppSettings] =
    useLocalStorage<AppSettings>({
      key: 'appSettings',
      defaultValue: readLocalStorageValue({
        key: 'appSettings',
        defaultValue: {
          conversations: {
            channelId: '',
            searchMessage: '',
          },
          status: {
            emoji: {
              attendance: ':office:',
              telework: ':house_with_garden:',
              leave: ':soon:',
            },
            text: {
              attendance: '出社しています',
              telework: 'テレワーク',
              leave: '退勤しています',
            },
          },
        },
      }),
    })

  const [conversationsHistory, setConversationsHistory] = useState<
    ConversationsHistoryResponse | undefined
  >(undefined)
  const [conversationsInfo, setConversationsInfo] = useState<
    ConversationsInfoResponse | undefined
  >(undefined)

  const form = useForm<Conversations>({
    mode: 'uncontrolled',
    initialValues: localStorageAppSettings.conversations,
  })
  const form2 = useForm<AppSettings>({
    mode: 'uncontrolled',
    initialValues: localStorageAppSettings,
  })

  const filteredConversations = useMemo(() => {
    return conversationsHistory?.messages
      ?.filter((message) => message.type === 'message')
      .filter((message) =>
        message?.text?.includes(form.getValues().searchMessage),
      )
  }, [conversationsHistory])

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

        setConversationsInfo(response)
      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleSubmit = (values: typeof form.values) => {
    getConversationsInfo(values.channelId)

    if (values.searchMessage) {
      getConversationsHistory(values.channelId)

      setLocalStorageAppSettings((prev) => ({
        ...prev,
        conversations: {
          channelId: values.channelId,
          searchMessage: values.searchMessage,
        },
      }))
    }
  }

  const handleSubmit2 = (values: typeof form2.values) => {
    setLocalStorageAppSettings((prev) => ({
      ...prev,
      message: values,
    }))
  }

  if (Object.keys(slackOauthToken).length === 0) {
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

  if (authErrorMessage) {
    return (
      <Container>
        <Button
          onClick={() => {
            handleRemoveLocalStorageSlackOauthToken()
          }}
        >
          ログイン情報を削除
        </Button>
        <Text c={'red'} fw={500}>
          {authErrorMessage}
        </Text>
      </Container>
    )
  }

  if (authIsLoading || !userProfile) {
    return (
      <Container>
        <Group>
          <Loader />
          <Text>Authenticating...</Text>
        </Group>
      </Container>
    )
  }

  return (
    <Container>
      <Grid>
        <Grid.Col span={6}>
          <Stack>
            <Stack>
              <Group>
                <Avatar src={userProfile.profile?.image_192} />
                <Text>{userProfile.profile?.real_name} でログイン中</Text>
              </Group>
              <Button
                onClick={() => {
                  handleLogout()
                }}
                w={'fit-content'}
              >
                ログアウト
              </Button>
            </Stack>
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack>
                <TextInput
                  label="チャンネルID"
                  description="投稿するチャンネルのIDを入力してください"
                  key={form.key('channelId')}
                  {...form.getInputProps('channelId')}
                />
                <TextInput
                  label="メッセージ検索"
                  description="検索文言を含む、本日午前6時以降のメッセージを検索します ex.勤怠スレッド"
                  key={form.key('searchMessage')}
                  {...form.getInputProps('searchMessage')}
                />
                <Button type={'submit'} w={'fit-content'}>
                  検索
                </Button>
              </Stack>
            </form>
            <div>
              <Text size={'sm'}>投稿するチャンネル名</Text>
              <Text span fw={700}>
                {conversationsInfo?.channel?.name}
              </Text>
            </div>
            <div>
              <Text size={'sm'}>返信するメッセージ</Text>
              <Conversations conversations={filteredConversations} />
            </div>
            <div>
              <form onSubmit={form2.onSubmit(handleSubmit2)}>
                <Stack>
                  <Title order={2} size={'sm'}>
                    絵文字設定
                  </Title>
                  <Group>
                    <TextInput
                      label="出社時のSlack絵文字"
                      key={form2.key('status.emoji.attendance')}
                      {...form2.getInputProps('status.emoji.attendance')}
                    />
                    <TextInput
                      label="出社時のSlack絵文字メッセージ"
                      key={form2.key('status.text.attendance')}
                      {...form2.getInputProps('status.text.attendance')}
                    />
                  </Group>
                  <Group>
                    <TextInput
                      label="退勤時のSlack絵文字"
                      key={form2.key('status.emoji.leave')}
                      {...form2.getInputProps('status.emoji.leave')}
                    />
                    <TextInput
                      label="退勤時のSlack絵文字メッセージ"
                      key={form2.key('status.text.leave')}
                      {...form2.getInputProps('status.text.leave')}
                    />
                  </Group>
                  <Group>
                    <TextInput
                      label="テレワーク時のSlack絵文字"
                      key={form2.key('status.emoji.telework')}
                      {...form2.getInputProps('status.emoji.telework')}
                    />
                    <TextInput
                      label="テレワーク時のSlack絵文字メッセージ"
                      key={form2.key('status.text.telework')}
                      {...form2.getInputProps('status.text.telework')}
                    />
                  </Group>
                  <Button type={'submit'} w={'fit-content'}>
                    保存
                  </Button>
                </Stack>
              </form>
            </div>
          </Stack>
        </Grid.Col>
        <Grid.Col span={6}>
          <Stack>
            <Checkbox
              description={'デフォルトはテレワーク'}
              label={'出社時はチェック'}
            ></Checkbox>
            <TextInput label="追加メッセージ" />
            <Button>出社</Button>
            <Button color={'pink'}>退勤</Button>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  )
}

const Conversations = (props: { conversations?: MessageElement[] }) => {
  if (props.conversations === undefined) {
    return <></>
  }

  if (props.conversations.length === 0) {
    return <Text>メッセージが見つかりませんでした</Text>
  }

  return <Code block>{JSON.stringify(props.conversations, undefined, 2)}</Code>
}

export default App
