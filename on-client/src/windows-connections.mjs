import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
const now=()=>new Date().toISOString();
const unavailable=(reason)=>({status:'unavailable',reason,measuredAt:now()});
const ps=async(script)=>{
  const {stdout}=await exec('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{timeout:7500,maxBuffer:16384,windowsHide:true});
  const value=JSON.parse(stdout.trim());
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID_RESPONSE');
  return value;
};
async function network(){
  if(process.platform!=='win32')return unavailable('WINDOWS_REQUIRED');
  try{
    const adapters=await ps(`[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false); $a=@(Get-NetAdapter -ErrorAction Stop | Select-Object -First 32 Name,Status,LinkSpeed); @{adapters=@($a); measuredAt=[datetime]::UtcNow.ToString('o')} | ConvertTo-Json -Depth 4 -Compress`);
    if(!Array.isArray(adapters.adapters))throw Error('INVALID_DATA');
    const items=adapters.adapters.filter(a=>typeof a.Name==='string'&&typeof a.Status==='string').map(a=>({name:a.Name.slice(0,100),status:a.Status.slice(0,40),linkSpeed:String(a.LinkSpeed??'').slice(0,40)}));
    return {status:'ok',adapters:items,measuredAt:now()};
  }catch{return unavailable('NETWORK_READ_FAILED');}
}
async function firewall(){
  if(process.platform!=='win32')return unavailable('WINDOWS_REQUIRED');
  try{
    const result=await ps(`$p=@(Get-NetFirewallProfile -ErrorAction Stop | Select-Object Name,Enabled); @{profiles=@($p)} | ConvertTo-Json -Depth 4 -Compress`);
    if(!Array.isArray(result.profiles)||result.profiles.length===0)throw Error('INVALID_DATA');
    const profiles=result.profiles.map(p=>({name:String(p.Name??'').slice(0,32),enabled:typeof p.Enabled==='boolean'?p.Enabled:(p.Enabled===1?true:(p.Enabled===0?false:null))}));
    if(profiles.some(p=>!p.name||p.enabled===null))throw Error('INVALID_DATA');
    return {status:'ok',profiles,measuredAt:now(),readOnly:true};
  }catch{return unavailable('FIREWALL_READ_FAILED');}
}
async function eventLog(logName){
  if(process.platform!=='win32')return unavailable('WINDOWS_REQUIRED');
  try{
    const script=`$start=(Get-Date).AddHours(-24); $count=0; try { Get-WinEvent -FilterHashtable @{LogName='${logName}';Level=2,3;StartTime=$start} -ErrorAction Stop | ForEach-Object { $count++ } } catch { if ($_.FullyQualifiedErrorId -notlike '*NoMatchingEventsFound*') { throw } }; @{count=$count} | ConvertTo-Json -Compress`;
    const r=await ps(script);
    if(!Number.isSafeInteger(r.count)||r.count<0)throw Error('INVALID_COUNT');
    return {status:'ok',count:r.count,levels:['Error','Warning'],windowHours:24,measuredAt:now()};
  }catch{return unavailable('EVENT_LOG_READ_FAILED');}
}
let running=null,cache=null,cacheAt=0;
export async function readWindowsConnections(){
  if(running)return running;
  if(cache&&Date.now()-cacheAt<3000)return cache;
  running=(async()=>{
    const [net,fw,system,application]=await Promise.all([network(),firewall(),eventLog('System'),eventLog('Application')]);
    const output={source:'local-windows-readonly',network:net,firewall:fw,events:{System:system,Application:application},checkedAt:now(),sdp:{status:'not-asserted',reason:'CHECK_SEPARATELY'}};
    cache=output;cacheAt=Date.now();return output;
  })();
  try{return await running;}finally{running=null;}
}
