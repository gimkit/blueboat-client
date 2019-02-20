import SimpleClient from './SimpleClient'

export default interface RoomSnapshot {
  id: string
  type: string
  owner: SimpleClient
  metadata: any
}
