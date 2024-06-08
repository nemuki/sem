import {
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Code,
  Container,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks'
import {
  ConversationsHistoryResponse,
  ConversationsInfoResponse,
} from '@slack/web-api'
import { MessageElement } from '@slack/web-api/dist/types/response/ConversationsHistoryResponse'
import { useEffect, useMemo, useState } from 'react'
import { applicationConstants } from './constant.ts'
import { useAuth } from './hooks/useAuth.tsx'
import {
  chatPostMessage,
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

type PunchInSettings = {
  changeStatusEmoji: boolean
  attendance: boolean
  additionalMessage: string
  punchIn?: 'start' | 'end'
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
  const form3 = useForm<PunchInSettings>({
    mode: 'controlled',
    initialValues: {
      changeStatusEmoji: false,
      attendance: false,
      additionalMessage: '',
      punchIn: undefined,
    },
  })

  const filteredConversations = useMemo(() => {
    return conversationsHistory?.messages
      ?.filter((message) => message.type === 'message')
      .filter((message) =>
        message?.text?.includes(form.getValues().searchMessage),
      )[0]
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

  const getConversations = (values: typeof form.values) => {
    getConversationsInfo(values.channelId)

    if (values.searchMessage) {
      getConversationsHistory(values.channelId)
    }
  }

  const postMessage = async (channelId: string, message: string) => {
    if (slackOauthToken.accessToken) {
      try {
        const response = await chatPostMessage(
          slackOauthToken.accessToken,
          channelId,
          message,
          filteredConversations?.ts,
        )

        if (!response.ok) {
          console.error({ response })
        }
      } catch (error) {
        console.error(error)
      }
    }
  }

  const createPunchInStartMessage = (values: PunchInSettings) => {
    const baseMessage = values.attendance ? '業務' : 'テレワーク'
    return `${baseMessage}開始します\n${values.additionalMessage}`
  }

  const createPunchInEndMessage = (values: PunchInSettings) => {
    const baseMessage = values.attendance ? '業務' : 'テレワーク'
    return `${baseMessage}終了します\n${values.additionalMessage}`
  }

  const handleSubmit = (values: typeof form.values) => {
    getConversations(values)

    setLocalStorageAppSettings((prev) => ({
      ...prev,
      conversations: values,
    }))
  }

  const handleSubmit2 = (values: typeof form2.values) => {
    setLocalStorageAppSettings((prev) => ({
      ...prev,
      message: values,
    }))
  }

  /**
   * 出勤時の関数
   *
   * ステータス絵文字を変更する場合は、絵文字を変更する
   * メッセージを追加する場合は、メッセージを追加する
   * chatPostMessageを呼び出す
   */
  const handlePunchIn = (values: typeof form3.values) => {
    if (values.punchIn === undefined) {
      return
    }

    const channelId = localStorageAppSettings.conversations.channelId

    if (values.punchIn === 'start') {
      // 出社時の処理
      if (values.changeStatusEmoji) {
        // ステータス絵文字を変更する
      }

      // postMessageを呼び出す
      postMessage(channelId, createPunchInStartMessage(values))
    } else if (values.punchIn === 'end') {
      // 退勤時の処理
      if (values.changeStatusEmoji) {
        // ステータス絵文字を変更する
      }

      // postMessageを呼び出す
      postMessage(channelId, createPunchInEndMessage(values))
    }
  }

  useEffect(() => {
    if (form.values.channelId) {
      getConversations(form.values)
    }
  }, [])

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
                    Slack絵文字設定
                  </Title>
                  <Group grow>
                    <TextInput
                      label="出社時の絵文字"
                      key={form2.key('status.emoji.attendance')}
                      {...form2.getInputProps('status.emoji.attendance')}
                    />
                    <TextInput
                      label="出社時の絵文字メッセージ"
                      key={form2.key('status.text.attendance')}
                      {...form2.getInputProps('status.text.attendance')}
                    />
                  </Group>
                  <Group grow>
                    <TextInput
                      label="テレワーク時の絵文字"
                      key={form2.key('status.emoji.telework')}
                      {...form2.getInputProps('status.emoji.telework')}
                    />
                    <TextInput
                      label="テレワーク時の絵文字メッセージ"
                      key={form2.key('status.text.telework')}
                      {...form2.getInputProps('status.text.telework')}
                    />
                  </Group>
                  <Group grow>
                    <TextInput
                      label="退勤時の絵文字"
                      key={form2.key('status.emoji.leave')}
                      {...form2.getInputProps('status.emoji.leave')}
                    />
                    <TextInput
                      label="退勤時の絵文字メッセージ"
                      key={form2.key('status.text.leave')}
                      {...form2.getInputProps('status.text.leave')}
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
          <form onSubmit={form3.onSubmit(handlePunchIn)}>
            <Stack>
              <Checkbox
                description={''}
                label={'ステータス絵文字を変更する'}
                key={form3.key('changeStatusEmoji')}
                {...form3.getInputProps('changeStatusEmoji')}
              ></Checkbox>
              <Checkbox
                description={'デフォルトはテレワーク'}
                label={'出社時はチェック'}
                key={form3.key('attendance')}
                {...form3.getInputProps('attendance')}
              ></Checkbox>
              <Textarea
                minRows={2}
                maxRows={5}
                autosize
                label="追加メッセージ"
                description={'追加のメッセージを入力できます'}
                key={form3.key('additionalMessage')}
                {...form3.getInputProps('additionalMessage')}
              />
              <Group grow>
                <Button
                  type={'submit'}
                  onClick={() =>
                    form3.setValues((prev) => ({
                      ...prev,
                      punchIn: 'start',
                    }))
                  }
                >
                  出勤
                </Button>
                <Button
                  color={'pink'}
                  type={'submit'}
                  onClick={() => {
                    form3.setValues((prev) => ({
                      ...prev,
                      punchIn: 'end',
                    }))
                  }}
                >
                  退勤
                </Button>
              </Group>
              <Title order={2} size={'sm'}>
                送信メッセージプレビュー
              </Title>
              <Card withBorder>
                {form3.values.attendance ? '業務' : 'テレワーク'} 開始 / 終了
                します
                <Text inherit style={{ whiteSpace: 'pre-wrap' }}>
                  {form3.values.additionalMessage}
                </Text>
              </Card>
            </Stack>
          </form>
        </Grid.Col>
      </Grid>
    </Container>
  )
}

const Conversations = (props: { conversations?: MessageElement }) => {
  if (props.conversations === undefined) {
    return (
      <Text>メッセージが見つかりませんでした。チャンネルに投稿します。</Text>
    )
  }

  return (
    <>
      <Code block>{props.conversations.text}</Code>
      <details>
        <summary>メッセージを表示</summary>
        <Code block>{JSON.stringify(props.conversations, undefined, 2)}</Code>
      </details>
    </>
  )
}

export default App
