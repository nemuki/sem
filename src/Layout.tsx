import { AppShell, Group, Title } from '@mantine/core'
import React, { FC } from 'react'

type Props = {
  children: React.ReactNode
}

export const Layout: FC<Props> = (props: Props) => {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md">
          <Title order={1} size="h3">
            Slack Emoji Message
          </Title>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{props.children}</AppShell.Main>
    </AppShell>
  )
}
