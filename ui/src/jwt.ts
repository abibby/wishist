export interface Headers {
    typ: string
    alg: string
}

export interface Claims {
    username: string
    iss?: string | number // Issuer Claim
    sub: number // Subject Claim
    aud?: string | number // Audience Claim
    exp?: number // Expiration Time Claim
    nbf?: number // Not Before Claim
    iat?: number // Issued At Claim
    jti?: string | number // JWT ID Claim
}

export interface JWT {
    claims: Claims
    headers: Headers
}

export default {
    parse(token: string): JWT {
        const [headers, claims] = token.split('.')
        if (headers === undefined || claims === undefined) {
            throw new Error('invalid JWT')
        }
        return {
            claims: JSON.parse(atob(claims)),
            headers: JSON.parse(atob(headers)),
        }
    },
}
