class Callback {
  public callbacks: Array<(e?: any, e2?: any) => void> = []

  public add(callback: (e?: any, e2?: any) => void) {
    this.callbacks.push(callback)
  }

  public clear() {
    this.callbacks.splice(0, this.callbacks.length)
  }

  public call(argument?: any, argument2?: any) {
    this.callbacks.forEach(callback => callback(argument, argument2))
  }
}
export default Callback
