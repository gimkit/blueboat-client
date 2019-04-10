import Client from './lib/Client'
import Room from './lib/Room'

export interface EntityMap<T> {
  [entityId: string]: T
}

export { Room, Client }
