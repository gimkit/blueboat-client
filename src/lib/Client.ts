import Socket from 'socket.io-client'
import MessagePackParser from 'socket.io-msgpack-parser'
import Callback from './Callback'
import ClientActions from './constants/ClientActions'
import { BLUEBOAT_ID } from './constants/LocalStorage'
import ServerActions from './constants/ServerActions'
import Room from './Room'

class Client {
  private socket: SocketIOClient.Socket

  public id: string
  public sessionId: string

  public onConnect = new Callback()
  public onConnectError = new Callback()
  public onDisconnect = new Callback()

  constructor(connectString: string) {
    this.socket = Socket(connectString, {
      path: '/blueboat',
      // @ts-ignore
      parser: MessagePackParser,
      transports: ['websocket'],
      query: {
        id: localStorage.getItem(BLUEBOAT_ID) || ''
      }
    })
    this.socket.on('error', (e: any) => this.onConnectError.call(e))
    this.socket.on('disconnect', () => this.onDisconnect.call())
    this.socket.on(ServerActions.clientIdSet, (id: string) => {
      localStorage.setItem(BLUEBOAT_ID, id)
      this.id = id
      this.sessionId = this.socket.id
      this.onConnect.call()
    })
  }

  public createRoom(roomName: string, options?: any) {
    const uniqueRequestId = Math.random().toString()
    this.socket.emit(ClientActions.createNewRoom, {
      type: roomName,
      options,
      uniqueRequestId
    })
    const room = new Room(this.socket)
    this.socket.on(`${uniqueRequestId}-create`, (roomId: string) => {
      room._setRoomId(roomId)
      room.onCreate.call(roomId)
      this.joinRoom(roomId, options, room)
    })
    this.socket.on(`${uniqueRequestId}-error`, (error: any) => {
      room.onError.call(error)
    })
    return room
  }

  public joinRoom(roomId: string, options?: any, existingRoom?: Room) {
    const room = existingRoom || new Room(this.socket, roomId)
    this.socket.emit(ClientActions.joinRoom, { roomId, options })
    return room
  }
}

export default Client
