import { DataChange } from '@gamestdio/state-listener'

class StateCallback {
  public listeners = [] as Array<{ change: string; callback: any }>

  public listen = (change: string, callback: any) => {
    this.listeners.push({ change, callback })
  }

  public call = (change: string, dataChange: DataChange) => {
    this.listeners
      .filter(listener => listener.change === change)
      .forEach(listener => listener.callback(dataChange))
  }
}

export default StateCallback
