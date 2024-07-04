export type ErrorBody = {
    error: string
    status: number
    fields?: Record<string, string[]>
}
export class FetchError extends Error {
    constructor(
        message: string,
        public status: number,
        public body: ErrorBody,
    ) {
        super(message)
    }
}
