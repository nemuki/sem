import { env } from './env.ts'

const slackOauthAuthorizeUrl = new URL('https://slack.com/oauth/v2/authorize')
slackOauthAuthorizeUrl.searchParams.append('client_id', env.SLACK_CLIENT_ID)
slackOauthAuthorizeUrl.searchParams.append('scope', '')
slackOauthAuthorizeUrl.searchParams.append(
  'redirect_uri',
  env.SLACK_REDIRECT_URI,
)
slackOauthAuthorizeUrl.searchParams.append(
  'user_scope',
  'channels:history,channels:read,users.profile:read,users.profile:write,chat:write',
)

export const applicationConstants = {
  slackOauthAuthorizeUrl: slackOauthAuthorizeUrl.toString(),
} as const
