export { default as GroupInfoTab } from './GroupInfoTab'
export { default as GroupMembersTab } from './GroupMembersTab'
export { default as GroupGamesTab } from './GroupGamesTab'
export { default as GroupInvitesTab } from './GroupInvitesTab'
export { default as GroupEventsTab } from './GroupEventsTab'
export { default as TabPanel, a11yProps } from './TabPanel'

// Enum for tab values that correspond to URL params
export enum TabValue {
  Info = 'info',
  Events = 'events',
  Members = 'members',
  Games = 'games',
  Invites = 'invites',
}

// Maps for tab index <-> tab value conversion
export const indexToTabValue: Record<number, TabValue> = {
  0: TabValue.Info,
  1: TabValue.Events,
  2: TabValue.Members,
  3: TabValue.Games,
  4: TabValue.Invites,
}

export const tabValueToIndex: Record<string, number> = {
  [TabValue.Info]: 0,
  [TabValue.Events]: 1,
  [TabValue.Members]: 2,
  [TabValue.Games]: 3,
  [TabValue.Invites]: 4,
}
