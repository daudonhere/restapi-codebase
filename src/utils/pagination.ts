export const getPagination = ( pageQuery?: string | number, limitQuery?: string | number, totalData?: number) => {
  const page = Math.max(parseInt(pageQuery as string) || 1, 1);
  const limit = Math.max(parseInt(limitQuery as string) || 10, 1);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const buildMeta = (
  page: number,
  limit: number,
  totalData: number
) => {
  const totalPages = Math.ceil(totalData / limit);

  return {
    page,
    limit,
    totalData,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
