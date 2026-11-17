const hashBase = { field: 'keys', label: '按顺序插入的键', example: '10, 17, 24', singleTarget: true, targetExample: '24', param: 'capacity', paramLabel: '表容量', min: 1, max: 1024, default: 7 };
const treeBase = { field: 'keys', label: '按顺序插入的键', tree: true, singleTarget: true };
const configs = {
  'hash-linear-probing': { ...hashBase, title: '哈希线性探测', help: '最多 64 个键，容量 1～1024。冲突时依次后移一个槽位，可选查询一个键。', fields: [['key','当前键'],['hash','初始哈希槽'],['slot','当前槽'],['probes','探测次数']] },
  'hash-quadratic-probing': { ...hashBase, title: '哈希平方探测', min: 3, prime: true, help: '最多 64 个键，容量须为 3～1024 的奇素数。偏移按 i² 增长，探测耗尽时可能仍有空槽。', fields: [['key','当前键'],['hash','初始哈希槽'],['slot','当前槽'],['probes','探测次数']] },
  'hash-double-hashing': { ...hashBase, title: '哈希双散列', min: 2, prime: true, help: '最多 64 个键，容量须为 2～1024 的素数。h1 确定初始槽，h2 决定步长。', fields: [['key','当前键'],['h1','初始槽 h1'],['h2','步长 h2'],['slot','当前槽']] },
  'hash-chaining': { ...hashBase, title: '哈希拉链法', param: 'bucketCount', paramLabel: '桶数量', help: '最多 64 个键，1～1024 个桶。冲突的键追加到同一条链上，重复键忽略。', fields: [['key','当前键'],['bucketIndex','当前桶'],['position','链内下标'],['compared','比较次数']] },
  'avl-tree': { ...treeBase, title: 'AVL 树', example: '30, 20, 10', targetExample: '10', help: '最多 64 个键，按输入顺序建树，重复键忽略。第二步可查询一个键。', fields: [['key','当前键'],['unbalancedAt','失衡节点'],['rotation','旋转类型'],['path','访问路径']] },
  'red-black-tree': { ...treeBase, title: '红黑树', example: '10, 20, 30, 15', targetExample: '15', help: '最多 64 个键，按输入顺序建树，重复键忽略。第二步可查询一个键。', fields: [['key','当前键'],['z','当前修复节点'],['fixupCase','修复情形'],['path','访问路径']] }
};
export function dAlgorithm(id) { return Object.hasOwn(configs,id) ? configs[id] : null; }
export const dAlgorithmIds=Object.keys(configs);
