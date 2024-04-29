import { OauthV2AccessResponse } from '@slack/web-api'
import { env } from './env.ts'

const slackApiBaseUrl = 'https://slack.com/api/'

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
