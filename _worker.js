/**
 * IP Sentinel - Pro Edition
 * 纯净增强版
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // === 配置: 优先读取环境变量，否则使用默认值 ===
    const config = {
      title: env.TITLE || "网络连接助手",
      footer: env.FOOTER || "© 2024 Network Tools | Cloudflare Edge",
    };

    // === PWA Manifest ===
    if (url.pathname === "/manifest.json") {
      const manifest = {
        "name": config.title,
        "short_name": "NetCheck",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#0f172a",
        "theme_color": "#0f172a",
        "icons": [
          {
            "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/%3E%3C/svg%3E",
            "type": "image/svg+xml",
            "sizes": "192x192"
          }
        ]
      };
      return new Response(JSON.stringify(manifest), {
        headers: { "content-type": "application/json" }
      });
    }

    // === Service Worker ===
    if (url.pathname === "/sw.js") {
      return new Response(`
        self.addEventListener('install', (e) => self.skipWaiting());
        self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
        self.addEventListener('fetch', (e) => {});
      `, { headers: { "content-type": "application/javascript" } });
    }

    // === 获取 Cloudflare 提供的 IP 信息 ===
    const cf = request.cf || {};
    const headers = request.headers;
    const clientIp = headers.get("cf-connecting-ip") || headers.get("x-forwarded-for") || "127.0.0.1";
    
    const initData = {
      ip: clientIp,
      country: cf.country || "未知", 
      city: cf.city || "未知城市",
      region: cf.region || "",
      isp: cf.asOrganization || "未知运营商",
      asn: cf.asn ? "AS" + cf.asn : "未知 ASN",
      lat: Number(cf.latitude) || 0,
      lon: Number(cf.longitude) || 0,
      colo: cf.colo || "UNK",
      timezone: cf.timezone || "UTC",
      httpProtocol: cf.httpProtocol || "HTTP/2",
      tlsVersion: cf.tlsVersion || "TLS 1.3",
      userAgent: headers.get("user-agent") || ""
    };

    return new Response(renderHtml(initData, config), {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: *; connect-src *; img-src * data: https:; style-src * 'unsafe-inline'; font-src *;"
      },
    });
  },
};

function renderHtml(initData, config) {
  return `
<!DOCTYPE html>
<html lang="zh-CN" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>${config.title}</title>
    <meta name="theme-color" content="#0f172a" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/%3E%3C/svg%3E">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>

    <script>
      window.CF_DATA = ${JSON.stringify(initData)};
      window.SITE_CONFIG = ${JSON.stringify(config)};
      
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
      }
      
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
            colors: { 
              slate: { 850: '#151f32', 900: '#0f172a', 950: '#020617' }, 
              neon: { cyan: '#06b6d4', green: '#10b981', purple: '#8b5cf6', red: '#f43f5e' } 
            }
          }
        }
      }
    </script>
    <style>
      body { background-color: #0f172a; color: #f8fafc; -webkit-tap-highlight-color: transparent; }
      .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: #0f172a; }
      ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      .map-color { filter: brightness(0.8) contrast(1.1) grayscale(0.3); }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel" data-presets="react">
      const { useState, useEffect, useRef } = React;
      const { createRoot } = ReactDOM;

      // === 图标组件集 ===
      const Icons = {
        Shield: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
        MapPin: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
        Wifi: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
        Copy: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
        Check: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"/></svg>,
        Server: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
        Activity: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
        Eye: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
        EyeOff: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>,
        Monitor: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
        Smartphone: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
        Globe: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
        Alert: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
        Lock: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
      };

      // === 辅助函数 ===
      const copyText = (text, onSuccess) => {
        if (!text || text === "N/A" || text.includes("Fail")) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(onSuccess).catch(() => {});
        } else {
           // 降级复制
           const ta = document.createElement("textarea");
           ta.value = text; ta.style.cssText = "position:fixed;left:-9999px";
           document.body.appendChild(ta); ta.select(); document.execCommand("copy");
           document.body.removeChild(ta); onSuccess();
        }
      };

      const maskIp = (ip) => {
        if (!ip || ip.length < 5) return ip;
        if (ip.includes(':')) { // IPv6
             const parts = ip.split(':');
             return parts.length > 3 ? parts.slice(0, 3).join(':') + ':****:****' : ip;
        } else { // IPv4
             return ip.replace(/\.\d+\.\d+$/, '.*.*');
        }
      };

      const parseUA = (ua) => {
        let os = '未知系统', browser = '未知浏览器';
        if (ua.includes('Win')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
        
        if (ua.includes('Edg')) browser = 'Edge';
        else if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        
        return { os, browser };
      };

      // === 组件 ===

      // 1. 信息小卡片
      const InfoCard = ({ title, value, icon: Icon, subValue, color }) => (
        <div className="glass p-4 rounded-xl flex flex-col justify-between h-full border border-slate-700/50 hover:border-slate-500 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-slate-800/80 rounded-lg">
              <Icon className={"w-5 h-5 " + color} />
            </div>
            {subValue && <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">{subValue}</span>}
          </div>
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
            <p className="text-base md:text-lg font-bold text-white font-mono tracking-tight leading-tight break-all">{value}</p>
          </div>
        </div>
      );

      // 2. 主 IP 卡片
      const MainIpCard = ({ data, riskData }) => {
        const [copied, setCopied] = useState(false);
        const [isHidden, setIsHidden] = useState(false);
        
        // 风险评分
        const calculateScore = () => {
           if (!riskData) return null;
           const { is_vpn, is_proxy, is_tor, is_datacenter, is_abuser, is_bot } = riskData;
           let score = 100;
           if (is_vpn) score -= 20; if (is_proxy) score -= 20; if (is_tor) score -= 40;
           if (is_datacenter) score -= 15; if (is_abuser) score -= 30; if (is_bot) score -= 20;
           return Math.max(0, score);
        };
        const score = calculateScore();
        const scoreColor = score > 80 ? 'text-neon-green' : score > 50 ? 'text-yellow-400' : 'text-neon-red';
        const barColor = score > 80 ? 'bg-neon-green' : score > 50 ? 'bg-yellow-400' : 'bg-neon-red';
        
        const hasRisk = riskData && (riskData.is_vpn || riskData.is_proxy || riskData.is_tor || riskData.is_abuser);

        return (
          <div className="glass p-0 rounded-2xl relative overflow-hidden border border-slate-700 shadow-2xl shadow-black/20 flex flex-col h-full">
            {/* 顶部栏 */}
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex justify-between items-center z-20 relative">
               <div className="flex items-center gap-2">
                  <div className="bg-cyan-500/20 p-1.5 rounded text-cyan-400"><Icons.Shield className="w-5 h-5" /></div>
                  <span className="font-bold text-slate-200 text-sm">当前连接 (Cloudflare)</span>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => setIsHidden(!isHidden)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition-colors" title={isHidden ? "显示 IP" : "隐藏 IP"}>
                    {isHidden ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                 </button>
                 <button onClick={() => copyText(data.ip, () => { setCopied(true); setTimeout(() => setCopied(false), 2000); })} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition-colors">
                    {copied ? <Icons.Check className="w-4 h-4 text-green-400" /> : <Icons.Copy className="w-4 h-4" />}
                 </button>
               </div>
            </div>

            {/* 地图背景区域 */}
            <div className="relative flex-grow min-h-[160px] md:min-h-[200px] bg-slate-900 group">
                <iframe 
                   src={"https://maps.google.com/maps?q=" + data.lat + "," + data.lon + "&z=6&output=embed"}
                   className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-700 map-color absolute inset-0"
                   frameBorder="0" scrolling="no" style={{pointerEvents: 'none'}}
                ></iframe>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                
                <div className="absolute bottom-4 left-4 right-4 z-20">
                   <div className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tight drop-shadow-lg mb-1">
                      {isHidden ? maskIp(data.ip) : data.ip}
                   </div>
                   <div className="flex flex-wrap gap-2 items-center text-sm font-medium text-slate-300 drop-shadow-md">
                      <span className="flex items-center gap-1"><Icons.MapPin className="w-4 h-4 text-cyan-400" /> {data.city} {data.region} {data.country}</span>
                      <span className="hidden md:inline text-slate-500">|</span>
                      <span className="flex items-center gap-1"><Icons.Server className="w-4 h-4 text-purple-400" /> {data.isp}</span>
                   </div>
                </div>
            </div>

            {/* 底部信息栏 */}
            <div className="p-4 bg-slate-900/80 backdrop-blur border-t border-slate-800 z-20">
               <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1 min-w-[80px]">
                     <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">IP 评分</span>
                     <div className={"text-2xl font-mono font-bold " + scoreColor}>{score !== null ? score : "--"}</div>
                  </div>
                  <div className="flex-grow flex flex-col justify-center gap-2">
                     <div className="flex justify-between text-xs text-slate-400">
                        <span>{hasRisk ? "检测到潜在风险" : "IP 状态良好"}</span>
                        <span>{score ? score + "/100" : "检测中..."}</span>
                     </div>
                     <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={"h-full transition-all duration-1000 ease-out " + barColor} style={{ width: score ? score + "%" : "0%" }}></div>
                     </div>
                  </div>
                  <div className="pl-4 border-l border-slate-700 hidden sm:block">
                     <div className="text-xs text-slate-500 mb-1">代理检测</div>
                     <div className={"font-bold text-sm " + (hasRisk ? "text-red-400" : "text-green-400")}>
                        {hasRisk ? "Risk" : "Clean"}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        );
      };

      // 3. 详细连接信息 (IPv4/IPv6)
      const DetailedIpCard = ({ type, url }) => {
         const [info, setInfo] = useState(null);
         const [loading, setLoading] = useState(true);
         
         useEffect(() => {
            const fetchInfo = async () => {
               try {
                  const res = await fetch(url);
                  const data = await res.json();
                  setInfo(data);
               } catch(e) { setInfo({ error: true }); }
               finally { setLoading(false); }
            };
            fetchInfo();
         }, [url]);

         const isAvailable = info && !info.error && info.ip;

         return (
            <div className="glass p-4 rounded-xl border border-slate-700/50 flex flex-col gap-3">
               <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                  <span className="font-bold text-slate-300 flex items-center gap-2">
                     {type === 'IPv4' ? <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">IPv4</span> : <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">IPv6</span>}
                     连接测试
                  </span>
                  {loading && <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>}
               </div>
               
               {loading ? (
                  <div className="h-20 flex items-center justify-center text-slate-600 text-sm">正在检测...</div>
               ) : isAvailable ? (
                  <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-slate-500">地址</span>
                        <span className="text-slate-200 font-mono select-all text-right truncate ml-4" title={info.ip}>{maskIp(info.ip)}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-slate-500">运营商</span>
                        <span className="text-slate-300 text-right truncate ml-4" title={info.isp}>{info.isp}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-slate-500">位置</span>
                        <span className="text-slate-300 text-right truncate ml-4">{info.country} {info.city}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-slate-500">ASN</span>
                        <span className="text-slate-300 font-mono text-right">{info.asn ? "AS"+info.asn : "-"}</span>
                     </div>
                  </div>
               ) : (
                  <div className="h-24 flex flex-col items-center justify-center text-slate-500 gap-2">
                     <Icons.Alert className="w-6 h-6 opacity-50" />
                     <span className="text-xs">该网络环境不支持 {type}</span>
                  </div>
               )}
            </div>
         );
      };

      // 4. WebRTC 检测
      const WebRTCDetect = () => {
         const [status, setStatus] = useState("检测中...");
         const [leakIp, setLeakIp] = useState(null);
         
         useEffect(() => {
            const rtc = new RTCPeerConnection({iceServers: [{urls: "stun:stun.l.google.com:19302"}]});
            rtc.createDataChannel('');
            rtc.createOffer().then(o => rtc.setLocalDescription(o));
            rtc.onicecandidate = (ice) => {
               if (ice && ice.candidate && ice.candidate.candidate) {
                  const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
                  const res = ipRegex.exec(ice.candidate.candidate);
                  if (res && res[1]) {
                     if (!res[1].startsWith('192.168') && !res[1].startsWith('10.') && !res[1].startsWith('172.')) {
                        setLeakIp(res[1]); setStatus("存在泄漏");
                     }
                  }
               }
            };
            setTimeout(() => {
               if (!leakIp) setStatus("安全 (无泄漏)");
               rtc.close();
            }, 3000);
         }, [leakIp]);

         return (
            <div className="glass p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between h-full">
               <div className="flex items-center gap-2 mb-2">
                  <Icons.Lock className={"w-5 h-5 " + (leakIp ? "text-red-400" : "text-emerald-400")} />
                  <span className="font-bold text-slate-300">WebRTC 隐私</span>
               </div>
               <div>
                  <div className={"text-lg font-bold " + (leakIp ? "text-red-400" : "text-emerald-400")}>{status}</div>
                  {leakIp && <div className="text-xs text-slate-500 mt-1 font-mono">暴露 IP: {leakIp}</div>}
               </div>
            </div>
         );
      };

      // 5. 延迟测试条目
      const LatencyItem = ({ name, url }) => {
         const [ms, setMs] = useState(null);
         const [status, setStatus] = useState('checking');
         
         useEffect(() => {
            const start = performance.now();
            let isDone = false;
            const controller = new AbortController();
            
            const runCheck = async () => {
               try {
                  await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
                  if(!isDone) { isDone = true; setMs(Math.round(performance.now() - start)); setStatus('ok'); }
               } catch(e) { if(!isDone) { isDone = true; setStatus('fail'); } }
            };
            
            runCheck();
            setTimeout(() => { if(!isDone) { isDone = true; controller.abort(); setStatus('timeout'); } }, 3000);
         }, []);

         const color = status === 'ok' ? (ms < 100 ? 'text-green-400' : ms < 300 ? 'text-yellow-400' : 'text-orange-400') : 'text-slate-500';
         
         return (
            <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded border border-slate-800">
               <span className="text-sm text-slate-300 font-medium">{name}</span>
               <span className={"font-mono text-xs font-bold " + color}>
                  {status === 'checking' ? '...' : status === 'ok' ? ms + 'ms' : '超时'}
               </span>
            </div>
         );
      };

      // 6. 网络连接信息 (Hardware/Connection API)
      const NetworkInfo = () => {
          const [netInfo, setNetInfo] = useState({ type: '未知', speed: '未知', rtt: '未知' });
          
          useEffect(() => {
             if (navigator.connection) {
                const updateNet = () => {
                   const c = navigator.connection;
                   setNetInfo({
                      type: c.effectiveType ? c.effectiveType.toUpperCase() : 'WIFI/LAN',
                      speed: c.downlink ? c.downlink + ' Mbps' : '未知',
                      rtt: c.rtt ? c.rtt + ' ms' : '未知'
                   });
                };
                updateNet();
                navigator.connection.addEventListener('change', updateNet);
                return () => navigator.connection.removeEventListener('change', updateNet);
             }
          }, []);
          
          return (
             <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-slate-800/50 rounded p-2 text-center border border-slate-700">
                   <div className="text-[10px] text-slate-500 uppercase">网络类型</div>
                   <div className="text-cyan-400 font-bold font-mono text-sm">{netInfo.type}</div>
                </div>
                <div className="bg-slate-800/50 rounded p-2 text-center border border-slate-700">
                   <div className="text-[10px] text-slate-500 uppercase">下行带宽</div>
                   <div className="text-emerald-400 font-bold font-mono text-sm">{netInfo.speed}</div>
                </div>
                <div className="bg-slate-800/50 rounded p-2 text-center border border-slate-700">
                   <div className="text-[10px] text-slate-500 uppercase">估算延迟</div>
                   <div className="text-yellow-400 font-bold font-mono text-sm">{netInfo.rtt}</div>
                </div>
             </div>
          );
      };

      // === 主程序 ===
      const App = () => {
        const data = window.CF_DATA;
        const [riskData, setRiskData] = useState(null);
        const [hostname, setHostname] = useState("扫描中...");
        const sysInfo = parseUA(data.userAgent);
        
        // 屏幕信息
        const screenInfo = window.screen ? \`\${window.screen.width}x\${window.screen.height}\` : "未知";

        useEffect(() => {
           // 获取 IP 风险数据
           fetch('https://api.ipapi.is').then(res => res.json()).then(json => {
              setRiskData(json);
              setHostname(json.asn?.domain || json.company?.domain || "N/A");
           }).catch(() => setHostname("无法获取"));
        }, []);

        return (
          <div className="min-h-screen max-w-6xl mx-auto px-4 py-8 pb-20">
             {/* 标题头 */}
             <header className="mb-8 flex items-center justify-between">
                <div>
                   <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Icons.Activity className="w-6 h-6 text-cyan-400" />
                      {window.SITE_CONFIG.title}
                   </h1>
                   <p className="text-slate-500 text-sm mt-1">Cloudflare Edge 实时网络分析</p>
                </div>
                <div className="text-right hidden sm:block">
                   <div className="text-xs font-mono text-slate-600 border border-slate-800 rounded px-2 py-1">
                      {data.tlsVersion} / {data.httpProtocol}
                   </div>
                </div>
             </header>

             {/* 第一行：主要 IP 信息 和 设备信息 */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 h-full">
                   <MainIpCard data={data} riskData={riskData} />
                </div>
                <div className="grid grid-cols-2 gap-4 h-full">
                   <InfoCard title="系统环境" value={sysInfo.os} subValue={sysInfo.browser} icon={Icons.Monitor} color="text-blue-400" />
                   <InfoCard title="屏幕分辨率" value={screenInfo} subValue={window.screen.colorDepth + " bit"} icon={Icons.Smartphone} color="text-purple-400" />
                   <InfoCard title="数据中心" value={data.colo} icon={Icons.Server} color="text-orange-400" />
                   <InfoCard title="网络主机名" value={hostname} icon={Icons.Wifi} color="text-pink-400" />
                </div>
             </div>

             {/* 第二行：连通性测试 (双栈 + 网站) */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <DetailedIpCard type="IPv4" url="https://api-ipv4.ip.sb/geoip" />
                <DetailedIpCard type="IPv6" url="https://api-ipv6.ip.sb/geoip" />
                
                <div className="glass p-4 rounded-xl border border-slate-700/50 lg:col-span-2 flex flex-col">
                   <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-700/50">
                      <Icons.Globe className="w-5 h-5 text-indigo-400" />
                      <span className="font-bold text-slate-300">服务连通性与延迟</span>
                   </div>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <LatencyItem name="百度" url="https://www.baidu.com" />
                      <LatencyItem name="淘宝" url="https://www.taobao.com" />
                      <LatencyItem name="微信" url="https://mp.weixin.qq.com" />
                      <LatencyItem name="Google" url="https://www.google.com" />
                      <LatencyItem name="GitHub" url="https://github.com" />
                      <LatencyItem name="Cloudflare" url="https://www.cloudflare.com" />
                   </div>
                   <NetworkInfo />
                </div>
             </div>
             
             {/* 第三行：WebRTC 与 其他工具 */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <WebRTCDetect />
                <div className="glass p-4 rounded-xl border border-slate-700/50 flex flex-col justify-center items-center text-center">
                   <div className="text-slate-500 text-xs uppercase mb-1">当前时区时间</div>
                   <div className="text-2xl font-mono font-bold text-white">
                      {new Date().toLocaleTimeString('zh-CN', { timeZone: data.timezone })}
                   </div>
                   <div className="text-xs text-slate-500 mt-1">{data.timezone}</div>
                </div>
                 <div className="glass p-4 rounded-xl border border-slate-700/50 flex flex-col justify-center items-center text-center">
                   <div className="text-slate-500 text-xs uppercase mb-1">客户端 UA</div>
                   <div className="text-xs font-mono text-slate-400 break-all line-clamp-3">
                      {data.userAgent}
                   </div>
                </div>
             </div>

             <footer className="mt-16 text-center border-t border-slate-800 pt-8">
                <p className="text-slate-600 text-sm font-medium">{window.SITE_CONFIG.footer}</p>
             </footer>
          </div>
        );
      };

      const root = createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
`;
}
