import { DataChange } from '@gamestdio/state-listener'
import ServerActions from '../lib/constants/ServerActions'
import Callback from './Callback'
import ClientActions from './constants/ClientActions'
import StateCallback from './StateCallback'

class Room {
  public id: string
  public joined: boolean = false

  private socket: SocketIOClient.Socket
  private stateCallback = new StateCallback()

  public onCreate = new Callback()
  public onJoin = new Callback()
  public onMessage = new Callback()
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
        return
      }

      if (key === ServerActions.statePatch) {
        this.stateCallback.call(data.change, data.patch)
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

  public send = (key: string, data?: any) => {
    this.socket.emit(ClientActions.sendMessage, { room: this.id, key, data })
  }

  public listen = (
    change: string,
    callback: (dataChange: DataChange) => any
  ) => {
    this.send(ClientActions.listen, change)
    this.stateCallback.listen(change, callback)
  }
}

export default Room
