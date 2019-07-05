export type Request = {
  query: any,
  body: any
}

export type Response = {
  send: (code: any, data: any, headers: {}) => void
}

export type NextFunc = (req: Request, res: Request, next?: NextFunc) => void
