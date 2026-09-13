export class EventBus {
  constructor() {
    this._map = new Map();
  }
  on(event, fn) {
    if (!this._map.has(event)) this._map.set(event, new Set());
    this._map.get(event).add(fn);
    return () => this.off(event, fn);
  }
  off(event, fn) {
    const set = this._map.get(event);
    if (set) set.delete(fn);
  }
  emit(event, payload) {
    const set = this._map.get(event);
    if (!set) return;
    for (const fn of [...set]) fn(payload);
  }
}
