import {
  AuthRevokeResponse,
  ConversationsHistoryResponse,
  ConversationsInfoResponse,
  OauthV2AccessResponse,
  UsersProfileGetResponse,
} from '@slack/web-api'
import { env } from './env.ts'

const slackApiBaseUrl = 'https://slack.com/api'

export async function fetchToken(
  grantType: 'authorization_code' | 'refresh_token',
  token: string,
): Promise<OauthV2AccessResponse> {
  const params = new URLSearchParams()
  params.append('client_id', env.SLACK_CLIENT_ID)
  params.append('client_secret', env.SLACK_CLIENT_SECRET)
  params.append('redirect_uri', env.SLACK_REDIRECT_URI)
  params.append('grant_type', grantType)

  switch (grantType) {
    case 'authorization_code':
      params.append('code', token)
      break
    case 'refresh_token':
      params.append('refresh_token', token)
      break
  }

  const response = await fetch(`${slackApiBaseUrl}/oauth.v2.access`, {
    method: 'POST',
    body: params,
  })

  return response.json()
}

export const revokeToken = async (
  accessToken: string,
): Promise<AuthRevokeResponse> => {
  const formData = new FormData()
  formData.append('token', accessToken)

  return fetch(`${slackApiBaseUrl}/auth.revoke`, {
    method: 'POST',
    body: formData,
  })
}

export const fetchUserInfo = async (
  accessToken: string,
): Promise<UsersProfileGetResponse> => {
  const formData = new FormData()
  formData.append('token', accessToken)

  const response = await fetch(`${slackApiBaseUrl}/users.profile.get`, {
    method: 'POST',
    body: formData,
  })

  return response.json()
}

export const fetchConversationsHistory = async (
  accessToken: string,
  channelId: string,
): Promise<ConversationsHistoryResponse> => {
  const formData = new FormData()
  formData.append('token', accessToken)
  formData.append('channel', channelId)

  const response = await fetch(`${slackApiBaseUrl}/conversations.history`, {
    method: 'POST',
    body: formData,
  })

  return response.json()
}

export const fetchConversationsInfo = async (
  accessToken: string,
  channelId: string,
): Promise<ConversationsInfoResponse> => {
  const formData = new FormData()
  formData.append('token', accessToken)
  formData.append('channel', channelId)

  const response = await fetch(`${slackApiBaseUrl}/conversations.info`, {
    method: 'POST',
    body: formData,
  })

  return response.json()
}

export const chatPostMessage = async (
  accessToken: string,
  channelId: string,
  message: string,
  threadTs?: string,
): Promise<Response> => {
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: message,
        emoji: true,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'Posted by Slack Emoji Message App',
        },
      ],
    },
  ]

  const formData = new FormData()
  formData.append('token', accessToken)
  formData.append('channel', channelId)
  formData.append('blocks', JSON.stringify(blocks))
  formData.append('unfurl_media', 'false')

  if (threadTs) {
    formData.append('thread_ts', threadTs)
  }

  return fetch(`${slackApiBaseUrl}/chat.postMessage`, {
    method: 'POST',
    body: formData,
  })
}
