// Each bit identifies one particular star, so repeat visits cannot inflate progress.
export function readStarRecords(raw,count){
 let data;try{data=JSON.parse(raw||'[]');}catch{data=[];}
 return Array.from({length:count},(_,i)=>Array.isArray(data)&&Number.isInteger(data[i])&&data[i]>=0&&data[i]<=7?data[i]:0);
}
export function recordStar(records,world,id){
 const next=[...records];if(Number.isInteger(world)&&world>=0&&world<next.length&&Number.isInteger(id)&&id>=0&&id<3)next[world]|=1<<id;return next;
}
export const countStars=records=>records.reduce((n,mask)=>n+[0,1,2].filter(i=>mask&(1<<i)).length,0);
export const availableLooks=records=>countStars(records)>=18?['orange','mint','gold']:countStars(records)>=3?['orange','mint']:['orange'];
