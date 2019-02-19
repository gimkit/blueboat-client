import { DataChange, StateContainer } from '@gamestdio/state-listener'
import jsonpatch from 'fast-json-patch'
import ServerActions from '../lib/constants/ServerActions'
import Callback from './Callback'
import ClientActions from './constants/ClientActions'

class Room<State = any> {
  public id: string
  public joined: boolean = false
  // @ts-ignore
  public state: State = {}

  private socket: SocketIOClient.Socket
  private stateContainer = new StateContainer({})

  public onCreate = new Callback()
  public onJoin = new Callback()
  public onMessage = new Callback()
  public onLeave = new Callback()
  public onError = new Callback()
  public onStateChange = new Callback()

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
        return
      }
      if (key === ServerActions.currentState) {
        const newState = data
        this.stateContainer.set(newState)
        this.state = data
        this.onStateChange.call(data)
        return
      }
      if (key === ServerActions.statePatch) {
        const newState = jsonpatch.applyPatch({ ...this.state }, data)
          .newDocument
        this.stateContainer.set(newState)
        this.state = newState
        this.onStateChange.call(newState)
        return
      }
      if (key === ServerActions.removedFromRoom) {
        this.onLeave.call()
        return
      }
      this.onMessage.call(key, data)
      return
    })
  }

  public send = (message: any) => {
    this.socket.emit(ClientActions.sendMessage, { room: this.id, message })
  }

  public listen = (
    change: string,
    callback: (dataChange: DataChange) => any
  ) => {
    this.stateContainer.listen(change, callback)
  }
}

export default Room
