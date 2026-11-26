const crypto=require('node:crypto');
function signature(body,timestamp){
  const secret=process.env.SMOKE_CALCULATOR_BRIDGE_SECRET;
  if(!secret)throw new Error('Booking integration is not configured.');
  return crypto.createHmac('sha256',secret).update('calculator-bridge:v1:'+timestamp+'.'+JSON.stringify(body)).digest('hex');
}
function valid(body,headers,now=Date.now()){
  const stamp=String(headers['x-goldsure-timestamp']||'');
  if(!/^\d+$/.test(stamp)||Math.abs(now-Number(stamp))>300000)return false;
  try{const a=Buffer.from(String(headers['x-goldsure-signature']||'')),b=Buffer.from(signature(body,stamp));return a.length===b.length&&crypto.timingSafeEqual(a,b);}catch{return false;}
}
async function syncAcceptedLead(lead){
  const body={lead},timestamp=String(Date.now());
  const response=await fetch('https://portal.goldsure.com.au/api/smoke-alarms/calculator-accept',{
    method:'POST',headers:{'Content-Type':'application/json','x-goldsure-timestamp':timestamp,'x-goldsure-signature':signature(body,timestamp)},
    body:JSON.stringify(body),signal:AbortSignal.timeout(50000)
  });
  if(!response.ok)throw new Error('Booking integration failed ('+response.status+').');
  return response.json();
}
module.exports={signature,valid,syncAcceptedLead};
