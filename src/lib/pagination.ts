export interface PageParams {
  page: number;
  perPage: number;
  skip: number;
  take: number;
}

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

/**
 * Parsea page/perPage de la query string con valores por defecto seguros.
 * Devuelve además skip/take listos para Prisma.
 */
export function parsePagination(query: Record<string, unknown>): PageParams {
  const page = Math.max(1, toInt(query.page, 1));
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, toInt(query.perPage, DEFAULT_PER_PAGE)));

  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

function toInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) ? n : fallback;
}
