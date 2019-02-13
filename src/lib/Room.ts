import ServerActions from '../lib/constants/ServerActions'
import Callback from './Callback'

class Room {
  public id: string
  public joined: boolean = false

  private socket: SocketIOClient.Socket

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
      const { key } = d
      if (!key) {
        return
      }
      if (key === ServerActions.joinedRoom) {
        this.joined = true
        this.onJoin.call()
      }
    })
  }
}

export default Room
