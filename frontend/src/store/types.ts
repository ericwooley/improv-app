export interface PaginationMetadata {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface APIResponse<T> {
  success: boolean
  data: T
  pagination?: PaginationMetadata
}
