import '@mantine/core/styles.css'

import { Code, MantineProvider } from '@mantine/core'
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks'
import { OauthV2AccessResponse } from '@slack/web-api'
import { useEffect, useState } from 'react'
import { applicationConstants } from './constant.ts'
import { fetchToken } from './slackApi.ts'

function App() {
  const [slackOauthAccessToken, setSlackOauthAccessToken] = useState<
    OauthV2AccessResponse | undefined
  >(undefined)

  const [localStorageSlackOauthToken, setLocalStorageSlackOauthToken] =
    useLocalStorage<{
      accessToken?: string
      refreshToken?: string
    }>({
      key: 'slackOAuthToken',
      defaultValue: readLocalStorageValue({ key: 'slackOAuthToken' }),
    })

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search)
    const oauthAuthorizationCode = urlSearchParams.get('code')

    if (oauthAuthorizationCode) {
      fetchToken('authorization_code', oauthAuthorizationCode)
        .then((response) => {
          setLocalStorageSlackOauthToken({
            accessToken: response.authed_user?.access_token,
            refreshToken: response.authed_user?.refresh_token,
          })
        })
        .catch((error) => {
          console.error(error)
        })

      window.location.href = window.location.origin
    } else {
      const refreshToken = localStorageSlackOauthToken.refreshToken

      if (refreshToken) {
        fetchToken('refresh_token', refreshToken).then((response) => {
          setLocalStorageSlackOauthToken({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
          })

          setSlackOauthAccessToken(response)
        })
      }
    }
  }, [])

  return (
    <MantineProvider>
      <p>Hi</p>
      <a href={applicationConstants.slackOAuthAuthorizeUrl}>Slack</a>
      <Code block>
        {slackOauthAccessToken
          ? JSON.stringify(slackOauthAccessToken, undefined, 2)
          : 'No access token'}
      </Code>
    </MantineProvider>
  )
}

export default App
