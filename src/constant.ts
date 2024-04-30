import { env } from './env.ts'

const slackOAuthAuthorizeUrl = new URL('https://slack.com/oauth/v2/authorize')
slackOAuthAuthorizeUrl.searchParams.append('client_id', env.SLACK_CLIENT_ID)
slackOAuthAuthorizeUrl.searchParams.append('scope', '')
slackOAuthAuthorizeUrl.searchParams.append(
  'redirect_uri',
  env.SLACK_REDIRECT_URI,
)
slackOAuthAuthorizeUrl.searchParams.append(
  'user_scope',
  'channels:history,channels:read,users.profile:read,users.profile:write,chat:write',
)

export const applicationConstants = {
  slackOAuthAuthorizeUrl: slackOAuthAuthorizeUrl.toString(),
} as const
