export function quotePostUrl(routes, auth) {
    return auth?.buyer ? routes.buyerJobPost : routes.postJob;
}
