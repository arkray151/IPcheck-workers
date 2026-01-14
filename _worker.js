/**
 * IP SENTINEL - PLATINUM EDITION v2
 * 1. 核心修复: ipapi.is 评分解析 (解决 NaN% 问题)
 * 2. 界面重构: 移除折叠，信息全展开
 * 3. 视觉优化: DualStack 去除重色块，标签智能着色
 * 4. 数据源: 统一依赖 ipapi.is 进行风控分析
 */

export default {
   async fetch(request, env, ctx) {
     const cf = request.cf || {};
     const headers = request.headers;
     const clientIp = headers.get("cf-connecting-ip") || headers.get("x-forwarded-for") || "127.0.0.1";
 
     const cfData = {
       ip: clientIp,
       city: cf.city || "Unknown",
       country: cf.country || "Unknown",
       isp: cf.asOrganization || "Cloudflare",
       asn: cf.asn ? `AS${cf.asn}` : "N/A",
       colo: cf.colo || "N/A",
       http: cf.httpProtocol || "HTTP"
     };
 
     return new Response(renderHtml(cfData), {
       headers: { 'content-type': 'text/html;charset=UTF-8' },
     });
   },
 };
 
 function renderHtml(cfData) {
   return `
 <!DOCTYPE html>
 <html lang="zh-CN">
   <head>
     <meta charset="UTF-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     <title>IP Sentinel Pro v2</title>
     <link rel="icon" href="https://www.cloudflare.com/favicon.ico">
     <script src="https://cdn.tailwindcss.com"></script>
     <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
     <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
     <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
     <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
     
     <script>
       window.CF_DATA = ${JSON.stringify(cfData)};
       
       tailwind.config = {
         theme: {
           extend: {
             fontFamily: { 
               sans: ['Plus Jakarta Sans', 'sans-serif'], 
               mono: ['JetBrains Mono', 'monospace'] 
             },
             colors: {
               primary: '#F38020',
               secondary: '#FAAE40',
               surface: '#ffffff',
               canvas: '#f8fafc',
             },
             animation: {
               'float': 'float 6s ease-in-out infinite',
               'slide-down': 'slideDown 0.3s ease-out forwards',
               'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
               'pulse-slow': 'pulse 3s infinite',
             },
             keyframes: {
               float: {
                 '0%, 100%': { transform: 'translateY(0)' },
                 '50%': { transform: 'translateY(-10px)' },
               },
               slideDown: {
                 '0%': { opacity: 0, transform: 'translateY(-10px)', height: 0 },
                 '100%': { opacity: 1, transform: 'translateY(0)', height: 'auto' },
               },
               fadeInUp: {
                 '0%': { opacity: 0, transform: 'translateY(20px)' },
                 '100%': { opacity: 1, transform: 'translateY(0)' },
               }
             },
             boxShadow: {
               'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
               'card': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
               'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
               'glow': '0 0 15px rgba(243, 128, 32, 0.3)',
             }
           }
         }
       }
     </script>
     <style>
       body { 
         background-color: #f8fafc;
         background-image: 
           radial-gradient(at 0% 0%, hsla(253,16%,90%,1) 0, transparent 50%), 
           radial-gradient(at 50% 0%, hsla(225,39%,95%,1) 0, transparent 50%), 
           radial-gradient(at 100% 0%, hsla(339,49%,90%,1) 0, transparent 50%);
         min-height: 100vh;
         color: #1e293b;
       }
       
       .glass-card {
         background: rgba(255, 255, 255, 0.9);
         backdrop-filter: blur(12px);
         -webkit-backdrop-filter: blur(12px);
         border: 1px solid rgba(255, 255, 255, 0.6);
       }
 
       .glass-panel {
         background: rgba(248, 250, 252, 0.6);
         border: 1px solid rgba(226, 232, 240, 0.6);
       }
 
       .gradient-text {
         background: linear-gradient(135deg, #F38020 0%, #d946ef 100%);
         -webkit-background-clip: text;
         -webkit-text-fill-color: transparent;
       }
 
       .animate-delay-100 { animation-delay: 100ms; }
       .animate-delay-200 { animation-delay: 200ms; }
       .animate-delay-300 { animation-delay: 300ms; }
       .animate-delay-400 { animation-delay: 400ms; }
 
       /* 平滑滚动 */
       html { scroll-behavior: smooth; }
       
       /* 隐藏滚动条但保留功能 */
       .no-scrollbar::-webkit-scrollbar { display: none; }
       .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
     </style>
   </head>
   <body class="p-4 md:p-8 pb-20 antialiased selection:bg-orange-100 selection:text-orange-600">
     <div id="root" class="max-w-7xl mx-auto"></div>
 
     <script type="text/babel" data-presets="react">
       const { useState, useEffect, useMemo } = React;
       const { createRoot } = ReactDOM;
 
       // === Icons ===
       const Icons = {
         Wifi: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>,
         Shield: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
         Globe: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
         Cpu: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>,
         Map: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
       };
 
       // === Helper: Precise Risk Score Extraction ===
       // 修复：ipapi.is 返回的 abuser_score 可能是字符串 "0.0026 (Low)"
       const extractScore = (val) => {
           if (val === undefined || val === null) return 0;
           // 尝试提取数字
           const match = String(val).match(/([0-9.]+)/);
           if (!match) return 0;
           const num = parseFloat(match[1]);
           // 转换为 0-100
           return Math.min(100, Math.round(num * 100)); 
       };
 
       // === Component: Waveform Ping Card ===
       const PingCard = ({ name, url, icon }) => {
           const [ms, setMs] = useState(null);
           const [history, setHistory] = useState(new Array(12).fill(0));
 
           useEffect(() => {
               const ping = () => {
                   const start = Date.now();
                   const img = new Image();
                   const update = () => {
                       const t = Date.now() - start;
                       setMs(t);
                       setHistory(prev => [...prev.slice(1), t]);
                   };
                   img.onload = update;
                   img.onerror = update;
                   img.src = \`\${url}?t=\${Date.now()}\`;
               };
               const t1 = setTimeout(ping, Math.random() * 1500);
               const t2 = setInterval(ping, 3000);
               return () => { clearTimeout(t1); clearInterval(t2); };
           }, [url]);
 
           const getBarColor = (val) => {
               if (val === 0) return 'bg-gray-100';
               if (val < 100) return 'bg-emerald-400';
               if (val < 300) return 'bg-amber-400';
               return 'bg-rose-500';
           };
 
           return (
               <div className="glass-card p-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group">
                   <div className="flex justify-between items-center mb-2">
                       <div className="flex items-center gap-2">
                           <img src={icon} className="w-5 h-5 rounded-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                           <span className="text-[11px] font-bold text-gray-600">{name}</span>
                       </div>
                       <div className={\`font-mono text-[10px] font-bold \${!ms ? 'text-gray-300' : (ms<100 ? 'text-emerald-600' : 'text-amber-600')}\`}>
                           {ms ? \`\${ms}ms\` : '-'}
                       </div>
                   </div>
                   <div className="flex items-end gap-[2px] h-6">
                       {history.map((h, i) => (
                           <div 
                               key={i} 
                               className={\`flex-1 rounded-sm transition-all duration-500 \${getBarColor(h)}\`} 
                               style={{ 
                                   height: \`\${h === 0 ? 10 : Math.min(100, h / 3)}%\`,
                                   opacity: 0.5 + (i/24) 
                               }}
                           ></div>
                       ))}
                   </div>
               </div>
           );
       };
 
       // === Component: Risk Report (Unified Logic) ===
       const RiskReport = ({ data, loading, error }) => {
           if (loading) return (
               <div className="mt-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50 animate-pulse space-y-3">
                   <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                   <div className="grid grid-cols-4 gap-2">
                       {[1,2,3,4].map(i => <div key={i} className="h-6 bg-gray-200 rounded"></div>)}
                   </div>
               </div>
           );
 
           if (!data || error) return null;
 
           // 精确计算分数
           const companyScore = extractScore(data.company?.abuser_score);
           const asnScore = extractScore(data.asn?.abuser_score);
           
           // 综合风险计算
           let riskLevel = Math.max(companyScore, asnScore);
           if (data.is_abuser) riskLevel = 100;
           if (data.is_proxy || data.is_vpn) riskLevel = Math.max(riskLevel, 75);
           if (data.is_datacenter) riskLevel = Math.max(riskLevel, 50);
 
           const Badge = ({ active, label, type = 'bad' }) => {
               if (!active) return null;
               let style = "bg-gray-100 text-gray-500 border-gray-200"; // neutral
               if (type === 'bad') style = "bg-rose-50 text-rose-600 border-rose-100";
               if (type === 'good') style = "bg-emerald-50 text-emerald-600 border-emerald-100";
               if (type === 'info') style = "bg-blue-50 text-blue-600 border-blue-100";
               
               return (
                  <span className={\`text-[10px] px-2 py-0.5 rounded border font-semibold flex items-center gap-1 \${style}\`}>
                     {label}
                  </span>
               );
           };
 
           return (
               <div className="mt-4 pt-4 border-t border-gray-100">
                   {/* Scores */}
                   <div className="grid grid-cols-2 gap-4 mb-4">
                       <div className="glass-panel p-2 rounded text-center">
                           <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">ISP 信誉</div>
                           <div className={\`text-lg font-mono font-bold \${companyScore > 20 ? 'text-rose-500' : 'text-emerald-500'}\`}>
                               {companyScore}% <span className="text-[10px] text-gray-400 font-normal">Bad</span>
                           </div>
                       </div>
                       <div className="glass-panel p-2 rounded text-center">
                           <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">ASN 信誉</div>
                           <div className={\`text-lg font-mono font-bold \${asnScore > 20 ? 'text-rose-500' : 'text-emerald-500'}\`}>
                               {asnScore}% <span className="text-[10px] text-gray-400 font-normal">Bad</span>
                           </div>
                       </div>
                   </div>
 
                   {/* Tags */}
                   <div className="flex flex-wrap gap-2 mb-4">
                       <Badge label="Proxy" active={data.is_proxy} type="bad" />
                       <Badge label="VPN" active={data.is_vpn} type="bad" />
                       <Badge label="Tor" active={data.is_tor} type="bad" />
                       <Badge label="数据中心" active={data.is_datacenter} type="bad" />
                       <Badge label="滥用IP" active={data.is_abuser} type="bad" />
                       <Badge label="移动网络" active={data.is_mobile} type="good" />
                       <Badge label="搜索引擎" active={data.is_crawler} type="good" />
                       <Badge label="住宅宽带" active={!data.is_datacenter && !data.is_mobile && !data.is_proxy} type="good" />
                   </div>
 
                   {/* Meta Data */}
                   <div className="grid grid-cols-2 gap-y-2 text-xs">
                       <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400">ASN 组织</span>
                          <span className="font-medium text-gray-700 truncate">{data.asn?.org || 'N/A'}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400">网络类型</span>
                          <span className="font-medium text-gray-700">{data.asn?.type || 'N/A'}</span>
                       </div>
                       <div className="col-span-2 flex flex-col pt-2 border-t border-dashed border-gray-200">
                          <span className="text-[10px] text-gray-400">地理位置</span>
                          <span className="font-medium text-gray-700">{data.location?.city}, {data.location?.country} ({data.location?.latitude}, {data.location?.longitude})</span>
                       </div>
                   </div>
               </div>
           );
       };
 
       // === Component: Main IP Card ===
       const IpCard = ({ title, type, delay = 0, accentColor = 'blue' }) => {
           const [baseInfo, setBaseInfo] = useState({ ip: '...', status: 'loading' });
           const [riskData, setRiskData] = useState(null);
           const [loadingRisk, setLoadingRisk] = useState(false);
 
           useEffect(() => {
               const init = async () => {
                   await new Promise(r => setTimeout(r, delay));
                   let currentIp = null;
 
                   // 1. 获取 IP (保留国内容错逻辑以确保准确获取 IP)
                   try {
                       if (type === 'domestic') {
                           try {
                               const r = await fetch('https://myip.ipip.net/json');
                               const j = await r.json();
                               currentIp = j.data.ip;
                           } catch {
                               try {
                                   const r = await fetch('https://ip.useragentinfo.com/json');
                                   const j = await r.json();
                                   currentIp = j.ip;
                               } catch {
                                   const r = await fetch('https://ipapi.co/json/');
                                   const j = await r.json();
                                   currentIp = j.ip;
                               }
                           }
                       } else if (type === 'foreign') {
                           const r = await fetch('https://ipapi.co/json/');
                           const j = await r.json();
                           currentIp = j.ip;
                       } else {
                           currentIp = window.CF_DATA.ip;
                       }
 
                       setBaseInfo({ ip: currentIp, status: 'ok' });
                       
                       // 2. 统一使用 ipapi.is 获取所有详情
                       if (currentIp) {
                           setLoadingRisk(true);
                           fetch(\`https://api.ipapi.is?q=\${currentIp}\`)
                               .then(r => r.json())
                               .then(d => {
                                   setRiskData(d);
                                   setLoadingRisk(false);
                               })
                               .catch(() => setLoadingRisk(false));
                       }
                   } catch (e) {
                       setBaseInfo({ ip: '获取失败', status: 'error' });
                   }
               };
               init();
           }, []);
 
           const isErr = baseInfo.status === 'error';
 
           return (
               <div className="glass-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden h-full">
                   {/* Accent Bar */}
                   <div className={\`absolute top-0 left-0 w-full h-1 bg-\${accentColor}-500/50\`}></div>
                   
                   <div className="flex justify-between items-start mb-2">
                       <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                           <span className={\`w-1.5 h-1.5 rounded-full bg-\${accentColor}-500\`}></span>
                           {title}
                       </h3>
                       <div className={\`w-2 h-2 rounded-full \${baseInfo.status === 'loading' ? 'bg-amber-400 animate-pulse' : (isErr ? 'bg-rose-500' : 'bg-emerald-500')}\`}></div>
                   </div>
 
                   <div className="mb-2">
                       {baseInfo.status === 'loading' ? (
                           <div className="h-8 w-32 bg-gray-100 rounded animate-pulse"></div>
                       ) : (
                           <div className={\`text-2xl font-mono font-bold tracking-tight break-all \${isErr ? 'text-rose-500' : 'text-gray-800'}\`}>
                               {baseInfo.ip}
                           </div>
                       )}
                   </div>
 
                   {/* 统一风控报告组件 */}
                   {!isErr && baseInfo.status !== 'loading' && (
                       <RiskReport data={riskData} loading={loadingRisk} />
                   )}
               </div>
           );
       };
 
       // === Component: Dual Stack (Clean Design) ===
       const DualStack = () => {
           const [v4, setV4] = useState(null);
           const [v6, setV6] = useState(null);
 
           useEffect(() => {
               fetch('https://api.ipify.org?format=json').then(r=>r.json()).then(d=>setV4(d.ip)).catch(()=>setV4('N/A'));
               fetch('https://api6.ipify.org?format=json').then(r=>r.json()).then(d=>setV6(d.ip)).catch(()=>setV6('N/A'));
           }, []);
 
           const Card = ({ label, val, border }) => (
               <div className={\`glass-card border-l-4 \${border} rounded-r-xl p-4 flex flex-col justify-center min-h-[80px]\`}>
                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</span>
                   <span className="font-mono font-bold text-gray-800 break-all text-sm md:text-base">
                       {val || <span className="animate-pulse bg-gray-200 rounded text-transparent">Loading...</span>}
                   </span>
               </div>
           );
 
           return (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                   <Card label="IPv4 连接" val={v4} border="border-blue-500" />
                   <Card label="IPv6 连接" val={v6} border="border-purple-500" />
               </div>
           );
       };
 
       // === Component: Fingerprint ===
       const Fingerprint = () => {
          const [fp, setFp] = useState(null);
          useEffect(() => {
             const getCanvas = () => {
                 try {
                   const c = document.createElement('canvas');
                   const ctx = c.getContext('2d');
                   ctx.fillText("Cloudflare", 2, 2);
                   return c.toDataURL().slice(-10);
                 } catch(e) { return 'Error'; }
             };
             setFp({
                 ua: navigator.userAgent,
                 lang: navigator.language,
                 tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
                 res: \`\${window.screen.width}x\${window.screen.height}\`,
                 gpu: (function() {
                     try {
                         const c = document.createElement('canvas');
                         const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
                         const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                         return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
                     } catch(e) { return 'Unknown'; }
                 })(),
                 canvas: getCanvas()
             });
          }, []);
 
          if(!fp) return null;
 
          const Item = ({ k, v }) => (
              <div className="flex flex-col border-b border-gray-100 pb-2 last:border-0">
                  <span className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">{k}</span>
                  <span className="text-xs font-mono text-gray-600 break-all">{v}</span>
              </div>
          );
 
          return (
              <div className="glass-card rounded-2xl p-6 shadow-card mb-8">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Icons.Cpu /> 浏览器指纹
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                      <Item k="User Agent" v={fp.ua} />
                      <Item k="GPU 渲染器" v={fp.gpu} />
                      <div className="grid grid-cols-2 gap-4">
                          <Item k="语言" v={fp.lang} />
                          <Item k="时区" v={fp.tz} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <Item k="分辨率" v={fp.res} />
                          <Item k="Canvas Hash" v={fp.canvas} />
                      </div>
                  </div>
              </div>
          );
       };
 
       // === Main App ===
       const App = () => {
           return (
               <div className="animate-fade-in-up">
                   {/* Header */}
                   <header className="mb-8 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white shadow-glow">
                               <Icons.Shield />
                           </div>
                           <div>
                               <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">IP Sentinel</h1>
                               <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                                   <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">v2.0 Platinum</span>
                                   <span>{window.CF_DATA.colo} • {window.CF_DATA.country}</span>
                               </div>
                           </div>
                       </div>
                   </header>
 
                   {/* 1. 实时延迟 (置顶) */}
                   <section className="mb-8">
                       <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                           <PingCard name="Bilibili" url="https://i0.hdslb.com/bfs/face/member/noface.jpg" icon="https://www.bilibili.com/favicon.ico" />
                           <PingCard name="WeChat" url="https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico" icon="https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico" />
                           <PingCard name="Google" url="https://www.google.com/favicon.ico" icon="https://www.google.com/favicon.ico" />
                           <PingCard name="GitHub" url="https://github.github.io/janky/images/bg_hr.png" icon="https://github.com/favicon.ico" />
                           <PingCard name="YouTube" url="https://i.ytimg.com/vi/M7lc1UVf-VE/mqdefault.jpg" icon="https://www.youtube.com/favicon.ico" />
                           <PingCard name="OpenAI" url="https://openai.com/favicon.ico" icon="https://openai.com/favicon.ico" />
                           <PingCard name="Telegram" url="https://telegram.org/img/t_logo.png" icon="https://telegram.org/favicon.ico" />
                           <PingCard name="Netflix" url="https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico" icon="https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico" />
                           <PingCard name="Cloudflare" url="https://www.cloudflare.com/favicon.ico" icon="https://www.cloudflare.com/favicon.ico" />
                           <PingCard name="Apple" url="https://www.apple.com/favicon.ico" icon="https://www.apple.com/favicon.ico" />
                       </div>
                   </section>
 
                   {/* 2. 双栈检测 (新设计) */}
                   <DualStack />
 
                   {/* 3. 核心出口与风控 (全展开) */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                       <IpCard title="国内出口" type="domestic" delay={0} accentColor="blue" />
                       <IpCard title="国外出口" type="foreign" delay={200} accentColor="amber" />
                       <IpCard title="Cloudflare" type="cloudflare" delay={400} accentColor="primary" />
                   </div>
 
                   {/* 4. 指纹 */}
                   <Fingerprint />
 
                   <footer className="text-center text-gray-400 text-[10px] py-8 font-mono border-t border-gray-100/50">
                       <p>Powered by Cloudflare Workers & React</p>
                       <p className="mt-1 opacity-60">Risk Analysis by ipapi.is</p>
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
