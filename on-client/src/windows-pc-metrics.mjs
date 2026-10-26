import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);
const stamp=()=>new Date().toISOString();
const fail=(code)=>({status:'unavailable',reason:code,measuredAt:stamp()});
export function cpuPercent(a,b){
  if(!Array.isArray(a)||!Array.isArray(b)||!a.length||a.length!==b.length)return null;
  let idle=0,total=0;
  for(let i=0;i<a.length;i++){
    const x=a[i]?.times,y=b[i]?.times;
    if(!x||!y)return null;
    for(const key of ['user','nice','sys','idle','irq']){
      const n=y[key]-x[key];if(!Number.isFinite(n)||n<0)return null;
      total+=n;if(key==='idle')idle+=n;
    }
  }
  return total>0?Math.round((100*(total-idle)/total)*10)/10:null;
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let running=null;
let lastValue=null;
let lastTime=0;
const CACHE_MS=3000;
export async function readPcMetrics(){
  if(running)return running;
  if(lastValue&&Date.now()-lastTime<CACHE_MS)return lastValue;
  running=(async()=>{
    const started=performance.now();
    const a=os.cpus();
    const memory=(()=>{try{
      const total=os.totalmem(),free=os.freemem();
      if(!Number.isFinite(total)||total<=0||!Number.isFinite(free)||free<0||free>total)return fail('INVALID_MEMORY_COUNTER');
      return {status:'ok',totalBytes:total,usedBytes:total-free,freeBytes:free,usedPercent:Math.round((total-free)*1000/total)/10,measuredAt:stamp()};
    }catch{return fail('MEMORY_READ_FAILED');}})();
    const diskPromise=(async()=>{try{
      if(process.platform!=='win32')return fail('WINDOWS_REQUIRED');
      const drive=(process.env.SystemDrive||'C:').toUpperCase();
      if(!/^[A-Z]:$/.test(drive))return fail('INVALID_SYSTEM_DRIVE');
      const script=`$d=Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${drive}'" -ErrorAction Stop; if ($null -eq $d) { throw 'DISK_NOT_FOUND' }; @{drive=$d.DeviceID;size=[double]$d.Size;free=[double]$d.FreeSpace} | ConvertTo-Json -Compress`;
      const {stdout}=await execute('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{timeout:4000,maxBuffer:8192,windowsHide:true});
      const data=JSON.parse(stdout.trim());
      if(!Number.isFinite(data.size)||data.size<=0||!Number.isFinite(data.free)||data.free<0||data.free>data.size||data.drive!==drive)return fail('INVALID_DISK_COUNTER');
      return {status:'ok',drive,totalBytes:data.size,freeBytes:data.free,measuredAt:stamp()};
    }catch{return fail('DISK_READ_FAILED');}})();
    await sleep(1000);
    let cpu;
    try{const intervalMs=Math.round(performance.now()-started);const value=cpuPercent(a,os.cpus());
      cpu=value===null?fail('INVALID_CPU_COUNTER'):{status:'ok',usedPercent:value,intervalMs,measuredAt:stamp()};
    }catch{cpu=fail('CPU_READ_FAILED');}
    const disk=await diskPromise;
    const result={source:'local-windows-pc',cpu,memory,disk,checkedAt:stamp()};
    lastValue=result;lastTime=Date.now();return result;
  })();
  try{return await running;}finally{running=null;}
}
