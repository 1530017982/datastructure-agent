export class DSU {
  constructor(elements) {
    this.parent = new Map(elements.map(e => [e, e]));
    this.rank = new Map(elements.map(e => [e, 0]));
    this.setCount = elements.length;
  }

  find(x) {
    if (this.parent.get(x) === x) return x;
    const root = this.find(this.parent.get(x));
    this.parent.set(x, root);
    return root;
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return false;

    // 真实的按秩合并逻辑
    const rankX = this.rank.get(rootX);
    const rankY = this.rank.get(rootY);
    
    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1); // 秩相等时，合并后根节点秩+1
    }
    this.setCount--;
    return true;
  }

  // 提供给快照使用的状态数据
  getState() {
    return { 
      parent: Object.fromEntries(this.parent), 
      rank: Object.fromEntries(this.rank),
      setCount: this.setCount 
    };
  }
}