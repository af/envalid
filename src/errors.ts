export class EnvError extends TypeError {
  constructor(message?: string) {
    super(message)
    Error.captureStackTrace(this, EnvError)
    this.name = 'EnvError'
  }
}

export class EnvMissingError extends ReferenceError {
  constructor(message?: string) {
    super(message)
    Error.captureStackTrace(this, EnvMissingError)
    this.name = 'EnvMissingError'
  }
}
