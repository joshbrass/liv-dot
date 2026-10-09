/** Lifecycle of a single async request. Only the error variant carries a message. */
export type RequestState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export const IDLE_REQUEST: RequestState = { status: 'idle' }
