
// src/roads/image_network_loader.js
// Build RoadNetwork from assets/generated_network.json (pixel-aligned with carpet)

function lerp(a,b,t){ return a+(b-a)*t; }
function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy); }

export async function buildNetworkFromImageJSON(network, options={}) {
  const url = (options.jsonPath||'assets/generated_network.json');
  const res = await fetch(url);
  if (!res.ok) { console.warn('⚠️ No generated_network.json found at', url); return; }
  const data = await res.json();

  const step = options.sampleStep || 0.03; // шаг по нормализованным координатам (~3% меньшей стороны)

  // Кэш уже созданных узлов по координате (для стыковки)
  const snap = options.snap || 0.01; // радиус склейки узлов
  const nodes = [];
  function getOrCreateNode(p){
    // ищем ближайший существующий узел в радиусе snap
    for (const n of nodes){
      if (Math.abs(n.x-p.x) <= snap && Math.abs(n.y-p.y) <= snap){
        return n;
      }
    }
    const n = network.addNode(p.x, p.y);
    if (n) nodes.push(n);
    return n;
  }

  // Проходим по каждому ребру poly и дискретизируем кривую на отрезки
  for (const e of data.edges){
    const poly = e.poly;
    if (!poly || poly.length<2) continue;
    let prev = {x: poly[0][0], y: poly[0][1]};
    let acc = [prev];
    for (let i=1;i<poly.length;i++){
      const curr = {x: poly[i][0], y: poly[i][1]};
      // разреживаем равномерно
      const segLen = dist(prev,curr);
      const parts = Math.max(1, Math.round(segLen/step));
      for (let k=1;k<=parts;k++){
        const t=k/parts;
        acc.push({x: lerp(prev.x, curr.x, t), y: lerp(prev.y, curr.y, t)});
      }
      prev = curr;
    }
    // Теперь создаем дороги между последовательными точками, слияние узлов по snap
    let lastNode = getOrCreateNode(acc[0]);
    for (let i=1;i<acc.length;i++){
      const nextNode = getOrCreateNode(acc[i]);
      network.addRoad(lastNode, nextNode);
      lastNode = nextNode;
    }
  }

  return network;
}
