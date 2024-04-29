import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks'
import { UsersProfileGetResponse } from '@slack/web-api'
import { useEffect, useState } from 'react'
import { fetchToken, fetchUserInfo } from '../slackApi.ts'

export const useAuth = () => {
  const [userProfile, setUserProfile] = useState<
    UsersProfileGetResponse | undefined
  >(undefined)

  const [localStorageSlackOauthToken, setLocalStorageSlackOauthToken] =
    useLocalStorage<{
      accessToken?: string
      refreshToken?: string
      expiresAt?: number
    }>({
      key: 'slackOAuthToken',
      defaultValue: readLocalStorageValue({
        key: 'slackOAuthToken',
        defaultValue: {},
      }),
    })

  const urlSearchParams = new URLSearchParams(window.location.search)
  const oauthAuthorizationCode = urlSearchParams.get('code')

  const getAuthorizationToken = async () => {
    if (!oauthAuthorizationCode) {
      return
    }

    try {
      const response = await fetchToken(
        'authorization_code',
        oauthAuthorizationCode,
      )

      if (!response.authed_user?.access_token) {
        throw new Error('No access token in response')
      }

      if (!response.authed_user?.refresh_token) {
        throw new Error('No refresh token in response')
      }

      if (!response.authed_user?.expires_in) {
        throw new Error('No expires in response')
      }

      setLocalStorageSlackOauthToken({
        accessToken: response.authed_user.access_token,
        refreshToken: response.authed_user.refresh_token,
        expiresAt: response.authed_user.expires_in,
      })

      window.location.href = window.location.origin
    } catch (error) {
      console.error(error)
    }
  }

  const getRefreshToken = async () => {
    const refreshToken = localStorageSlackOauthToken.refreshToken
    const expiresAt = localStorageSlackOauthToken.expiresAt

    const currentTimestamp = Date.now() / 1000
    const isTokenExpired = expiresAt && expiresAt < currentTimestamp

    if (!refreshToken) {
      return
    }

    console.info({ isExpired: isTokenExpired, expiresAt, currentTimestamp })

    if (isTokenExpired) {
      try {
        const response = await fetchToken('refresh_token', refreshToken)
        const expiresAt = response.expires_in
          ? currentTimestamp + response.expires_in
          : undefined

        setLocalStorageSlackOauthToken({
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresAt: expiresAt,
        })
      } catch (error) {
        console.error(error)
      }
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
      setUserProfile(response)
    } catch (error) {
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

  return { userProfile }
}
