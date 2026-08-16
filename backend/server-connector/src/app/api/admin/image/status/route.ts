import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { imageRoute, imageLimits } from '@/lib/image/config';
import { imageProviders } from '@/lib/image/registry';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){try{requireAdmin(req);return NextResponse.json({providers:imageProviders().map(p=>({id:p.id,envKey:p.envKey,configured:p.isConfigured(),defaultModel:p.defaultModel})),routing:imageRoute(),limits:imageLimits(),moderationMode:process.env.SCEN_IMAGE_MODERATION_MODE||'provider',assetIngestConfigured:Boolean(process.env.SCEN_ASSET_INGEST_URL),deployEnabled:false},{headers:{'Cache-Control':'no-store'}})}catch(e:any){return NextResponse.json({error:e?.message||'Unauthorized'},{status:e?.status||401})}}
