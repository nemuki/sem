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
  const [error, setError] = useState<string | undefined>(undefined)
  const [userProfile, setUserProfile] = useState<
    UsersProfileGetResponse | undefined
  >(undefined)

  const [
    localStorageSlackOauthToken,
    setLocalStorageSlackOauthToken,
    removeValue,
  ] = useLocalStorage<SlackOauthToken>({
    key: 'slackOAuthToken',
    defaultValue: readLocalStorageValue({
      key: 'slackOAuthToken',
      defaultValue: {},
    }),
  })

  const urlSearchParams = new URLSearchParams(window.location.search)
  const oauthAuthorizationCode = urlSearchParams.get('code')

  const handleRemoveValue = () => {
    removeValue()
    window.location.reload()
  }

  const handleLogout = async () => {
    if (!localStorageSlackOauthToken.accessToken) {
      removeValue()
      window.location.reload()
      return
    }

    try {
      const response = await revokeToken(
        localStorageSlackOauthToken.accessToken,
      )

      if (!response.ok) {
        setError(`トークン削除処理でエラーが発生しました ${response.error}`)
        return
      }
    } catch (error) {
      setError(`トークン削除処理でエラーが発生しました ${error}`)
      console.error(error)
      return
    }

    removeValue()
    window.location.reload()
  }

  const getAuthorizationToken = async () => {
    if (!oauthAuthorizationCode) {
      return
    }

    try {
      const response = await fetchToken(
        'authorization_code',
        oauthAuthorizationCode,
      )

      if (!response.ok) {
        setError(`認可コード取得処理でエラーが発生しました ${response.error}`)
        return
      }

      if (!response.authed_user?.access_token) {
        setError(`No access token in response`)
        return
      }

      if (!response.authed_user?.refresh_token) {
        setError('No refresh token in response')
        return
      }

      if (!response.authed_user?.expires_in) {
        setError('No expires in response')
        return
      }

      setLocalStorageSlackOauthToken({
        accessToken: response.authed_user.access_token,
        refreshToken: response.authed_user.refresh_token,
        expiresAt: response.authed_user.expires_in,
      })

      window.location.href = window.location.origin
    } catch (error) {
      setError(`認可コード取得処理でエラーが発生しました ${error}`)
      console.error(error)
    }
  }

  const getRefreshToken = async () => {
    const refreshToken = localStorageSlackOauthToken.refreshToken
    const expiresAt = localStorageSlackOauthToken.expiresAt

    const millisecondsInSecond = 1000
    const currentTimestamp = Date.now() / millisecondsInSecond
    const isTokenExpired = expiresAt && expiresAt < currentTimestamp

    console.info({ isExpired: isTokenExpired, expiresAt, currentTimestamp })

    if (!refreshToken || !isTokenExpired) {
      return
    }

    try {
      const response = await fetchToken('refresh_token', refreshToken)

      if (!response.ok) {
        setError(
          `リフレッシュトークン取得処理でエラーが発生しました ${response.error}`,
        )
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
    } catch (error) {
      setError(`リフレッシュトークン取得処理でエラーが発生しました ${error}`)
      console.error(error)
    }
  }

  const getUserInfo = async () => {
    if (!localStorageSlackOauthToken.accessToken) {
      return
    }

    try {
      const response = await fetchUserInfo(
        localStorageSlackOauthToken.accessToken,
      )

      if (!response.ok) {
        setError(`ユーザ情報取得処理でエラーが発生しました ${response.error}`)
        console.error(response.error)
        return
      }

      setUserProfile(response)
    } catch (error) {
      setError(`ユーザ情報取得処理でエラーが発生しました ${error}`)
      console.error(error)
    }
  }

  useEffect(() => {
    if (oauthAuthorizationCode) {
      getAuthorizationToken()
    } else {
      getRefreshToken()
      getUserInfo()
    }
  }, [])

  return {
    slackOauthToken: localStorageSlackOauthToken,
    userProfile,
    error,
    handleLogout,
    handleRemoveValue,
  }
}
