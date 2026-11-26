const {valid}=require('../../lib/smoke-booking-bridge.cjs');
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
  if(!valid(req.body,req.headers))return res.status(401).json({error:'Invalid integration signature.'});
  const body=req.body||{};
  const base=String(process.env.SUPABASE_URL||'').replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!base||!key)return res.status(503).json({error:'Booking status database is not configured.'});
  if(body.action==='pending'){
    try{
      const response=await fetch(base+'/rest/v1/calculator_leads?select=*&booking_sync_pending=eq.true&accepted_at=not.is.null&status=eq.accepted&order=accepted_at.asc&limit=5',{headers:{apikey:key,Authorization:'Bearer '+key},cache:'no-store'});
      if(!response.ok)throw new Error('Pending lookup failed.');
      return res.status(200).json({leads:await response.json()});
    }catch{return res.status(502).json({error:'Pending bookings could not be loaded.'});}
  }
  const token=String(body.quote_token||'');
  if(!/^[a-zA-Z0-9-]{8,80}$/.test(token))return res.status(400).json({error:'Invalid quote token.'});
  const updates={};
  for(const key of ['dataforce_job_id','dataforce_appointment_id']){
    if(body[key]!=null){if(!Number.isSafeInteger(Number(body[key]))||Number(body[key])<1)return res.status(400).json({error:'Invalid job identifier.'});updates[key]=Number(body[key]);}
  }
  if(body.ghl_accepted_at&&Number.isFinite(Date.parse(body.ghl_accepted_at)))updates.ghl_accepted_at=body.ghl_accepted_at;
  if(body.booking_fee_paid_at){
    if(Number(body.booking_fee_amount)!==33||!Number.isFinite(Date.parse(body.booking_fee_paid_at)))return res.status(400).json({error:'Invalid booking payment.'});
    updates.booking_fee_paid_at=body.booking_fee_paid_at;
    updates.booking_fee_amount=33;
    updates.stripe_checkout_session_id=String(body.stripe_checkout_session_id||'');
    updates.stripe_payment_intent_id=body.stripe_payment_intent_id?String(body.stripe_payment_intent_id):null;
  }

  if(updates.dataforce_job_id&&updates.ghl_accepted_at)updates.booking_sync_pending=false;
  try{
    const response=await fetch(base+'/rest/v1/calculator_leads?quote_token=eq.'+encodeURIComponent(token)+'&accepted_at=not.is.null',{
      method:'PATCH',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation'},
      body:JSON.stringify(updates)
    });
    if(!response.ok)throw new Error('Status update failed.');
    const rows=await response.json();
    if(!rows.length)return res.status(404).json({error:'Accepted quote not found.'});
    return res.status(200).json({success:true});
  }catch(error){return res.status(502).json({error:'Booking status could not be saved.'});}
};
