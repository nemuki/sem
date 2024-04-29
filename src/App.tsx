import '@mantine/core/styles.css'

import { MantineProvider } from '@mantine/core'
import { OauthV2AccessResponse } from '@slack/web-api'
import { useEffect, useState } from 'react'
import { applicationConstants } from './constant.ts'
import { fetchToken } from './slackApi.ts'

function App() {
  const [accessToken, setAccessToken] = useState<
    OauthV2AccessResponse | undefined
  >(undefined)

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search)
    const oauthAuthorizationCode = urlSearchParams.get('code')

    if (oauthAuthorizationCode) {
      console.info(oauthAuthorizationCode)

      fetchToken('authorization_code', oauthAuthorizationCode)
        .then((response) => {
          console.info(response)
          setAccessToken(response)
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }, [])

  return (
    <MantineProvider>
      <p>Hi</p>
      <a href={applicationConstants.slackOAuthAuthorizeUrl}>Slack</a>
      <pre>
        <code>
          {accessToken
            ? JSON.stringify(accessToken, undefined, 2)
            : 'No access token'}
        </code>
      </pre>
    </MantineProvider>
  )
}

export default App
