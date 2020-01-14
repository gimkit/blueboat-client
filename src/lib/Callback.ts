interface Call {
  callback: (e?: any, e2?: any) => void
  timesCalled: number
  canCallMultipleTimes: boolean
}

class Callback {
  public callbacks: Call[] = []

  public add(callback: (e?: any, e2?: any) => void, onlyCallOnce?: boolean) {
    this.callbacks.push({
      callback,
      timesCalled: 0,
      canCallMultipleTimes: !onlyCallOnce
    })
  }

  public clear() {
    this.callbacks.splice(0, this.callbacks.length)
  }

  public call(argument?: any, argument2?: any) {
    this.callbacks = this.callbacks.map(callback => {
      if (callback.timesCalled > 0) {
        if (!callback.canCallMultipleTimes) {
          return callback
        }
      }
      callback.callback(argument, argument2)
      return {
        ...callback,
        timesCalled: callback.timesCalled + 1
      }
    })
  }
}
export default Callback
