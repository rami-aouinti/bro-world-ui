import type { ListQueryParams, QueryParams } from '~/types/api/common'

const cleanQuery = (query: QueryParams): QueryParams => {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

export const buildListQuery = (
  query: ListQueryParams = {},
  extraQuery: QueryParams = {},
): QueryParams => {
  const { pageSize, ...rest } = query

  return cleanQuery({
    ...rest,
    page_size: pageSize,
    ...extraQuery,
  })
}
