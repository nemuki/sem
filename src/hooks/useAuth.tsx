import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks'
import { UsersProfileGetResponse } from '@slack/web-api'
import React, { FC, useEffect, useState } from 'react'
import { fetchToken, fetchUserProfile, revokeToken } from '../slackApi.ts'

type SlackOauthToken = {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}

type AuthContextProps = {
  authIsLoading: boolean
  authErrorMessage: string | undefined
  slackOauthToken: SlackOauthToken
  userProfile: UsersProfileGetResponse | undefined
  handleLogout: () => void
  handleRemoveLocalStorageSlackOauthToken: () => void
}

type AuthProviderProps = {
  children: React.ReactNode
}

const AuthContext = React.createContext<AuthContextProps | undefined>(undefined)

export const useAuth = () => {
  const context = React.useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export const AuthProvider: FC<AuthProviderProps> = (
  props: AuthProviderProps,
) => {
  const [authIsLoading, setAuthIsLoading] = useState<boolean>(true)
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

  const millisecondsInSecond = 1000
  const currentTimestamp = Date.now() / millisecondsInSecond

  /**
   * 初回アクセス時の処理
   */
  useEffect(() => {
    // ログイン情報がない場合は何もしない
    if (
      oauthAuthorizationCode === null &&
      Object.keys(localStorageSlackOauthToken).length === 0
    ) {
      setAuthIsLoading(false)
      return
    }

    if (oauthAuthorizationCode) {
      getAuthorizationToken()
    } else {
      getRefreshToken()
      getUserProfile()
    }

    setAuthIsLoading(false)
  }, [oauthAuthorizationCode])

  const handleSetError = (
    message: string,
    error: string | undefined | unknown,
  ) => {
    setAuthErrorMessage(`${message} ${error}`)
    console.error({ message, error })
    setAuthIsLoading(false)
  }

  /**
   * LocalStorage の Slack OAuth トークンを削除する
   */
  const handleRemoveLocalStorageSlackOauthToken = () => {
    removeLocalStorageSlackOauthToken()
    window.location.reload()
  }

  /**
   * ログアウト処理
   */
  const handleLogout = async () => {
    if (!localStorageSlackOauthToken.accessToken) {
      handleRemoveLocalStorageSlackOauthToken()
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

    handleRemoveLocalStorageSlackOauthToken()
  }

  /**
   * アクセストークンを取得する
   */
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
        expiresAt: currentTimestamp + response.authed_user.expires_in,
      })

      window.location.href = window.location.origin
    } catch (error) {
      handleSetError(errorMessage, error)
    }
  }

  /**
   * リフレッシュトークンを取得する
   */
  const getRefreshToken = async () => {
    const { refreshToken, expiresAt } = localStorageSlackOauthToken

    if (!refreshToken) {
      return
    }

    const isTokenExpired = expiresAt && expiresAt < currentTimestamp

    console.info({ isTokenExpired, expiresAt, currentTimestamp })

    if (!isTokenExpired) {
      return
    }

    const errorMessage = 'リフレッシュトークン取得処理でエラーが発生しました'

    try {
      const response = await fetchToken('refresh_token', refreshToken)

      if (!response.ok) {
        handleSetError(errorMessage, response.error)
        return
      }

      setLocalStorageSlackOauthToken({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: response.expires_in
          ? currentTimestamp + response.expires_in
          : undefined,
      })

      window.location.reload()
    } catch (error) {
      handleSetError(errorMessage, error)
    }
  }

  /**
   * ユーザ情報を取得する
   */
  const getUserProfile = async () => {
    if (!localStorageSlackOauthToken.accessToken) {
      return
    }

    const errorMessage = 'ユーザ情報取得処理でエラーが発生しました'

    try {
      const response = await fetchUserProfile(
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

  const value = {
    authIsLoading,
    authErrorMessage,
    slackOauthToken: localStorageSlackOauthToken,
    userProfile,
    handleLogout,
    handleRemoveLocalStorageSlackOauthToken,
  }

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  )
}
