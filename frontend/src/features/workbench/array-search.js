export const arraySearchMaxElements = 100;
const searches = {
  'linear-search': { title: '顺序查找', file: 'linear_search.cpp', example: '5, 1, 7, 3, 7',
    help: '最多 100 个安全整数，用逗号分隔。允许无序、重复和空数组。' },
  'block-search': { title: '分块查找', file: 'block_search.cpp', example: '3, 1, 5; 9, 7, 11; 16, 13',
    help: '用分号分块、逗号分隔块内元素，共最多 100 个安全整数。块内可无序，前一非空块的最大值不能大于后一非空块的最小值。' }
};

export function arraySearch(id) {
  return Object.hasOwn(searches, id) ? searches[id] : null;
}
