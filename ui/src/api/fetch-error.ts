export type ErrorBody = {
    error: string
    status: number
    fields?: Record<string, string[]>
}
export class FetchError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly body: ErrorBody,
        public readonly cause?: Error,
    ) {
        super(message)
    }
}
