import { applicationConstants } from './constant.ts'

function App() {
  return (
    <>
      <p>Hi</p>
      <a href={applicationConstants.slackOAuthAuthorizeUrl}>Slack</a>
    </>
  )
}

export default App
