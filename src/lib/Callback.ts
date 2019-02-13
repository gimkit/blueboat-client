class Callback {
  public callbacks: Array<(e: any) => void> = []

  public add(callback: (e: any) => void) {
    this.callbacks.push(callback)
  }

  public clear() {
    this.callbacks.splice(0, this.callbacks.length)
  }

  public call(argument?: any) {
    this.callbacks.forEach(callback => callback(argument))
  }
}
export default Callback
