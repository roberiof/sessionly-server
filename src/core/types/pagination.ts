export type PaginatedResult<T> = {
  data: T[];
  total: number;
  take: number;
  skip: number;
};

export type PaginationParams = {
  take?: number;
  skip?: number;
};
