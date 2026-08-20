import {NextRequest,NextResponse} from 'next/server';import {requireUser} from '@/lib/user-auth';import {reserveCredits,commitCredits,wallet} from '@/lib/billing/credits';import {BUILD_CREDIT_COST} from '@/lib/billing/config';
export const dynamic='force-dynamic';
// Charges the flat cost of a first full build once, before build() starts —
// reserve and commit happen back-to-back because the charge is unconditional
// on attempt, not tied to the AI work's success (the same risk posture
// image/generate/route.ts already accepts: a persistence failure there
// doesn't roll back credits either). Insufficient balance throws the same
// 402/insufficient_credits shape image generation already uses, so the
// client's existing why() error mapping needs no changes to read it.
export async function POST(req:NextRequest){
  try{
    const user=await requireUser(req);
    const body=await req.json().catch(()=>({}));
    const projectId=String(body?.projectId||'').trim();
    if(!projectId)return NextResponse.json({error:'projectId is required'},{status:400});
    const attemptId=String(body?.buildAttemptId||'').trim()||`${projectId}:${Date.now()}`;
    const reservationKey=`build:${user.workspaceId}:${attemptId}`;
    const reservation=await reserveCredits({session:user,units:BUILD_CREDIT_COST,reason:'Website build',reservationKey,metadata:{projectId}});
    await commitCredits(user.workspaceId,reservation.id,{projectId});
    const w=await wallet(user);
    return NextResponse.json({ok:true,cost:BUILD_CREDIT_COST,wallet:{available:Number(w.available),reserved:Number(w.reserved),lifetimePurchased:Number(w.lifetime_granted),lifetimeUsed:Number(w.lifetime_used)}},{headers:{'Cache-Control':'no-store'}});
  }catch(e:any){
    return NextResponse.json({error:e?.message||'Could not charge for build',code:e?.code||'build_charge_error'},{status:e?.status||500,headers:{'Cache-Control':'no-store'}});
  }
}
