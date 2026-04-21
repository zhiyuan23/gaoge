import type { Pagination } from '@gaoge/shared-types';

export function createPaginationSchema(input: Pagination) {
  return {
    page: Math.max(1, input.page),
    pageSize: Math.max(1, input.pageSize),
    total: Math.max(0, input.total),
  };
}
