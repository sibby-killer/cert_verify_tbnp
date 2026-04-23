/**
 * Pagination utility — parses query params and builds standard response shape.
 *
 * All list endpoints support:
 *   ?page=1       default 1
 *   ?limit=20     default 20, max 100
 *   ?search=      LIKE search string
 *   ?sort=field   column name (validated per-route)
 *   ?order=desc   asc | desc
 */

/**
 * Parse and sanitize pagination/search/sort query params.
 * @param {object} query - req.query
 * @param {string[]} [sortableFields] - whitelist of allowed sort column names
 * @param {string} [defaultSort] - default sort field
 * @returns {{ page, limit, offset, search, sort, order }}
 */
export function parsePagination(query, sortableFields = [], defaultSort = 'createdAt') {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 100) : '';
  const order = query.order === 'asc' ? 'asc' : 'desc';
  const sort =
    sortableFields.length === 0 || sortableFields.includes(query.sort)
      ? (query.sort || defaultSort)
      : defaultSort;

  return { page, limit, offset, search, sort, order };
}

/**
 * Build a paginated response envelope.
 * @param {any[]} data - current page rows
 * @param {number} total - total row count (from COUNT(*) query)
 * @param {number} page
 * @param {number} limit
 * @returns {{ data, pagination }}
 */
export function buildPaginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}
