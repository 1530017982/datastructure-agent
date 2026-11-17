export function createLevelOrderForm({message,onChange}) {
  const byId=id=>document.getElementById(id);
  const input=byId('tree-nodes'), root=byId('tree-root'), list=byId('tree-children');
  let active=false, second=false, collapsed=false;
  let nodes=[];
  function options(select,value) {
    select.replaceChildren(new Option('空',''),...nodes.map(id=>new Option(id,id)));
    if(value && !nodes.includes(value)) select.add(new Option('已删除：'+value,value));
    select.value=value;
    select.setAttribute('aria-invalid',String(Boolean(value && !nodes.includes(value))));
  }
  function update() {
    byId('tree-fields').hidden=!active||collapsed;
    byId('tree-summary').hidden=!active||!collapsed;
    byId('tree-node-step').hidden=second;
    byId('tree-child-step').hidden=!second;
    if(active) {
      byId('fillDemo').parentElement.hidden=collapsed;
      byId('startBtn').hidden=collapsed||!second;
      byId('bfs-next').hidden=true; byId('bfs-back').hidden=true;
    }
  }
  function count() {
    byId('tree-count').textContent='共 '+input.value.trim().split(/[,，\s]+/).filter(Boolean).length+' 个节点（最多 64 个，留空表示空树）';
  }
  function next() {
    const ids=input.value.trim().split(/[,，\s]+/).filter(Boolean);
    if(ids.length>64 || new Set(ids).size!==ids.length) {message('最多 64 个节点，名称不能重复。',true);return;}
    const previous=new Map(Array.from(list.children,row=>[row.dataset.node,Array.from(row.querySelectorAll('select'),select=>select.value)]));
    nodes=ids;
    options(root,nodes.length ? root.value || nodes[0] : '');
    list.replaceChildren();
    for(const id of nodes) {
      const row=document.createElement('div');
      row.className='tree-child-row'; row.dataset.node=id;
      const name=document.createElement('strong'); name.textContent=id; row.append(name);
      ['左孩子','右孩子'].forEach((side,index)=>{
        const label=document.createElement('label');
        const select=document.createElement('select');
        select.setAttribute('aria-label',id+' 的'+side);
        options(select,previous.get(id)?.[index] ?? '');
        label.append(side,select); row.append(label);
      });
      list.append(row);
    }
    second=true; update(); message(''); root.focus();
  }
  byId('tree-next').addEventListener('click',next);
  byId('tree-back').addEventListener('click',()=>{second=false;update();message('');input.focus();});
  byId('tree-edit').addEventListener('click',()=>{collapsed=false;update();message('');root.focus();});
  input.addEventListener('input',()=>{count();onChange();});
  byId('tree-child-step').addEventListener('change',event=>{
    event.target.setAttribute('aria-invalid',String(Boolean(event.target.value&&!nodes.includes(event.target.value))));
    onChange();
  });
  return {
    setActive(value){active=value;collapsed=false;update();},
    fillDemo(){
      input.value='A, B, C, D'; list.replaceChildren(); root.value='';
      count();next();
      const children=[['B','C'],['','D'],['',''],['','']];
      Array.from(list.children).forEach((row,index)=>Array.from(row.querySelectorAll('select')).forEach((select,side)=>select.value=children[index][side]));
      second=false;collapsed=false;update();
    },
    read(){
      if(collapsed)return null;
      if(!second){next();return null;}
      const value={root:root.value||null,nodes:Array.from(list.children,row=>{
        const [left,right]=row.querySelectorAll('select');
        return {id:row.dataset.node,left:left.value||null,right:right.value||null};
      })};
      if(nodes.length && !nodes.includes(value.root))throw new Error('请选择有效根节点。');
      for(const node of value.nodes) if([node.left,node.right].some(id=>id!==null&&!nodes.includes(id)))throw new Error('孩子引用了已删除的节点，请修改。');
      return value;
    },
    summarize(value){
      byId('tree-summary-text').textContent=value.nodes.length+' 个节点 · 根节点 '+(value.root??'空');
      collapsed=true;update();byId('tree-edit').focus();
    }
  };
}
