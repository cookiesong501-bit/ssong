const Holidays=require('date-holidays');
const calendar=new Holidays('KR',{languages:'ko'});
const special={'2024-10-01':'임시공휴일','2025-01-27':'임시공휴일','2025-06-03':'대통령 선거일','2026-06-03':'전국동시지방선거일'};
function holidays(year){
 if(!Number.isInteger(year)||year<1900||year>2100)throw Error('연도는 1900~2100 사이로 선택해 주세요.');
 const result={};
 for(const item of calendar.getHolidays(year)){
  if(item.type!=='public')continue;
  const start=new Date(item.date.slice(0,10)+'T00:00:00Z');
  // date-holidays anchors Seollal's 3-day span on new year's day;
  // Korean law observes the preceding day, the day itself and the next day.
  if(item.rule==='korean 01-0-01 P3D')start.setUTCDate(start.getUTCDate()-1);
  const days=Math.round((item.end-item.start)/86400000);
  for(let i=0;i<days;i++){const date=new Date(start);date.setUTCDate(start.getUTCDate()+i);result[date.toISOString().slice(0,10)]=item.name;}
 }
 for(const [date,name] of Object.entries(special))if(date.startsWith(year+'-'))result[date]=name;
 return result;
}
module.exports=holidays;
