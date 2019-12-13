import Socket from 'socket.io-client'
import MessagePackParser from 'socket.io-msgpack-parser'
import Callback from './Callback'
import ClientActions from './constants/ClientActions'
import { BLUEBOAT_ID } from './constants/LocalStorage'
import ServerActions from './constants/ServerActions'
import Room from './Room'

class Client {
  private socket: SocketIOClient.Socket
  private rooms: Room[] = []

  public id: string
  public sessionId: string

  public onConnect = new Callback()
  public onConnectError = new Callback()
  public onDisconnect = new Callback()

  private useClientIdSaving = true

  constructor(
    connectString: string,
    options?: { blockClientIdSaving?: boolean }
  ) {
    if (options && options.blockClientIdSaving) {
      this.useClientIdSaving = false
    }

    this.socket = Socket(connectString, {
      path: '/blueboat',
      // @ts-ignore,
      parser: MessagePackParser,
      transports: ['websocket'],
      query: {
        id:
          localStorage && this.useClientIdSaving
            ? localStorage.getItem(BLUEBOAT_ID) || ''
            : ''
      }
    })

    this.socket.on('reconnect_attempt', () => {
      this.socket.io.opts.transports = ['polling', 'websocket']
    })

    this.socket.on('connect_error', (e: any) => this.onConnectError.call(e))
    this.socket.on('error', (e: any) => this.onConnectError.call(e))
    this.socket.on(ServerActions.clientIdSet, (id: string) => {
      if (localStorage && this.useClientIdSaving) {
        localStorage.setItem(BLUEBOAT_ID, id)
      }
      this.id = id
      this.sessionId = this.socket.id
      this.onConnect.call()
    })
    this.socket.on('disconnect', () => {
      this.onDisconnect.call()
      this.rooms.forEach(room => room.onLeave.call())
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
    this.rooms.push(room)
    return room
  }
}

export default Client
