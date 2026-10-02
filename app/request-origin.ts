/** Reject cross-site cookie-authenticated mutations, including sibling subdomains. */
export function invalidMutationOrigin(request:Request){return request.headers.get('origin')!==new URL(request.url).origin;}
