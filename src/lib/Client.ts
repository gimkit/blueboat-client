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
  public onReconnect = new Callback()
  public onReconnectAttempt = new Callback()

  public latency: number = 0

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
      },
      reconnectionDelay: 500,
      reconnectionDelayMax: 1500,
      randomizationFactor: 0
    })

    this.socket.on('connect_error', (e: any) => this.onConnectError.call(e))
    this.socket.on('error', (e: any) => this.onConnectError.call(e))
    this.socket.on(ServerActions.clientIdSet, (id: string) => {
      if (localStorage && this.useClientIdSaving) {
        localStorage.setItem(BLUEBOAT_ID, id)
      }
      this.id = id
      this.sessionId = this.socket.id
      if (this.rooms.length) {
        this.rooms.forEach(room => this.joinRoom(room.id, {}, room))
      }
      this.onConnect.call()
    })
    this.socket.on('pong', (latency: number) => {
      this.latency = latency
    })
    this.socket.on('reconnect', (attempt: number) =>
      this.onReconnect.call(attempt)
    )
    this.socket.on('reconnect_attempt', (attempt: number) => {
      this.onReconnectAttempt.call(attempt)
    })
    this.socket.on('disconnect', (reason: string) => {
      this.onDisconnect.call(reason)
      this.rooms.forEach(room => {
        room.joined = false
        room.onLeave.call(reason)
      })
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
    if (!room.joined) {
      this.socket.emit(ClientActions.joinRoom, { roomId, options })
    }
    if (!this.rooms.some(r => r.id === roomId)) {
      this.rooms.push(room)
    }
    return room
  }

  public disconnect = () => {
    this.socket.disconnect()
  }

  public connect = () => {
    this.socket.connect()
  }
}

export default Client
