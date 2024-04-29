import { OauthV2AccessResponse } from '@slack/web-api'
import { env } from './env.ts'

const slackApiBaseUrl = 'https://slack.com/api/'

export async function fetchToken(
  grantType: 'authorization_code',
  token: string,
  refreshToken?: never,
): Promise<OauthV2AccessResponse>

export async function fetchToken(
  grantType: 'refresh_token',
  refreshToken: string,
  token?: never,
): Promise<OauthV2AccessResponse>

export async function fetchToken(
  grantType: 'authorization_code' | 'refresh_token',
  code?: string,
  refreshToken?: string,
): Promise<OauthV2AccessResponse> {
  const params = new URLSearchParams()
  params.append('client_id', env.SLACK_CLIENT_ID)
  params.append('client_secret', env.SLACK_CLIENT_SECRET)
  params.append('redirect_uri', env.SLACK_REDIRECT_URI)
  params.append('grant_type', grantType)

  switch (grantType) {
    case 'authorization_code':
      if (!code) {
        throw new Error('Code is required when grantType is authorization_code')
      }
      params.append('code', code)
      break
    case 'refresh_token':
      if (!refreshToken) {
        throw new Error(
          'Refresh token is required when grantType is refresh_token',
        )
      }
      params.append('refresh_token', refreshToken)
      break
  }

  const response = await fetch(`${slackApiBaseUrl}/oauth.v2.access`, {
    method: 'POST',
    body: params,
  })

  return response.json()
}
