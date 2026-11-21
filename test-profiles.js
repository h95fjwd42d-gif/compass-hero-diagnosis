const assert=require('node:assert/strict');const fs=require('fs');
const p=JSON.parse(fs.readFileSync(__dirname+'/profiles.json','utf8'));const heroes=JSON.parse(fs.readFileSync(__dirname+'/heroes.json','utf8'));
assert.equal(heroes.length,51);assert.equal(Object.keys(p).length,51);
const seen=new Set();for(const h of heroes){const v=p[h.id];assert.equal(v.length,20);assert(v.every(x=>x===0||x===1));assert(!seen.has(v.join('')));seen.add(v.join(''));const scored=heroes.map(other=>({id:other.id,score:p[other.id].filter((b,i)=>b===v[i]).length})).sort((a,b)=>b.score-a.score);assert.equal(scored[0].id,h.id);assert.equal(scored[0].score,20);}
console.log('PASS: 51/51 unique profiles; all 51 have a first-place answer pattern (20/20).');
