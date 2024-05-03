import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks'
import { UsersProfileGetResponse } from '@slack/web-api'
import { useEffect, useState } from 'react'
import { fetchToken, fetchUserInfo, revokeToken } from '../slackApi.ts'

type SlackOauthToken = {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}

export const useAuth = () => {
  const [authErrorMessage, setAuthErrorMessage] = useState<string | undefined>(
    undefined,
  )
  const [userProfile, setUserProfile] = useState<
    UsersProfileGetResponse | undefined
  >(undefined)

  const [
    localStorageSlackOauthToken,
    setLocalStorageSlackOauthToken,
    removeLocalStorageSlackOauthToken,
  ] = useLocalStorage<SlackOauthToken>({
    key: 'slackOAuthToken',
    defaultValue: readLocalStorageValue({
      key: 'slackOAuthToken',
      defaultValue: {},
    }),
  })

  const urlSearchParams = new URLSearchParams(window.location.search)
  const oauthAuthorizationCode = urlSearchParams.get('code')

  useEffect(() => {
    if (oauthAuthorizationCode) {
      getAuthorizationToken()
    } else {
      getRefreshToken()
      getUserInfo()
    }
  }, [oauthAuthorizationCode])

  const handleSetError = (
    message: string,
    error: string | undefined | unknown,
  ) => {
    setAuthErrorMessage(`${message} ${error}`)
    console.error({ message, error })
  }

  const handleRemoveValue = () => {
    removeLocalStorageSlackOauthToken()
    window.location.reload()
  }

  const handleLogout = async () => {
    if (!localStorageSlackOauthToken.accessToken) {
      handleRemoveValue()
      return
    }

    const errorMessage = 'トークン削除処理でエラーが発生しました'

    try {
      const response = await revokeToken(
        localStorageSlackOauthToken.accessToken,
      )

      if (!response.ok) {
        handleSetError(errorMessage, response.error)
        return
      }
    } catch (error) {
      handleSetError(errorMessage, error)
      return
    }

    handleRemoveValue()
  }

  const getAuthorizationToken = async () => {
    if (!oauthAuthorizationCode) {
      return
    }

    const errorMessage = '認可コード取得処理でエラーが発生しました'

    try {
      const response = await fetchToken(
        'authorization_code',
        oauthAuthorizationCode,
      )

      if (!response.ok) {
        setAuthErrorMessage(`${errorMessage} ${response.error}`)
        return
      }

      if (!response.authed_user?.access_token) {
        handleSetError(
          errorMessage,
          'access_token がレスポンスに含まれていません',
        )
        return
      }

      if (!response.authed_user?.refresh_token) {
        handleSetError(
          errorMessage,
          'refresh_token がレスポンスに含まれていません',
        )
        return
      }

      if (!response.authed_user?.expires_in) {
        handleSetError(
          errorMessage,
          'expires_in がレスポンスに含まれていません',
        )
        return
      }

      setLocalStorageSlackOauthToken({
        accessToken: response.authed_user.access_token,
        refreshToken: response.authed_user.refresh_token,
        expiresAt: response.authed_user.expires_in,
      })

      window.location.href = window.location.origin
    } catch (error) {
      handleSetError(errorMessage, error)
    }
  }

  const getRefreshToken = async () => {
    const { refreshToken, expiresAt } = localStorageSlackOauthToken

    const millisecondsInSecond = 1000
    const currentTimestamp = Date.now() / millisecondsInSecond
    const isTokenExpired = expiresAt && expiresAt < currentTimestamp

    console.info({ isTokenExpired, expiresAt, currentTimestamp })

    if (!refreshToken || !isTokenExpired) {
      return
    }

    const errorMessage = 'リフレッシュトークン取得処理でエラーが発生しました'

    try {
      const response = await fetchToken('refresh_token', refreshToken)

      if (!response.ok) {
        handleSetError(errorMessage, response.error)
        return
      }

      const newExpiresAt = response.expires_in
        ? currentTimestamp + response.expires_in
        : undefined

      setLocalStorageSlackOauthToken({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: newExpiresAt,
      })

      window.location.reload()
    } catch (error) {
      handleSetError(errorMessage, error)
    }
  }

  const getUserInfo = async () => {
    if (!localStorageSlackOauthToken.accessToken) {
      return
    }

    const errorMessage = 'ユーザ情報取得処理でエラーが発生しました'

    try {
      const response = await fetchUserInfo(
        localStorageSlackOauthToken.accessToken,
      )

      if (!response.ok) {
        handleSetError(errorMessage, response.error)
        return
      }

      setUserProfile(response)
    } catch (error) {
      handleSetError(errorMessage, error)
    }
  }

  return {
    slackOauthToken: localStorageSlackOauthToken,
    userProfile,
    authErrorMessage,
    handleLogout,
    handleRemoveValue,
  }
}
