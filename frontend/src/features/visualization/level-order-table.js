function table(title,columns,rows){
  const element=document.createElement('table');element.className='uf-table';
  element.createCaption().textContent=title;
  const head=element.createTHead().insertRow();
  for(const name of columns){const th=document.createElement('th');th.scope='col';th.textContent=name;head.append(th);}
  const body=element.createTBody();
  for(const values of rows){const row=body.insertRow();for(const value of values)row.insertCell().textContent=value??'空';}
  return element;
}
export function createLevelOrderTable(){
  const element=document.createElement('div');element.className='level-order-tables';
  return {element,showStep(step){
    const v=step.variables;
    const nodes=table('节点关系 · 根节点 '+(v.root??'空'),['节点','左孩子','右孩子','访问状态'],
      v.nodes.map(node=>[node.id,node.left,node.right,v.order.includes(node.id)?'已访问':'未访问']));
    for(const row of nodes.tBodies[0].rows)row.dataset.current=String(row.cells[0].textContent===v.currentNode);
    element.replaceChildren(nodes,
      table('队列（队首在上，队尾在下）',['节点','层号'],v.queue.map(entry=>[entry.id,entry.level])),
      table('分层访问结果',['层号','访问顺序'],v.levels.map((ids,index)=>[index+1,ids.join(' → ')])));
  }};
}
