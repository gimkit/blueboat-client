import { DataChange, StateContainer } from '@gamestdio/state-listener'
import jsonpatch from 'fast-json-patch'
import ServerActions from '../lib/constants/ServerActions'
import Callback from './Callback'

class Room<State = any> {
  public id: string
  public joined: boolean = false
  // @ts-ignore
  public state: State = {}

  private socket: SocketIOClient.Socket
  private stateContainer = new StateContainer({})

  public onCreate = new Callback()
  public onJoin = new Callback()
  public onLeave = new Callback()
  public onError = new Callback()

  constructor(socket: SocketIOClient.Socket, roomId?: string) {
    if (roomId) {
      this.id = roomId
    }
    if (socket) {
      this.socket = socket
      if (roomId) {
        this.socketListener()
      }
    }
  }

  public _setRoomId(roomId: string) {
    this.id = roomId
    this.socketListener()
  }

  private socketListener() {
    const socket = this.socket
    socket.on(`${this.id}-error`, (e: any) => this.onError.call(e))
    socket.on(`message-${this.id}`, (d: { key: string; data?: any }) => {
      const { key, data } = d
      if (!key) {
        return
      }
      if (key === ServerActions.joinedRoom) {
        this.joined = true
        this.onJoin.call()
      }
      if (key === ServerActions.currentState) {
        const newState = data
        this.stateContainer.set(newState)
        this.state = data
      }
      if (key === ServerActions.statePatch) {
        const newState = jsonpatch.applyPatch({ ...this.state }, data)
          .newDocument
        this.stateContainer.set(newState)
        this.state = newState
      }
    })
  }

  public listen = (
    change: string,
    callback: (dataChange: DataChange) => any
  ) => {
    this.stateContainer.listen(change, callback)
  }
}

export default Room
