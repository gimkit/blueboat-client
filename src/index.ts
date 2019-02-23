import Client from './lib/Client'
import Room from './lib/Room'
export { DataChange } from '@gamestdio/state-listener'

export interface EntityMap<T> {
  [entityId: string]: T
}

export { Room, Client }
