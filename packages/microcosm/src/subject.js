// @flow

import { Observable, Observer, getObservable } from './observable'
import { observable } from './symbols'
import { noop, EMPTY_SUBSCRIPTION } from './empty'
import { set, merge } from './data'

export class Subject {
  meta: { tag: *, status: string, origin: Microcosm }
  payload: *
  disabled: boolean
  _observers: Set<*>
  _observable: Observable

  constructor(payload?: *, meta?: *) {
    this.meta = merge({ tag: null, status: 'start' }, meta)
    this.payload = payload
    this.disabled = false

    this._observers = new Set()

    this._observable = new Observable(observer => {
      this._observers.add(observer)
      return () => this._observers.delete(observer)
    })
  }

  get status(): string {
    return this.meta.status
  }

  get completed(): boolean {
    return this.status === 'complete'
  }

  get cancelled(): boolean {
    return this.status === 'cancel'
  }

  get closed(): boolean {
    return this.errored || this.completed || this.cancelled
  }

  get errored(): boolean {
    return this.status === 'error'
  }

  get next(): * {
    if (this.closed) {
      return noop
    }

    return value => {
      this.meta.status = 'next'

      if (value != null) {
        this.payload = value
      }

      this._observers.forEach(observer => observer.next(value))
    }
  }

  get complete(): * {
    return value => {
      this.meta.status = 'complete'

      if (value != null) {
        this.payload = value
      }

      this._observers.forEach(observer => observer.complete())
    }
  }

  get error(): * {
    return error => {
      this.payload = error
      this.meta.status = 'error'

      this._observers.forEach(observer => observer.error(error))
    }
  }

  get cancel(): * {
    return reason => {
      this.payload = reason
      this.meta.status = 'cancel'

      this._observers.forEach(observer => observer.cancel(reason))
    }
  }

  subscribe(next: *) {
    let observer = new Observer(...arguments)

    if (this.closed) {
      if (this.completed) {
        observer.next(this.payload)
      }

      // $FlowFixMe - Dynamic keys
      observer[this.status](this.payload)
    } else {
      return new Observable(observer => {
        if (this.meta.status === 'next') {
          observer.next(this.payload)
        }

        return this._observable.subscribe(observer)
      }).subscribe(observer)
    }

    return EMPTY_SUBSCRIPTION
  }

  then(pass: *, fail: *): Promise<*> {
    return new Promise((resolve, reject) => {
      this.subscribe({
        complete: () => resolve(this.payload),
        error: () => reject(this.payload),
        cancel: () => resolve(this.payload)
      })
    }).then(pass, fail)
  }

  // $FlowFixMe - Flow doesn't understand computed keys :-/
  [observable]() {
    return this
  }

  toString(): string {
    return this.meta.tag || 'Subject'
  }

  toJSON(): Object {
    return {
      payload: this.payload,
      status: this.meta.status,
      tag: this.toString()
    }
  }

  static hash(obj: *): Subject {
    if (getObservable(obj)) {
      return obj
    }

    let subject = new Subject()

    if (obj == null || typeof obj !== 'object') {
      subject.next(obj)
      subject.complete()
      return subject
    }

    if (typeof obj.then === 'function') {
      subject.subscribe(Observable.fromPromise(obj).subscribe(subject))
      return subject
    }

    let keys = Object.keys(obj)
    let payload = Array.isArray(obj) ? [] : {}
    let jobs = keys.length

    subject.next(payload)

    function complete() {
      if (--jobs <= 0) {
        subject.complete()
      }
    }

    function assign(key: string, value: *): void {
      // $FlowFixMe - Signature of set() is too strict
      payload = set(payload, key, value)

      if (payload !== subject.payload) {
        subject.next(payload)
      }
    }

    for (var i = 0, len = keys.length; i < len; i++) {
      let key = keys[i]

      let subscription = Observable.wrap(obj[key]).subscribe({
        next: value => assign(key, value),
        complete: complete,
        error: subject.error
      })

      subject.subscribe(subscription)
    }

    return subject
  }
}