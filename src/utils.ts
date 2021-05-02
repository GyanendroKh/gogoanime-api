export const getIdFromPath = (path: string): string => {
  return path.split('/').pop() ?? '';
};
