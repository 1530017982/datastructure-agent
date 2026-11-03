import { mkdir, readFile, writeFile } from 'node:fs/promises';
import katex from 'katex';
import { Marked } from 'marked';

const escapeHTML = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const chapters = {
  'intro': {
    'abstract-data-type': '抽象数据类型',
    'time-complexity': '时间复杂度',
    'recursive-complexity': '递归复杂度',
    'space-complexity': '空间复杂度',
    'basics': '数据结构的基本概念',
    'algorithm-analysis': '算法的基本概念'
  },
  'linear-list': {
    'linked-list-insert': '单链表后插与按位插入',
    'linked-list-delete': '单链表删除后继与按位删除',
    'circular-linked-list': '2.3.4 循环链表',
    'static-linked-list': '2.3.5 静态链表',
    'linear-1': '2.2 线性表的顺序表示',
    'linear-2': '2.3.1 单链表的定义',
    'linear-3': '2.3.3 双链表',
    'linear-4': '2.3.6 顺序表和链表的比较'
  },
  'stack-queue-array': {
    'stack-expression': '3.3.2 栈在表达式求值中的应用',
    'deque': '3.2.4 双端队列',
    'sparse-matrix': '3.4.4 稀疏矩阵',
    'stack-queue-1': '3.1.2 栈的顺序存储结构',
    'stack-queue-2': '共享栈',
    'stack-queue-3': '3.2.2 队列的顺序存储结构',
    'stack-queue-4': '3.2.3 队列的链式存储结构',
    'stack-queue-5': '3.4 数组和特殊矩阵'
  },
  'string': {
    'string-operations': '4.1.2 串的基本操作',
    'kmp-nextval': '4.2.3 KMP算法的进一步优化',
    'string-1': '4.1 串的定义和实现',
    'string-2': '4.2.1 简单的模式匹配算法',
    'string-3': '4.2.2 串的模式匹配算法——KMP算法'
  },
  'tree': {
    'binary-tree-concepts': '5.2.1 二叉树的定义及其主要特性',
    'binary-tree-traversal': '5.3.1 二叉树的遍历',
    'tree-1': '5.1 树的基本概念',
    'tree-2': '5.2.2 二叉树的存储结构',
    'tree-3': '5.3.2 线索二叉树',
    'tree-4': '5.4 树、森林',
    'tree-6': '5.5.1 哈夫曼树和哈夫曼编码',
    'tree-7': '5.5.2 并查集'
  },
  'graph': {
    'adjacency-matrix': '6.2.1 邻接矩阵法',
    'adjacency-list': '6.2.2 邻接表法',
    'graph-bfs': '6.3.1 广度优先搜索',
    'graph-dfs': '6.3.2 深度优先搜索',
    'dijkstra': 'Dijkstra的确定集合与函数',
    'floyd': 'Floyd的动态规划与函数',
    'dag-expressions': '6.4.3 有向无环图描述表达式',
    'graph-1': '6.1 图的基本概念',
    'graph-2': '6.3 图的遍历',
    'graph-3': '6.4.1 最小生成树',
    'graph-4': '6.4.2 最短路径',
    'graph-5': '6.4.4 拓扑排序',
    'graph-6': '6.4.5 关键路径'
  },
  'search': {
    'binary-search-tree': '7.3.1 二叉排序树（BST）',
    'avl-tree': '7.3.2 平衡二叉树',
    'red-black-tree': '7.3.3 红黑树',
    'b-plus-tree': '7.4.2 B+树的基本概念',
    'search-1': '7.2.1 顺序查找',
    'search-2': '7.2.2 折半查找',
    'search-3': '7.2.3 分块查找',
    'tree-5': '7.3 树形查找',
    'search-4': '7.4 B树和B+树',
    'search-5': '7.5 散列（Hash）表',
    'search-6': 'ASL公式与适用条件速查'
  },
  'sort': {
    'binary-insertion-sort': '8.2.2 折半插入排序',
    'shell-sort': '8.2.3 希尔排序',
    'quick-sort': '8.3.2 快速排序',
    'heap-sort': '8.4.2 堆排序',
    'counting-sort': '8.5.3 计数排序',
    'sort-1': '8.2 插入排序',
    'sort-2': '8.3 交换排序',
    'sort-3': '8.4 选择排序',
    'sort-4': '8.5.1 归并排序',
    'sort-5': '8.5.2 基数排序',
    'sort-6': '8.6 各种内部排序算法的比较及应用',
    'sort-7': '8.7 外部排序'
  }
};

function mathExtension(name, level, pattern) {
  return {
    name,
    level,
    start: source => source.indexOf(level === 'block' ? '$$' : '$'),
    tokenizer(source) {
      const match = pattern.exec(source);
      if (match) return { type: name, raw: match[0], formula: match[1] };
    },
    renderer(token) {
      const displayMode = level === 'block';
      const math = katex.renderToString(token.formula.trim(), {
        output: 'mathml', displayMode, strict: 'ignore', trust: false
      });
      return displayMode ? '<div class="note-formula">' + math + '</div>\n' : math;
    }
  };
}

function renderChapter(markdown, sections) {
  const sectionIds = new Map(Object.entries(sections).map(([id, title]) => [title, id]));
  const foundSections = new Set();
  const parser = new Marked({
    extensions: [
      mathExtension('displayMath', 'block', /^\$\$[ \t]*\n([\s\S]*?)\n\$\$[ \t]*(?:\n|$)/),
      mathExtension('inlineMath', 'inline', /^\$(?!\$|\s)((?:\\.|[^\\$\n])+?)\$(?!\$)/)
    ],
    renderer: {
      heading({ depth, text, tokens }) {
        const id = sectionIds.get(text);
        if (id) {
          if (foundSections.has(id)) throw new Error('笔记标题重复：' + text);
          foundSections.add(id);
        }
        const level = Math.min(depth + 1, 6);
        const anchor = id ? ` id="${id}" tabindex="-1"` : '';
        const heading = `<h${level}${anchor}>${this.parser.parseInline(tokens)}</h${level}>\n`;
        return id === 'search-2'
          ? heading + '<a class="secondary page-link" href="#workbench">进入二分查找工作台 →</a>\n'
          : heading;
      },
      html({ text }) { return escapeHTML(text); },
      link({ href, tokens }) {
        const label = this.parser.parseInline(tokens);
        if (href !== '#catalog' && !/^https?:\/\//i.test(href)) return label;
        return `<a href="${escapeHTML(href)}">${label}</a>`;
      }
    }
  });
  const html = parser.parse(markdown.replace(/\[\[B00-[^\]|]+导航\|[^\]]+\]\]/g, '[返回课程目录](#catalog)'));
  const missing = Object.keys(sections).filter(id => !foundSections.has(id));
  if (missing.length) throw new Error('笔记缺少目录对应的标题：' + missing.join(', '));
  return '<!-- Generated by npm run build:notes -->\n' + html;
}

const target = new URL('../frontend/assets/notes/', import.meta.url);
const rendered = await Promise.all(Object.entries(chapters).map(async ([unit, sections]) => {
  try {
    const source = new URL('../content/notes/' + unit + '.md', import.meta.url);
    return [unit, renderChapter(await readFile(source, 'utf8'), sections)];
  } catch (error) {
    throw new Error('无法构建笔记 ' + unit, { cause: error });
  }
}));
await mkdir(target, { recursive: true });
await Promise.all(rendered.map(([unit, html]) => writeFile(new URL(unit + '.html', target), html)));
