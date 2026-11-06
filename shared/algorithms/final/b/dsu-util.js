export class DSU {
  constructor(elements) {
    this.parent = new Map();
    this.rank = new Map();
    this.setCount = 0;
    for (const e of elements) {
      if (this.parent.has(e)) throw new Error(`【并查集】元素 ${e} 存在重复。`);
      this.parent.set(e, e);
      this.rank.set(e, 0);
      this.setCount++;
    }
  }
  find(x) {
    if (!this.parent.has(x)) throw new Error(`未知元素 ${x}`);
    if (this.parent.get(x) === x) return x;
    const root = this.find(this.parent.get(x));
    this.parent.set(x, root);
    return root;
  }
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return false;
    const rankX = this.rank.get(rootX);
    const rankY = this.rank.get(rootY);
    if (rankX < rankY) this.parent.set(rootX, rootY);
    else if (rankX > rankY) this.parent.set(rootY, rootX);
    else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
    this.setCount--;
    return true;
  }
  getState() {
    // 修复：使用 Object.create(null) 让 __proto__ 可以作为普通 key 存在
    const parentObj = Object.create(null);
    for (const [k, v] of this.parent.entries()) parentObj[k] = v;
    const rankObj = Object.create(null);
    for (const [k, v] of this.rank.entries()) rankObj[k] = v;
    return { parent: parentObj, rank: rankObj, setCount: this.setCount };
  }
}