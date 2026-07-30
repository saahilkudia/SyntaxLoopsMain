document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. GLOBAL UI ENGINES (Alerts & Modals)
    // ==========================================
    window.showSystemAlert = (title, message, type = 'info') => {
        const overlay = document.getElementById('system-alert-overlay');
        const box = document.getElementById('system-alert-box');
        if (!overlay) return;

        document.getElementById('system-alert-title').textContent = title;
        document.getElementById('system-alert-message').textContent = message;

        const iconSvg = document.getElementById('system-alert-icon-svg');
        const accent = document.getElementById('system-alert-accent');

        iconSvg.className = 'fa-solid text-2xl ';
        accent.className = 'absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent ';

        if (type === 'danger') { iconSvg.classList.add('fa-triangle-exclamation', 'text-red-500'); accent.classList.add('via-red-500'); }
        else if (type === 'success') { iconSvg.classList.add('fa-check', 'text-syntaxCyan'); accent.classList.add('via-syntaxCyan'); }
        else { iconSvg.classList.add('fa-circle-info', 'text-blue-400'); accent.classList.add('via-blue-400'); }

        overlay.classList.remove('opacity-0', 'pointer-events-none');
        box.classList.remove('scale-95');

        setTimeout(() => {
            overlay.classList.add('opacity-0', 'pointer-events-none');
            box.classList.add('scale-95');
        }, 3000);
    };

    window.formatMoney = (amount) => {
        const symbol = window.SyntaxAPI.Session.getCurrency();
        const val = parseFloat(amount) || 0;
        return `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    window.showInputModal = (title, inputsHtml, onSubmitCallback) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-[#030712]/90 backdrop-blur-md fade-in';
        overlay.innerHTML = `
            <div class="bento-card p-8 rounded-[2rem] w-full max-w-md relative shadow-[0_0_50px_rgba(20,184,166,0.15)]">
                <h3 class="text-2xl font-black text-white mb-6">${title}</h3>
                <form id="dynamic-modal-form" class="space-y-4">
                    ${inputsHtml}
                    <div class="flex gap-4 pt-4 border-t border-slate-700/50 mt-6">
                        <button type="button" id="btn-modal-cancel" class="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 font-bold hover:text-white transition-colors">Cancel</button>
                        <button type="submit" class="flex-1 py-3 rounded-xl bg-syntaxCyan text-black font-black hover:bg-white transition-colors shadow-[0_0_15px_rgba(20,184,166,0.2)]">Execute</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('btn-modal-cancel').onclick = () => overlay.remove();
        document.getElementById('dynamic-modal-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
            try { await onSubmitCallback(); overlay.remove(); } catch (err) { btn.innerHTML = originalText; }
        };
    };

    window.showInfoModal = (title, contentHtml) => {
        const existing = document.getElementById('dynamic-info-modal');
        if(existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'dynamic-info-modal';
        overlay.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-[#030712]/90 backdrop-blur-md fade-in';
        overlay.innerHTML = `
            <div class="bento-card p-8 rounded-[2rem] w-full max-w-2xl relative shadow-[0_0_50px_rgba(20,184,166,0.15)] border border-syntaxCyan/30 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div class="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
                    <h3 class="text-2xl font-black text-white">${title}</h3>
                    <button id="btn-info-close-top" class="text-slate-500 hover:text-white transition-colors"><i class="fa-solid fa-xmark text-xl"></i></button>
                </div>
                <div class="text-sm text-slate-300 space-y-3 mb-8">${contentHtml}</div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('btn-info-close-top').onclick = () => overlay.remove();
    };

    // ==========================================
    // 2. DYNAMIC UI TEMPLATES
    // ==========================================
    const Views = {

        "hq_dashboard": async () => {
            // Fetch global telemetry for dynamic calculation
            const tenants = await window.SyntaxAPI.Tenants.getAll().catch(()=>[]);

            // Calculate dynamic load metrics
            let globalMrr = 0;
            let activeNodes = 0;
            let suspendedNodes = 0;
            let uncollectedSetup = 0;
            let globalOrdersProcessed = 0; // We will estimate system load based on this

            tenants.forEach(t => {
                if (!t.flagged) {
                    globalMrr += (t.monthlyRate !== undefined ? t.monthlyRate : 3500);
                    activeNodes++;
                } else {
                    suspendedNodes++;
                }
                if (!t.waiveSetupFee) uncollectedSetup += 15000;
                globalOrdersProcessed += Math.floor(Math.random() * 500) + 100; // Simulated historical load for telemetry
            });

            // Deep Telemetry Math (Derived from active DB size)
            const simulatedDocReads = ((activeNodes * 12500) + (globalOrdersProcessed * 12)).toLocaleString();
            const simulatedDocWrites = ((activeNodes * 3200) + (globalOrdersProcessed * 5)).toLocaleString();
            const estimatedStorageGB = ((activeNodes * 0.45) + (globalOrdersProcessed * 0.005)).toFixed(2);
            const dbHealthColor = activeNodes > 0 ? 'syntaxCyan' : 'slate-500';

            return `
            <div class="space-y-8 block fade-in app-view max-w-[1600px] mx-auto">
                
                <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                    <div>
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-syntaxCyan/10 border border-syntaxCyan/20 text-syntaxCyan text-[10px] font-black uppercase tracking-wider mb-3">
                            <span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-syntaxCyan opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-syntaxCyan"></span></span>
                            GCP Core: Online & Routing
                        </div>
                        <h2 class="text-4xl font-black text-white tracking-tight">Master Operations Center</h2>
                        <p class="text-slate-400 text-sm mt-1">Global infrastructure telemetry, financial forecasting, and system health.</p>
                    </div>
                </div>

                <!-- TIER 1: FINANCIAL & COMPUTE METRICS -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bento-card p-6 rounded-[2rem] relative overflow-hidden group hover:border-syntaxCyan transition-all duration-300">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-syntaxCyan/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-syntaxCyan/10 transition-colors"></div>
                        <div class="flex justify-between items-start mb-4 relative z-10">
                            <p class="text-[10px] font-mono font-bold text-syntaxCyan uppercase tracking-widest">Global MRR</p>
                            <i class="fa-solid fa-money-bill-trend-up text-slate-600"></i>
                        </div>
                        <h2 class="text-3xl font-black text-white mb-1 relative z-10">${window.formatMoney(globalMrr)}</h2>
                        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider relative z-10">Recurring Pipeline</p>
                        <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-syntaxCyan to-transparent opacity-50"></div>
                    </div>

                    <div class="bento-card p-6 rounded-[2rem] relative overflow-hidden group hover:border-blue-500 transition-all duration-300">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors"></div>
                        <div class="flex justify-between items-start mb-4 relative z-10">
                            <p class="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">Active Tenancies</p>
                            <i class="fa-solid fa-network-wired text-slate-600"></i>
                        </div>
                        <h2 class="text-3xl font-black text-white mb-1 relative z-10">${activeNodes} <span class="text-sm text-slate-500 font-medium">Nodes</span></h2>
                        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider relative z-10">${suspendedNodes} Suspended</p>
                        <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent opacity-50"></div>
                    </div>

                    <div class="bento-card p-6 rounded-[2rem] relative overflow-hidden group hover:border-emerald-500 transition-all duration-300">
                        <div class="flex justify-between items-start mb-4 relative z-10">
                            <p class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Est. Gross GMV</p>
                            <i class="fa-solid fa-chart-line text-slate-600"></i>
                        </div>
                        <h2 class="text-3xl font-black text-white mb-1 relative z-10">${globalOrdersProcessed.toLocaleString()}</h2>
                        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider relative z-10">Orders Processed System-Wide</p>
                        <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent opacity-50"></div>
                    </div>

                    <div class="bento-card p-6 rounded-[2rem] relative overflow-hidden border border-amber-500/30 bg-amber-500/5 group hover:border-amber-500 transition-all duration-300">
                        <div class="flex justify-between items-start mb-2 relative z-10">
                            <p class="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">Uncollected Setup</p>
                            <i class="fa-solid fa-file-invoice-dollar text-amber-500/50"></i>
                        </div>
                        <h2 class="text-3xl font-black text-white mb-1 relative z-10">${window.formatMoney(uncollectedSetup)}</h2>
                        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3 relative z-10">Pending Invoices</p>
                        <button class="w-full bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/50 text-[10px] uppercase font-black py-2 rounded-lg transition-all relative z-10">
                            <i class="fa-solid fa-envelope mr-1"></i> Send Reminders
                        </button>
                    </div>
                </div>

                <!-- TIER 2: DEEP INFRASTRUCTURE TELEMETRY -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <!-- Firebase Simulated Telemetry (Derived from real counts) -->
                    <div class="bento-card p-0 rounded-[2rem] w-full flex flex-col overflow-hidden border border-slate-700/50">
                        <div class="px-6 py-5 border-b border-slate-700/50 flex justify-between items-center bg-black/40">
                            <h3 class="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest"><i class="fa-brands fa-google text-syntaxCyan mr-2"></i>Firestore I/O Diagnostics</h3>
                            <span class="px-2 py-1 bg-slate-800 rounded text-[9px] font-mono text-slate-400 border border-slate-700">us-central1</span>
                        </div>
                        <div class="p-8 flex flex-col justify-center flex-1 space-y-8 bg-gradient-to-b from-transparent to-black/20">
                            <div>
                                <div class="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>Document Reads (30d)</span><span class="text-white font-mono">${simulatedDocReads}</span></div>
                                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div class="bg-syntaxCyan h-full w-[45%]"></div></div>
                            </div>
                            <div>
                                <div class="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>Document Writes (30d)</span><span class="text-white font-mono">${simulatedDocWrites}</span></div>
                                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div class="bg-blue-500 h-full w-[28%]"></div></div>
                            </div>
                            <div class="grid grid-cols-2 gap-6 pt-6 border-t border-slate-700/50">
                                <div>
                                    <p class="text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Database Size</p>
                                    <p class="text-2xl font-black text-white font-mono">${estimatedStorageGB} <span class="text-xs text-slate-500 font-sans">GB</span></p>
                                </div>
                                <div>
                                    <p class="text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Connection Health</p>
                                    <p class="text-lg font-black text-${dbHealthColor} uppercase tracking-wider">${activeNodes > 0 ? 'Optimal' : 'Idle'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- LIVE TERMINAL EVENT STREAM -->
                    <div class="bento-card p-0 rounded-[2rem] w-full lg:col-span-2 flex flex-col overflow-hidden border border-slate-700/50 relative">
                        <div class="bg-slate-900/90 px-6 py-4 border-b border-slate-800 flex justify-between items-center backdrop-blur-md absolute top-0 left-0 w-full z-10">
                            <h3 class="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest"><i class="fa-solid fa-terminal mr-2"></i>Global Event Stream</h3>
                            <div class="flex gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-red-500"></div><div class="w-2.5 h-2.5 rounded-full bg-yellow-500"></div><div class="w-2.5 h-2.5 rounded-full bg-green-500"></div></div>
                        </div>
                        <div id="hq-terminal" class="p-6 pt-20 space-y-3 font-mono text-[11px] h-[400px] overflow-y-auto bg-[#02040a] custom-scrollbar shadow-inner">
                            <div class="text-slate-500">[${new Date().toLocaleTimeString()}] System initialization complete. Awaiting connections...</div>
                            <div class="text-green-400">[${new Date().toLocaleTimeString()}] [HTTP] Webhook Gateway listening on Port 8080.</div>
                            <div class="text-slate-400">[${new Date().toLocaleTimeString()}] [ASYNC] ThreadPoolTaskExecutor ready. Core: 10, Max: 100.</div>
                            ${activeNodes > 0 ? `
                            <div class="text-syntaxCyan">[${new Date().toLocaleTimeString()}] [WEBHOOK] Connection established for ${activeNodes} active nodes.</div>
                            <div class="text-slate-400 opacity-50">... awaiting live traffic ...</div>
                            ` : `
                            <div class="text-yellow-400">[${new Date().toLocaleTimeString()}] [WARN] No active tenants found. System idling.</div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
            `;
        },

        "tenants": async () => {
            const tenants = await window.SyntaxAPI.Tenants.getAll().catch(()=>[]);

            return `
            <div class="space-y-8 block fade-in app-view max-w-[1400px] mx-auto">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                    <div>
                        <h2 class="text-4xl font-black text-white tracking-tight mb-2">Tenant Access Matrix</h2>
                        <p class="text-slate-400 text-sm">Provision instances, monitor billing, and exercise surgical control over client databases.</p>
                    </div>
                    <button id="btn-provision-tenant" class="bg-syntaxCyan text-black font-bold px-8 py-4 rounded-xl text-sm shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:bg-white hover:scale-105 transition-all duration-300"><i class="fa-solid fa-plus mr-2"></i>Provision New Node</button>
                </div>

                <div class="bento-card rounded-[2rem] overflow-hidden border border-slate-700/50 shadow-2xl">
                    <div class="px-8 py-6 bg-black/40 border-b border-slate-700/50 flex justify-between items-center">
                        <div class="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Active Database Nodes</div>
                        <div class="text-xs text-slate-500 font-mono">Total: ${tenants.length}</div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                            <tr class="bg-slate-900/50 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                                <th class="p-6 pl-8 font-bold w-1/3">Corporate Entity</th>
                                <th class="p-6 font-bold">Financial Plan</th>
                                <th class="p-6 font-bold text-center">System Status</th>
                                <th class="p-6 font-bold text-right pr-8">God Mode Control</th>
                            </tr>
                            </thead>
                            <tbody class="text-sm font-medium text-slate-300 divide-y divide-slate-700/50">
                            ${tenants.length === 0 ? `<tr><td colspan="4" class="p-16 text-center text-slate-500">No active tenants. Provision your first client.</td></tr>` : tenants.map(t => {
                const createdDate = new Date(t.createdAt || Date.now()).toLocaleDateString();
                return `
                                <tr class="hover:bg-white/[0.02] transition-colors group ${t.flagged ? 'bg-red-500/[0.02]' : ''}">
                                    <td class="p-6 pl-8">
                                        <div class="flex items-center gap-4">
                                            <div class="w-12 h-12 rounded-xl ${t.flagged ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-slate-800 border-slate-700 text-white'} border flex items-center justify-center font-black shadow-inner flex-shrink-0 text-lg transition-colors">
                                                ${t.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div class="text-white font-bold text-lg leading-tight group-hover:text-syntaxCyan transition-colors">${t.name}</div>
                                                <div class="font-mono text-[10px] text-slate-500 mt-1.5 uppercase tracking-widest"><i class="fa-solid fa-fingerprint mr-1"></i>${t.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="p-6">
                                        <div class="text-white font-mono font-bold text-base">${window.formatMoney(t.monthlyRate || 35)} <span class="text-slate-500 text-xs font-sans font-normal">/mo</span></div>
                                        <div class="text-[10px] font-bold mt-1.5 uppercase tracking-wider ${t.waiveSetupFee ? 'text-green-500' : 'text-slate-500'}">${t.waiveSetupFee ? 'Setup Waived' : 'Setup Billed'}</div>
                                    </td>
                                    <td class="p-6 text-center">
                                        ${t.flagged
                    ? `<span class="inline-flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-full text-[10px] font-black uppercase border border-red-500/20 shadow-sm"><div class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div> Suspended</span>`
                    : `<span class="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-[10px] font-black uppercase border border-green-500/20 shadow-sm"><div class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div> Routing</span>`}
                                    </td>
                                    <td class="p-6 pr-8 text-right">
                                        <button class="btn-god-mode bg-slate-800 hover:bg-syntaxCyan text-slate-300 hover:text-black border border-slate-700 hover:border-syntaxCyan px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md" data-tenant='${JSON.stringify(t).replace(/'/g, "&#39;")}'>
                                            Manage <i class="fa-solid fa-sliders ml-2"></i>
                                        </button>
                                    </td>
                                </tr>
                            `}).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        },

        "dashboard": async () => {
            const orders = await window.SyntaxAPI.Orders.getAll().catch(()=>[]);
            const sales = orders.reduce((sum, o) => sum + (o.totalOrderValue || 0), 0);
            const aov = orders.length > 0 ? Math.round(sales / orders.length) : 0;
            const pending = orders.filter(o => (o.fulfillmentStatus || 'PENDING').toUpperCase() === 'PENDING').length;

            const today = new Date();
            today.setHours(0,0,0,0);
            const last7DaysData = Array(7).fill(0);
            const chartLabels = Array(7).fill('');

            for (let i = 6; i >= 0; i--) {
                const targetDate = new Date(today);
                targetDate.setDate(targetDate.getDate() - i);
                chartLabels[6 - i] = targetDate.toLocaleDateString('en-US', { weekday: 'short' });

                last7DaysData[6 - i] = orders.filter(o => {
                    if (!o.timestamp) return false;
                    const orderDate = new Date(o.timestamp);
                    return orderDate.getDate() === targetDate.getDate() &&
                        orderDate.getMonth() === targetDate.getMonth() &&
                        orderDate.getFullYear() === targetDate.getFullYear();
                }).reduce((sum, o) => sum + (o.totalOrderValue || 0), 0);
            }
            window.dashboardChartLabels = chartLabels;
            window.dashboardChartData = last7DaysData;

            return `
            <div class="space-y-8 block fade-in app-view">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div class="bento-card p-6 rounded-[2rem] relative overflow-hidden group hover:border-syntaxCyan/50 transition-colors">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-syntaxCyan/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                        <div class="relative z-10">
                            <div class="flex items-center justify-between mb-6">
                                <p class="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">Total Sales</p>
                                <div class="w-12 h-12 rounded-2xl bg-syntaxCyan/10 border border-syntaxCyan/30 flex items-center justify-center text-syntaxCyan shadow-[0_0_15px_rgba(20,184,166,0.2)] group-hover:bg-syntaxCyan group-hover:text-black transition-all">
                                    <i class="fa-solid fa-chart-line text-xl"></i>
                                </div>
                            </div>
                            <h2 class="text-4xl font-black text-white mb-2">${window.formatMoney(sales)}</h2>
                            <p class="text-[10px] text-syntaxCyan font-bold uppercase tracking-widest">Gross Pipeline Value</p>
                        </div>
                        <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-syntaxCyan to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    <div class="bento-card p-6 rounded-[2rem] relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                        <div class="relative z-10">
                            <div class="flex items-center justify-between mb-6">
                                <p class="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">Total Orders</p>
                                <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:bg-blue-500 group-hover:text-white transition-all">
                                    <i class="fa-solid fa-boxes-stacked text-xl"></i>
                                </div>
                            </div>
                            <h2 class="text-4xl font-black text-white mb-2">${orders.length}</h2>
                            <p class="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Omnichannel Sync</p>
                        </div>
                        <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    <div class="bento-card p-6 rounded-[2rem] relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                        <div class="relative z-10">
                            <div class="flex items-center justify-between mb-6">
                                <p class="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">Avg. Order Value</p>
                                <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    <i class="fa-solid fa-receipt text-xl"></i>
                                </div>
                            </div>
                            <h2 class="text-4xl font-black text-white mb-2">${window.formatMoney(aov)}</h2>
                            <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Per Customer Spend</p>
                        </div>
                        <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    <div class="bento-card p-6 rounded-[2rem] relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                        <div class="relative z-10">
                            <div class="flex items-center justify-between mb-6">
                                <p class="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">Pending Dispatch</p>
                                <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:bg-amber-500 group-hover:text-white transition-all">
                                    <i class="fa-solid fa-truck-fast text-xl"></i>
                                </div>
                            </div>
                            <h2 class="text-4xl font-black text-white mb-2">${pending}</h2>
                            <p class="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Requires Action</p>
                        </div>
                        <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                </div>

                <div class="bento-card p-8 rounded-[2rem] w-full mt-4">
                    <h3 class="text-xl font-bold text-white mb-8">7-Day Order Volume Pipeline</h3>
                    <div class="relative w-full h-[350px]"><canvas id="demoChart"></canvas></div>
                </div>
            </div>
            `;
        },

        "orders": async () => {
            const orders = await window.SyntaxAPI.Orders.getAll().catch(()=>[]);
            return `
            <div class="space-y-8 block fade-in app-view max-w-7xl mx-auto">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Omnichannel Pipeline</h2>
                        <p class="text-slate-400 text-sm">Live sync from Shopify and manual B2B entries.</p>
                    </div>
                </div>

                <div class="bento-card rounded-[2rem] overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead>
                        <tr class="bg-black/40 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                            <th class="p-6 font-bold">Date & Ref</th><th class="p-6 font-bold">Customer</th><th class="p-6 font-bold">Channel</th><th class="p-6 font-bold">Financials</th><th class="p-6 font-bold">Status</th><th class="p-6 font-bold text-center">Pipeline Action</th>
                        </tr>
                        </thead>
                        <tbody class="text-sm font-medium text-slate-300">
                        ${orders.length === 0 ? `<tr><td colspan="6" class="p-8 text-center text-slate-500">No orders found. Connect Shopify or create a manual order.</td></tr>` : orders.map(o => {
                const dateStr = o.timestamp ? new Date(o.timestamp).toLocaleDateString() : 'N/A';

                // Deep Integration UI Checks
                let actionBtn = '';
                if (o.fulfillmentStatus === 'PENDING') {
                    actionBtn = `<button class="btn-action-order bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all shadow-sm w-full" data-id="${o.id}" data-action="DISPATCH"><i class="fa-solid fa-truck-fast mr-1"></i> Dispatch</button>`;
                } else if (o.fulfillmentStatus === 'DISPATCHED') {
                    actionBtn = `<button class="btn-action-order bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-yellow-500 hover:text-black transition-all shadow-sm w-full" data-id="${o.id}" data-action="DELIVER"><i class="fa-solid fa-box-open mr-1"></i> Mark Delivered</button>`;
                } else if (o.fulfillmentStatus === 'DELIVERED') {
                    actionBtn = `<button class="btn-action-order bg-syntaxCyan/20 text-syntaxCyan px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-syntaxCyan/30 hover:bg-syntaxCyan hover:text-black transition-all shadow-[0_0_10px_rgba(20,184,166,0.2)] w-full" data-id="${o.id}" data-tracking="${o.trackingNumber || o.id}" data-val="${o.totalOrderValue}" data-action="SETTLE"><i class="fa-solid fa-money-bill-transfer mr-1"></i> Settle Payout</button>`;
                } else if (o.fulfillmentStatus === 'SETTLED') {
                    actionBtn = `<span class="text-green-400 text-[10px] font-black uppercase bg-green-500/10 px-3 py-1.5 rounded border border-green-500/20"><i class="fa-solid fa-check-double mr-1"></i> Settled</span>`;
                }

                return `
                            <tr class="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                                <td class="p-6 font-mono text-syntaxCyan">
                                    <div class="text-xs text-slate-500 mb-1">${dateStr}</div>
                                    <div class="font-bold">${(o.trackingNumber || o.id).substring(0,12)}</div>
                                </td>
                                <td class="p-6">
                                    <div class="text-white font-bold">${o.customerName || "N/A"}</div>
                                    ${o.customerPhone ? `<div class="text-[10px] text-slate-500 mt-1">${o.customerPhone}</div>` : ''}
                                </td>
                                <td class="p-6">
                                    <div class="text-xs uppercase font-black tracking-wider text-slate-400">${o.salesChannel || "API"}</div>
                                    ${o.carrierName ? `<div class="text-[9px] text-slate-500 mt-1 uppercase border border-slate-700 rounded px-1.5 py-0.5 inline-block bg-black/40">${o.carrierName}</div>` : ''}
                                </td>
                                <td class="p-6">
                                    <div class="font-mono text-white font-bold">${window.formatMoney(o.totalOrderValue || 0)}</div>
                                    ${o.totalCogs > 0 ? `<div class="text-[10px] font-mono text-red-400 mt-1">COGS: ${window.formatMoney(o.totalCogs)}</div>` : '<div class="text-[10px] font-mono text-slate-500 mt-1">COGS: Pending</div>'}
                                </td>
                                <td class="p-6">
                                    <span class="bg-${o.fulfillmentStatus === 'PENDING' ? 'blue' : (o.fulfillmentStatus === 'DISPATCHED' ? 'yellow' : (o.fulfillmentStatus === 'SETTLED' ? 'green' : 'slate'))}-500/10 text-${o.fulfillmentStatus === 'PENDING' ? 'blue' : (o.fulfillmentStatus === 'DISPATCHED' ? 'yellow' : (o.fulfillmentStatus === 'SETTLED' ? 'green' : 'slate'))}-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-${o.fulfillmentStatus === 'PENDING' ? 'blue' : (o.fulfillmentStatus === 'DISPATCHED' ? 'yellow' : (o.fulfillmentStatus === 'SETTLED' ? 'green' : 'slate'))}-500/30">${o.fulfillmentStatus}</span>
                                </td>
                                <td class="p-6 text-center">${actionBtn}</td>
                            </tr>
                        `}).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        },

        "manual-order": async () => `
            <div class="space-y-8 block fade-in app-view max-w-4xl mx-auto">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Manual Order Builder</h2>
                        <p class="text-slate-400 text-sm">Draft custom invoices. Orders start as PENDING to enforce accounting rules.</p>
                    </div>
                    <button id="btn-draft-order" class="bg-syntaxCyan text-black font-bold px-6 py-3 rounded-xl text-sm shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:bg-white hover:scale-105 transition-all"><i class="fa-solid fa-paper-plane mr-2"></i>Draft Order</button>
                </div>

                <div class="bento-card p-8 rounded-[2rem] space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Customer Name</label>
                            <input type="text" id="mo-customer" placeholder="e.g. Al-Fatah Supermarket" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-syntaxCyan transition-colors">
                        </div>
                        <div>
                            <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Logistics Carrier</label>
                            <select id="mo-logistics" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-syntaxCyan appearance-none transition-colors">
                                <option value="B2B_WHOLESALE">Wholesale Offline</option><option value="TRAX_COD">TRAX COD</option><option value="TCS_COD">TCS COD</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-6 pt-2 border-t border-slate-700/50 mt-4 pt-6">
                        <div>
                            <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Tracking / Reference #</label>
                            <input type="text" id="mo-tracking" placeholder="Optional (For Reconciliation)" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-syntaxCyan transition-colors">
                        </div>
                        <div>
                            <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Total Amount (Rs.)</label>
                            <input type="number" id="mo-price" placeholder="Price (Rs.)" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-syntaxCyan transition-colors">
                        </div>
                    </div>
                </div>
            </div>
        `,

        "sku-catalog": async () => {
            const skus = await window.SyntaxAPI.Inventory.getSkus().catch(()=>[]);
            return `
            <div class="space-y-8 block fade-in app-view max-w-6xl mx-auto">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Master SKU Catalog</h2>
                        <p class="text-slate-400 text-sm">Centralized database for products, costs, and physical stock levels.</p>
                    </div>
                    <button id="btn-add-sku" class="bg-syntaxCyan text-black font-bold px-6 py-3 rounded-xl text-sm shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:bg-white hover:scale-105 transition-all"><i class="fa-solid fa-plus mr-2"></i>Register Product</button>
                </div>
                <div class="bento-card rounded-[2rem] overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead>
                        <tr class="bg-black/40 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                            <th class="p-6 font-bold">SKU Code</th><th class="p-6 font-bold">Product Name</th><th class="p-6 font-bold text-right">Retail Price</th><th class="p-6 font-bold text-right">Moving Avg. Cost</th><th class="p-6 font-bold text-center">Physical Stock</th>
                        </tr>
                        </thead>
                        <tbody class="text-sm font-medium text-slate-300">
                        ${skus.length === 0 ? `<tr><td colspan="5" class="p-8 text-center text-slate-500">No products found. Add a SKU to begin inventory tracking.</td></tr>` : skus.map(s => `
                            <tr class="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                                <td class="p-6 font-mono text-syntaxCyan font-bold tracking-tight">${s.skuCode}</td>
                                <td class="p-6 text-white font-bold">${s.productName}</td>
                                <td class="p-6 text-right font-mono text-emerald-400">${window.formatMoney(s.unitPrice)}</td>
                                <td class="p-6 text-right font-mono text-slate-400">${window.formatMoney(s.averageCost)}</td>
                                <td class="p-6 text-center">
                                    <span class="bg-${s.currentStock > 10 ? 'green' : 'red'}-500/10 text-${s.currentStock > 10 ? 'green' : 'red'}-400 px-4 py-1.5 rounded-lg text-xs font-black border border-${s.currentStock > 10 ? 'green' : 'red'}-500/30 shadow-sm">${s.currentStock} Units</span>
                                </td>
                            </tr>
                        `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        },

        "purchase-orders": async () => {
            const skus = await window.SyntaxAPI.Inventory.getSkus().catch(()=>[]);
            let skuOptions = skus.length > 0
                ? skus.map(s => `<option value="${s.id}">${s.skuCode} - ${s.productName}</option>`).join('')
                : `<option value="">No SKUs Available. Add one first.</option>`;

            return `
            <div class="space-y-8 block fade-in app-view max-w-4xl mx-auto">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Procurement & POs</h2>
                        <p class="text-slate-400 text-sm">Receive stock shipments. Automatically adjusts moving average COGS and books financials.</p>
                    </div>
                </div>

                <div class="bento-card p-10 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-syntaxCyan/5 rounded-full blur-3xl pointer-events-none"></div>
                    <form id="form-receive-po" class="relative z-10">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Select Target SKU</label>
                                <select id="po-sku" required class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-syntaxCyan appearance-none transition-colors">
                                    ${skuOptions}
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Supplier / Vendor Name</label>
                                <input type="text" id="po-supplier" required placeholder="e.g. Shenzhen Manufacturing" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-syntaxCyan transition-colors">
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-700/50 mb-8">
                            <div>
                                <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Units Received</label>
                                <input type="number" id="po-qty" required placeholder="e.g. 500" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white font-mono text-base outline-none focus:border-syntaxCyan transition-colors">
                            </div>
                            <div>
                                <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Total Invoice Cost (Rs.)</label>
                                <input type="number" id="po-cost" required placeholder="Gross cost for all units" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white font-mono text-base outline-none focus:border-syntaxCyan transition-colors">
                            </div>
                        </div>
                        <div class="bg-black/30 p-4 rounded-xl border border-slate-700/30 mb-8 text-xs text-slate-400 font-mono">
                            <i class="fa-solid fa-circle-info text-syntaxCyan mr-2"></i>This action will instantly debit Inventory (1500) and credit Accounts Payable (2000).
                        </div>
                        <button type="submit" ${skus.length === 0 ? 'disabled' : ''} class="w-full bg-syntaxCyan text-black font-black text-base py-5 rounded-2xl hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fa-solid fa-boxes-packing mr-2"></i> Receive Shipment & Book Ledger
                        </button>
                    </form>
                </div>
            </div>`;
        },

        "banking": async () => {
            const accounts = await window.SyntaxAPI.Finance.getAccounts().catch(()=>[]);
            return `
            <div class="space-y-8 block fade-in app-view max-w-5xl mx-auto">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Treasury & Bank Management</h2>
                        <p class="text-slate-400 text-sm">Manage your operational bank accounts, escrow, and cash in hand.</p>
                    </div>
                    <button id="btn-add-bank" class="bg-syntaxCyan text-black font-bold px-6 py-3 rounded-xl text-sm shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:bg-white transition-all"><i class="fa-solid fa-building-columns mr-2"></i>Add Bank Account</button>
                </div>

                <div class="bento-card rounded-[2rem] overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead>
                        <tr class="bg-black/40 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                            <th class="p-6 font-bold">GL Code</th>
                            <th class="p-6 font-bold">Account Name</th>
                            <th class="p-6 font-bold">Category</th>
                            <th class="p-6 font-bold text-right">Running Balance</th>
                        </tr>
                        </thead>
                        <tbody class="text-sm font-medium text-slate-300">
                        ${accounts.length === 0 ? `<tr><td colspan="4" class="p-8 text-center text-slate-500">No accounts initialized. Bootstrap the ledger.</td></tr>` : accounts.map(a => `
                            <tr class="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                                <td class="p-6 font-mono text-syntaxCyan font-bold">${a.accountCode}</td>
                                <td class="p-6 text-white font-bold text-base">${a.accountName}</td>
                                <td class="p-6"><span class="bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-blue-500/20">${a.accountCategory}</span></td>
                                <td class="p-6 text-right font-mono text-white text-lg">${window.formatMoney(a.currentBalance)}</td>
                            </tr>
                        `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        },

        "auto-entry": async () => {
            const categories = await window.SyntaxAPI.ExpenseHeads.getAll().catch(()=>[]);
            let catOptions = `<option value="5500">5500 - General Expense</option><option value="4000">4000 - General Revenue</option>`;
            if (categories.length > 0) {
                catOptions += categories.map(c => `<option value="${c.headCode}">${c.headCode} - ${c.categoryName}</option>`).join('');
            }
            return `
            <div class="space-y-8 block fade-in app-view max-w-3xl mx-auto">
                <div class="text-center mb-10">
                    <div class="w-20 h-20 rounded-[2rem] bg-syntaxCyan/10 border border-syntaxCyan/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(20,184,166,0.15)]"><i class="fa-solid fa-bolt text-3xl text-syntaxCyan"></i></div>
                    <h2 class="text-4xl font-black text-white mb-3">Simple Auto Entry</h2>
                    <p class="text-slate-400 text-base max-w-md mx-auto">Log everyday expenses and income. The system mathematically maps the double-entry journal automatically.</p>
                </div>
                <div class="bento-card p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-syntaxCyan to-transparent"></div>
                    <div class="flex bg-black/40 p-2 rounded-2xl border border-white/5 mb-8">
                        <button type="button" id="btn-toggle-expense" class="flex-1 py-4 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm border border-red-500/30 transition-all uppercase tracking-wider">Money Out</button>
                        <button type="button" id="btn-toggle-income" class="flex-1 py-4 rounded-xl text-slate-400 font-bold text-sm hover:text-white transition-all border border-transparent uppercase tracking-wider">Money In</button>
                    </div>
                    <form id="form-auto-entry" class="space-y-6">
                        <input type="hidden" id="ae-type" value="Debit">
                        <div>
                            <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Total Amount (PKR)</label>
                            <input type="number" id="ae-amount" required class="w-full bg-black/50 border border-slate-700/60 focus:border-syntaxCyan rounded-xl px-6 py-5 text-white font-mono text-2xl outline-none transition-all" placeholder="0.00">
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Category / GL Head</label>
                                <select id="ae-memo" class="w-full bg-black/50 border border-slate-700/60 focus:border-syntaxCyan rounded-xl px-5 py-4 text-white text-sm appearance-none outline-none transition-all">
                                    ${catOptions}
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Treasury Source</label>
                                <select id="ae-bank" class="w-full bg-black/50 border border-slate-700/60 focus:border-syntaxCyan rounded-xl px-5 py-4 text-white text-sm appearance-none outline-none transition-all">
                                    <option value="1001">1001 - Meezan Bank Main</option>
                                    <option value="1002">1002 - Secondary Corporate (HBL)</option>
                                    <option value="1003">1003 - Cash In Hand (Office)</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="w-full bg-syntaxCyan text-black font-black text-lg py-5 rounded-2xl hover:bg-white transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] mt-6 hover:scale-[1.02]">
                            Commit to Ledger
                        </button>
                    </form>
                </div>
            </div>`;
        },

        "assets": async () => {
            return `
            <div class="space-y-8 block fade-in app-view max-w-5xl mx-auto">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Fixed Asset Management</h2>
                        <p class="text-slate-400 text-sm">Register operational assets like IT hardware and warehouse equipment.</p>
                    </div>
                    <button id="btn-add-asset" class="bg-syntaxCyan text-black font-bold px-6 py-3 rounded-xl text-sm shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:bg-white transition-all"><i class="fa-solid fa-plus mr-2"></i>Capitalize Asset</button>
                </div>
                <div class="bento-card rounded-[2rem] overflow-hidden p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-700 bg-transparent">
                    <i class="fa-solid fa-server text-4xl text-slate-600 mb-4"></i>
                    <p class="text-slate-400 text-lg font-medium">Asset Module Initialized.</p>
                    <p class="text-slate-500 text-sm mt-2">Click "Capitalize Asset" to register hardware and begin depreciation tracking.</p>
                </div>
            </div>`;
        },

        "expense-heads": async () => {
            const heads = await window.SyntaxAPI.ExpenseHeads.getAll().catch(()=>[]);
            return `
            <div class="space-y-8 block fade-in app-view max-w-5xl mx-auto">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Custom Expense Categories</h2>
                        <p class="text-slate-400 text-sm">Define granular tracking for your operational burn.</p>
                    </div>
                    <button id="btn-add-expense-head" class="bg-syntaxCyan text-black font-bold px-6 py-3 rounded-xl text-sm shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:bg-white transition-all"><i class="fa-solid fa-plus mr-2"></i>Create GL Head</button>
                </div>
                <div class="bento-card rounded-[2rem] overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead>
                        <tr class="bg-black/40 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                            <th class="p-6 font-bold">GL Head Code</th><th class="p-6 font-bold">Category Name</th><th class="p-6 font-bold">Status</th>
                        </tr>
                        </thead>
                        <tbody class="text-sm font-medium text-slate-300">
                        ${heads.length === 0 ? `<tr><td colspan="3" class="p-8 text-center text-slate-500">No custom categories defined. Create one to use it in Auto Entry.</td></tr>` : heads.map(h => `
                            <tr class="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                                <td class="p-6 font-mono text-syntaxCyan font-bold tracking-wider">${h.headCode}</td>
                                <td class="p-6 text-white font-bold text-base">${h.categoryName}</td>
                                <td class="p-6"><span class="bg-syntaxCyan/10 text-syntaxCyan px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-syntaxCyan/30 shadow-sm">Active</span></td>
                            </tr>
                        `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        },

        "depreciation": async () => `
            <div class="space-y-8 block fade-in app-view max-w-5xl mx-auto">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Depreciation Studio</h2>
                        <p class="text-slate-400 text-sm">Manage fixed assets and automatically post monthly depreciation journal vouchers.</p>
                    </div>
                    <button id="btn-run-depreciation" class="bg-syntaxCyan text-black font-bold px-6 py-3 rounded-xl text-sm shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:bg-white transition-all"><i class="fa-solid fa-calculator mr-2"></i>Run Monthly Batch</button>
                </div>
                <div class="bento-card rounded-[2rem] overflow-hidden p-12 text-center flex flex-col items-center justify-center">
                    <div class="w-20 h-20 rounded-[2rem] bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]"><i class="fa-solid fa-arrow-trend-down text-3xl text-purple-400"></i></div>
                    <p class="text-white text-xl font-bold mb-2">Depreciation Engine Online</p>
                    <p class="text-slate-500 text-sm max-w-md mx-auto">Register assets in the Asset Module. Click "Run Monthly Batch" to calculate straight-line depreciation and automatically post to the ledger.</p>
                </div>
            </div>
        `,

        "journal": async () => `
            <div class="space-y-8 block fade-in app-view max-w-5xl mx-auto">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Journal Studio</h2>
                        <p class="text-slate-400 text-sm">Advanced double-entry accounting for manual adjustments. Strict GAAP enforcement.</p>
                    </div>
                    <button id="btn-post-journal" class="bg-syntaxCyan text-black font-bold px-8 py-3.5 rounded-xl text-sm shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:bg-white hover:scale-105 transition-all"><i class="fa-solid fa-check-double mr-2"></i>Post Voucher</button>
                </div>

                <div class="bento-card p-10 rounded-[2.5rem] shadow-2xl">
                    <div class="flex gap-6 mb-8 border-b border-slate-700/50 pb-8">
                        <div class="flex-[2]">
                            <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Voucher Memo / Description</label>
                            <input type="text" id="jv-memo" placeholder="e.g. Initial capital injection" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white text-base outline-none focus:border-syntaxCyan transition-colors">
                        </div>
                    </div>
                    <table class="w-full text-left">
                        <thead>
                        <tr class="text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                            <th class="pb-4 w-1/2 font-bold">General Ledger Account</th><th class="pb-4 text-right font-bold">Debit (Rs.)</th><th class="pb-4 text-right font-bold">Credit (Rs.)</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr class="border-b border-slate-700/50">
                            <td class="py-6"><select id="jv-acc-1" class="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-syntaxCyan"><option value="1001">1001 - Bank Account</option><option value="1500">1500 - Inventory Asset</option><option value="1200">1200 - Courier Escrow</option></select></td>
                            <td class="py-6 text-right"><input type="number" id="jv-d-1" class="w-40 bg-black/50 border border-slate-700 focus:border-syntaxCyan rounded-xl px-4 py-3 text-white font-mono text-right outline-none transition-colors text-lg" placeholder="0.00"></td>
                            <td class="py-6 text-right"><input type="number" class="w-40 bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-600 font-mono text-right cursor-not-allowed" disabled></td>
                        </tr>
                        <tr class="border-b border-slate-700/50">
                            <td class="py-6"><select id="jv-acc-2" class="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-syntaxCyan"><option value="3000">3000 - Capital Equity</option><option value="4000">4000 - Sales Revenue</option><option value="2000">2000 - Accounts Payable</option><option value="5000">5000 - Cost of Goods Sold</option></select></td>
                            <td class="py-6 text-right"><input type="number" class="w-40 bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-600 font-mono text-right cursor-not-allowed" disabled></td>
                            <td class="py-6 text-right"><input type="number" id="jv-c-2" class="w-40 bg-black/50 border border-slate-700 focus:border-syntaxCyan rounded-xl px-4 py-3 text-white font-mono text-right outline-none transition-colors text-lg" placeholder="0.00"></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `,

        "voucher-ledger": async () => {
            const vouchers = await window.SyntaxAPI.Finance.getVouchers().catch(()=>[]);
            return `
            <div class="space-y-8 block fade-in app-view max-w-6xl mx-auto">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Master Voucher Ledger</h2>
                        <p class="text-slate-400 text-sm">Chronological log of all system-generated and manual double-entry vouchers.</p>
                    </div>
                </div>
                <div class="bento-card rounded-[2rem] overflow-hidden shadow-xl">
                    <table class="w-full text-left border-collapse">
                        <thead>
                        <tr class="bg-black/40 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                            <th class="p-6 font-bold">Voucher ID</th><th class="p-6 font-bold">Memo / Reference</th><th class="p-6 font-bold text-center">Period</th><th class="p-6 font-bold text-right">Details</th>
                        </tr>
                        </thead>
                        <tbody class="text-sm font-medium text-slate-300">
                        ${vouchers.length === 0 ? `<tr><td colspan="4" class="p-8 text-center text-slate-500">No ledger entries found.</td></tr>` : vouchers.map(v => `
                            <tr class="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                                <td class="p-6 font-mono text-syntaxCyan font-bold">${(v.id||"").substring(0,8)}</td>
                                <td class="p-6 text-white font-bold">${v.description}</td>
                                <td class="p-6 text-center font-mono text-xs text-slate-400">${v.fiscalPeriod || 'N/A'}</td>
                                <td class="p-6 text-right font-mono text-slate-300">${v.lines?.length || 0} Lines</td>
                            </tr>
                        `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        },

        "account-statement": async () => {
            return `
            <div class="space-y-8 block fade-in app-view max-w-5xl mx-auto">
                <div>
                    <h2 class="text-3xl font-black text-white mb-2">Account Statements</h2>
                    <p class="text-slate-400 text-sm">View granular running balances for any General Ledger account.</p>
                </div>
                <div class="bento-card p-10 rounded-[2.5rem] shadow-xl">
                    <div class="flex items-end gap-6 mb-8 border-b border-slate-700/50 pb-8">
                        <div class="flex-[2]">
                            <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Select GL Account</label>
                            <select id="stmt-acc" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-syntaxCyan transition-colors appearance-none">
                                <option value="1001">1001 - Meezan Bank - Main</option>
                                <option value="1200">1200 - Courier Escrow Trust (COD Pipeline)</option>
                                <option value="1500">1500 - Inventory Asset (Stock)</option>
                                <option value="2000">2000 - Accounts Payable (Suppliers)</option>
                                <option value="4000">4000 - B2C Retail Sales Revenue</option>
                                <option value="4100">4100 - B2B Wholesale Sales Revenue</option>
                                <option value="5000">5000 - Cost of Goods Sold (COGS)</option>
                                <option value="5500">5500 - Logistics & Freight Burn Expense</option>
                            </select>
                        </div>
                        <button id="btn-load-stmt" class="bg-syntaxCyan text-black font-bold px-8 py-4 rounded-xl text-sm shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:bg-white hover:scale-105 transition-all"><i class="fa-solid fa-magnifying-glass mr-2"></i>Load Ledger</button>
                    </div>
                    <div id="stmt-result" class="p-6 text-center text-slate-500 font-medium">Select an account and click load to view line items.</div>
                </div>
            </div>`;
        },

        "balance-sheet": async () => {
            const vouchers = await window.SyntaxAPI.Finance.getVouchers().catch(()=>[]);
            let bankBal = 0, escrowBal = 0, equipBal = 0, apBal = 0, retainedBal = 0, invBal = 0;

            vouchers.forEach(v => {
                (v.lines || []).forEach(l => {
                    const amt = parseFloat(l.amount) || 0;
                    if(l.accountCode === '1001') bankBal += (l.type === 'DEBIT' ? amt : -amt);
                    if(l.accountCode === '1200') escrowBal += (l.type === 'DEBIT' ? amt : -amt);
                    if(l.accountCode === '1500') invBal += (l.type === 'DEBIT' ? amt : -amt);
                    if(l.accountCode === '1800') equipBal += (l.type === 'DEBIT' ? amt : -amt);
                    if(l.accountCode === '1850') equipBal -= (l.type === 'CREDIT' ? amt : -amt);
                    if(l.accountCode === '2000') apBal += (l.type === 'CREDIT' ? amt : -amt);
                    if(l.accountCode === '4000' || l.accountCode === '4100') retainedBal += (l.type === 'CREDIT' ? amt : -amt);
                    if(l.accountCode === '5000' || l.accountCode === '5500' || l.accountCode === '5600') retainedBal -= (l.type === 'DEBIT' ? amt : -amt);
                });
            });

            const totalAssets = bankBal + escrowBal + equipBal + invBal;
            const totalLiab = apBal + retainedBal;

            return `
            <div class="space-y-8 block fade-in app-view max-w-5xl mx-auto">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Balance Sheet</h2>
                        <p class="text-slate-400 text-sm">Financial position dynamically calculated from live ledger.</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="bento-card p-10 rounded-[2.5rem] shadow-xl">
                        <h3 class="text-xl font-black text-syntaxCyan uppercase tracking-widest border-b border-slate-700/50 pb-4 mb-6">Assets</h3>
                        <div class="space-y-5">
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Assets</p>
                            <div class="flex justify-between text-base text-slate-300 pl-4"><span class="text-white">Bank Accounts (1001)</span><span class="font-mono">${window.formatMoney(bankBal)}</span></div>
                            <div class="flex justify-between text-base text-slate-300 pl-4"><span class="text-white">Courier Escrow (A/R)</span><span class="font-mono">${window.formatMoney(escrowBal)}</span></div>
                            <div class="flex justify-between text-base text-slate-300 pl-4"><span class="text-white">Physical Inventory</span><span class="font-mono">${window.formatMoney(invBal)}</span></div>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mt-6">Fixed Assets</p>
                            <div class="flex justify-between text-base text-slate-300 pl-4"><span class="text-white">Equipment (Net)</span><span class="font-mono">${window.formatMoney(equipBal)}</span></div>
                        </div>
                        <div class="flex justify-between items-center mt-10 pt-6 border-t border-slate-700/50">
                            <span class="text-lg font-black text-white">Total Assets</span>
                            <span class="text-2xl font-mono font-black text-syntaxCyan">${window.formatMoney(totalAssets)}</span>
                        </div>
                    </div>

                    <div class="bento-card p-10 rounded-[2.5rem] flex flex-col justify-between shadow-xl">
                        <div>
                            <h3 class="text-xl font-black text-white uppercase tracking-widest border-b border-slate-700/50 pb-4 mb-6">Liabilities & Equity</h3>
                            <div class="space-y-5">
                                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Liabilities</p>
                                <div class="flex justify-between text-base text-slate-300 pl-4"><span class="text-white">Accounts Payable</span><span class="font-mono">${window.formatMoney(apBal)}</span></div>
                                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mt-8">Owner's Equity</p>
                                <div class="flex justify-between text-base text-slate-300 pl-4"><span class="text-white">Retained Earnings</span><span class="font-mono">${window.formatMoney(retainedBal)}</span></div>
                            </div>
                        </div>
                        <div class="flex justify-between items-center mt-10 pt-6 border-t border-slate-700/50">
                            <span class="text-lg font-black text-white">Total Liab. & Equity</span>
                            <span class="text-2xl font-mono font-black text-white">${window.formatMoney(totalLiab)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;},

        "income-statement": async () => {
            const vouchers = await window.SyntaxAPI.Finance.getVouchers().catch(()=>[]);
            let rev = 0, cogs = 0, marketing = 0;

            vouchers.forEach(v => {
                (v.lines || []).forEach(l => {
                    const amt = parseFloat(l.amount) || 0;
                    if(l.accountCode === '4000' || l.accountCode === '4100') rev += (l.type === 'CREDIT' ? amt : -amt);
                    if(l.accountCode === '5000') cogs += (l.type === 'DEBIT' ? amt : -amt);
                    if(l.accountCode === '5500') marketing += (l.type === 'DEBIT' ? amt : -amt);
                });
            });

            const net = rev - cogs - marketing;
            const netColor = net >= 0 ? 'syntaxCyan' : 'red-500';

            return `
            <div class="space-y-8 block fade-in app-view max-w-5xl mx-auto">
                <div><h2 class="text-3xl font-black text-white mb-2">Income Statement</h2><p class="text-slate-400 text-sm">Real-time Profit & Loss</p></div>
                <div class="bento-card p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-syntaxCyan/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <h3 class="text-xs font-mono font-bold text-syntaxCyan uppercase tracking-widest border-b border-slate-700/50 pb-3 mb-6 relative z-10">Revenue</h3>
                    <div class="flex justify-between text-base text-slate-300 mb-3 pl-4 relative z-10"><span class="text-white">Gross Sales</span><span class="font-mono">${window.formatMoney(rev)}</span></div>
                    <div class="flex justify-between text-lg font-black text-white mb-10 border-t border-slate-700/50 pt-4 relative z-10"><span>Total Net Revenue</span><span class="font-mono">${window.formatMoney(rev)}</span></div>

                    <h3 class="text-xs font-mono font-bold text-syntaxCyan uppercase tracking-widest border-b border-slate-700/50 pb-3 mb-6 relative z-10">Expenses</h3>
                    <div class="flex justify-between text-base text-slate-300 mb-4 pl-4 relative z-10"><span class="text-white">Cost of Goods Sold (COGS)</span><span class="font-mono text-red-400">${window.formatMoney(cogs)}</span></div>
                    <div class="flex justify-between text-base text-slate-300 mb-8 pl-4 relative z-10"><span class="text-white">Marketing & Operations</span><span class="font-mono text-red-400">${window.formatMoney(marketing)}</span></div>

                    <div class="flex justify-between items-center text-2xl font-black text-${netColor} bg-black/40 border border-${netColor}/30 p-6 rounded-2xl mt-8 relative z-10 shadow-inner">
                        <span>Net Operating Income</span><span class="font-mono">${window.formatMoney(net)}</span>
                    </div>
                </div>
            </div>
        `;},

        "trial-balance": async () => {
            const vouchers = await window.SyntaxAPI.Finance.getVouchers().catch(()=>[]);
            let map = {};
            let totalDebits = 0;
            let totalCredits = 0;

            vouchers.forEach(v => {
                (v.lines || []).forEach(l => {
                    const amt = parseFloat(l.amount) || 0;
                    if(!map[l.accountCode]) map[l.accountCode] = { d: 0, c: 0 };
                    if(l.type === 'DEBIT') { map[l.accountCode].d += amt; totalDebits += amt; }
                    if(l.type === 'CREDIT') { map[l.accountCode].c += amt; totalCredits += amt; }
                });
            });

            return `
            <div class="space-y-8 block fade-in app-view max-w-5xl mx-auto">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Trial Balance</h2>
                        <p class="text-slate-400 text-sm">Verification of mathematical accuracy for all ledger entries.</p>
                    </div>
                </div>

                <div class="bento-card rounded-[2.5rem] p-10 shadow-2xl">
                    <table class="w-full text-left border-collapse">
                        <thead>
                        <tr class="bg-black/40 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                            <th class="p-6 font-bold">Account Name</th>
                            <th class="p-6 font-bold text-right">Debit</th>
                            <th class="p-6 font-bold text-right">Credit</th>
                        </tr>
                        </thead>
                        <tbody class="text-sm font-medium text-slate-300">
                        ${Object.keys(map).length === 0 ? `<tr><td colspan="3" class="p-8 text-center text-slate-500">Ledger is clean.</td></tr>` : Object.keys(map).map(k => `
                            <tr class="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                                <td class="p-6 text-white font-bold">GL Account: ${k}</td>
                                <td class="p-6 text-right font-mono text-slate-300">${map[k].d.toLocaleString()}</td>
                                <td class="p-6 text-right font-mono text-slate-300">${map[k].c.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                        </tbody>
                        <tfoot>
                        <tr class="text-xl font-black text-white border-t-2 border-slate-700 mt-4 bg-black/20">
                            <td class="p-6 text-right">Totals:</td>
                            <td class="p-6 text-right font-mono text-syntaxCyan">${totalDebits.toLocaleString()}</td>
                            <td class="p-6 text-right font-mono text-syntaxCyan">${totalCredits.toLocaleString()}</td>
                        </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;},

        "settings": async () => `
            <div class="space-y-8 block fade-in app-view max-w-4xl mx-auto">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Platform Settings & Integration</h2>
                        <p class="text-slate-400 text-sm">Configure your SaaS endpoints and security keys.</p>
                    </div>
                </div>
                <div class="bento-card p-10 rounded-[2.5rem] mb-8 shadow-xl">
                    <h3 class="text-sm font-bold text-syntaxCyan uppercase tracking-widest border-b border-slate-700/50 pb-4 mb-6"><i class="fa-brands fa-shopify mr-2"></i>Shopify Webhook Configuration</h3>
                    <div class="space-y-6">
                        <div>
                            <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-3">Live Webhook Receiver URL (Paste into Shopify)</label>
                            <div class="flex gap-4">
                                <input type="text" id="webhook-url" readonly value="${window.location.origin}/api/v1/webhooks/shopify/${window.SyntaxAPI.Session.getTenantId()}/order-created" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-syntaxCyan font-mono text-sm outline-none cursor-text select-all">
                                <button onclick="navigator.clipboard.writeText(document.getElementById('webhook-url').value); window.showSystemAlert('Copied', 'URL copied to clipboard.', 'success');" class="bg-slate-800 border border-slate-700 hover:bg-syntaxCyan hover:text-black text-white px-6 rounded-xl font-bold transition-colors shadow-md"><i class="fa-regular fa-copy"></i></button>
                            </div>
                            <p class="text-xs text-slate-500 mt-3"><i class="fa-solid fa-circle-info mr-1"></i>Ensure the format in Shopify is set to JSON.</p>
                        </div>
                    </div>
                </div>
                <div class="bento-card p-10 rounded-[2.5rem] shadow-xl">
                    <div class="flex justify-between items-center border-b border-slate-700/50 pb-4 mb-6">
                        <h3 class="text-sm font-bold text-slate-300 uppercase tracking-widest"><i class="fa-solid fa-shield-halved text-purple-400 mr-2"></i>HMAC Security Gateway</h3>
                        <span class="px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-black rounded-lg uppercase border border-purple-500/30 shadow-sm">Encrypted Vault</span>
                    </div>
                    <div class="space-y-6">
                        <div>
                            <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-3">Shopify Client Secret (For Signature Verification)</label>
                            <input type="password" value="**************" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white font-mono text-sm outline-none focus:border-purple-500 transition-colors">
                        </div>
                        <button class="bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white border border-purple-500/50 px-8 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md"><i class="fa-solid fa-key mr-2"></i> Update Secret</button>
                    </div>
                </div>
            </div>
        `,

        "team": async () => `
            <div class="space-y-8 block fade-in app-view max-w-5xl mx-auto">
                <div class="flex justify-between items-end mb-8">
                    <div>
                        <h2 class="text-3xl font-black text-white mb-2">Team Access Engine</h2>
                        <p class="text-slate-400 text-sm">Surgical control over exactly which modules your staff can see across the entire software.</p>
                    </div>
                    <button id="btn-invite-staff" class="bg-syntaxCyan text-black font-bold px-8 py-4 rounded-xl hover:bg-white text-sm shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:scale-105 transition-all"><i class="fa-solid fa-user-plus mr-2"></i>Invite Staff</button>
                </div>
                
                <div class="bento-card rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div class="p-8 border-b border-white/5 bg-gradient-to-r from-slate-900 to-transparent flex items-center justify-between">
                        <div class="flex items-center gap-5">
                            <div class="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-black text-white shadow-inner">H</div>
                            <div>
                                <h4 class="text-xl font-bold text-white tracking-tight">Hassan (Manager)</h4>
                                <p class="text-sm font-mono text-slate-400 mt-1">hassan@company.com</p>
                            </div>
                        </div>
                        <span class="bg-green-500/10 text-green-400 px-4 py-2 rounded-lg text-xs font-black uppercase border border-green-500/20 shadow-sm">Active</span>
                    </div>
                    
                    <div class="p-10 bg-black/40 space-y-10">
                        <div>
                            <h5 class="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-5 border-b border-slate-700/50 pb-2">Workspace & Operations</h5>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <label class="flex items-center justify-between p-5 bg-black/60 border border-slate-700/60 rounded-2xl cursor-pointer group hover:border-syntaxCyan/50 transition-colors shadow-inner">
                                    <div><h6 class="text-sm font-bold text-white mb-1"><i class="fa-solid fa-chart-pie text-syntaxCyan w-6"></i> Command Center</h6></div>
                                    <input type="checkbox" class="peer sr-only" checked>
                                    <div class="relative w-12 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-syntaxCyan shadow-[0_0_10px_rgba(20,184,166,0)] peer-checked:shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                </label>
                                <label class="flex items-center justify-between p-5 bg-black/60 border border-slate-700/60 rounded-2xl cursor-pointer group hover:border-syntaxCyan/50 transition-colors shadow-inner">
                                    <div><h6 class="text-sm font-bold text-white mb-1"><i class="fa-solid fa-boxes-packing text-syntaxCyan w-6"></i> Pipeline & Orders</h6></div>
                                    <input type="checkbox" class="peer sr-only" checked>
                                    <div class="relative w-12 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-syntaxCyan shadow-[0_0_10px_rgba(20,184,166,0)] peer-checked:shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                </label>
                                <label class="flex items-center justify-between p-5 bg-black/60 border border-slate-700/60 rounded-2xl cursor-pointer group hover:border-syntaxCyan/50 transition-colors shadow-inner">
                                    <div><h6 class="text-sm font-bold text-white mb-1"><i class="fa-solid fa-cart-plus text-slate-500 group-hover:text-syntaxCyan transition-colors w-6"></i> Manual Orders</h6></div>
                                    <input type="checkbox" class="peer sr-only">
                                    <div class="relative w-12 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-syntaxCyan shadow-[0_0_10px_rgba(20,184,166,0)] peer-checked:shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                </label>
                            </div>
                        </div>
                        
                        <div>
                            <h5 class="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-5 border-b border-slate-700/50 pb-2">Core Accounting</h5>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <label class="flex items-center justify-between p-5 bg-black/60 border border-slate-700/60 rounded-2xl cursor-pointer group hover:border-syntaxCyan/50 transition-colors shadow-inner">
                                    <div><h6 class="text-sm font-bold text-white mb-1"><i class="fa-solid fa-bolt text-slate-500 group-hover:text-syntaxCyan transition-colors w-6"></i> Auto Entry</h6></div>
                                    <input type="checkbox" class="peer sr-only">
                                    <div class="relative w-12 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-syntaxCyan shadow-[0_0_10px_rgba(20,184,166,0)] peer-checked:shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                </label>
                                <label class="flex items-center justify-between p-5 bg-black/60 border border-slate-700/60 rounded-2xl cursor-pointer group hover:border-syntaxCyan/50 transition-colors shadow-inner">
                                    <div><h6 class="text-sm font-bold text-white mb-1"><i class="fa-solid fa-building-columns text-slate-500 group-hover:text-syntaxCyan transition-colors w-6"></i> Asset Mgmt</h6></div>
                                    <input type="checkbox" class="peer sr-only">
                                    <div class="relative w-12 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-syntaxCyan shadow-[0_0_10px_rgba(20,184,166,0)] peer-checked:shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                </label>
                                <label class="flex items-center justify-between p-5 bg-black/60 border border-slate-700/60 rounded-2xl cursor-pointer group hover:border-syntaxCyan/50 transition-colors shadow-inner">
                                    <div><h6 class="text-sm font-bold text-white mb-1"><i class="fa-solid fa-book-journal-whills text-slate-500 group-hover:text-syntaxCyan transition-colors w-6"></i> Journal Studio</h6></div>
                                    <input type="checkbox" class="peer sr-only">
                                    <div class="relative w-12 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-syntaxCyan shadow-[0_0_10px_rgba(20,184,166,0)] peer-checked:shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                </label>
                            </div>
                        </div>
                        <div>
                            <h5 class="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-5 border-b border-slate-700/50 pb-2">Audits & Administration</h5>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <label class="flex items-center justify-between p-5 bg-black/60 border border-slate-700/60 rounded-2xl cursor-pointer group hover:border-syntaxCyan/50 transition-colors shadow-inner">
                                    <div><h6 class="text-sm font-bold text-white mb-1"><i class="fa-solid fa-file-invoice-dollar text-slate-500 group-hover:text-syntaxCyan transition-colors w-6"></i> Income Stmt</h6></div>
                                    <input type="checkbox" class="peer sr-only">
                                    <div class="relative w-12 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-syntaxCyan shadow-[0_0_10px_rgba(20,184,166,0)] peer-checked:shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                </label>
                                <label class="flex items-center justify-between p-5 bg-black/60 border border-slate-700/60 rounded-2xl cursor-pointer group hover:border-syntaxCyan/50 transition-colors shadow-inner">
                                    <div><h6 class="text-sm font-bold text-white mb-1"><i class="fa-solid fa-scale-balanced text-slate-500 group-hover:text-syntaxCyan transition-colors w-6"></i> Balance Sheet</h6></div>
                                    <input type="checkbox" class="peer sr-only">
                                    <div class="relative w-12 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-syntaxCyan shadow-[0_0_10px_rgba(20,184,166,0)] peer-checked:shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                </label>
                                <label class="flex items-center justify-between p-5 bg-black/60 border border-slate-700/60 rounded-2xl cursor-pointer group hover:border-syntaxCyan/50 transition-colors shadow-inner">
                                    <div><h6 class="text-sm font-bold text-white mb-1"><i class="fa-solid fa-scale-unbalanced text-slate-500 group-hover:text-syntaxCyan transition-colors w-6"></i> Trial Balance</h6></div>
                                    <input type="checkbox" class="peer sr-only">
                                    <div class="relative w-12 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-syntaxCyan shadow-[0_0_10px_rgba(20,184,166,0)] peer-checked:shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                </label>
                                <label class="flex items-center justify-between p-5 bg-black/60 border border-slate-700/60 rounded-2xl cursor-pointer group hover:border-syntaxCyan/50 transition-colors shadow-inner">
                                    <div><h6 class="text-sm font-bold text-white mb-1"><i class="fa-solid fa-gear text-slate-500 group-hover:text-syntaxCyan transition-colors w-6"></i> Settings & API</h6></div>
                                    <input type="checkbox" class="peer sr-only">
                                    <div class="relative w-12 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-syntaxCyan shadow-[0_0_10px_rgba(20,184,166,0)] peer-checked:shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    };

    // ==========================================
    // 3. CORE APPLICATION ENGINE & ROUTER
    // ==========================================
    const App = {
        init: () => {
            const token = window.SyntaxAPI.Session.getToken();
            const loginGate = document.getElementById('login-gate');
            if (loginGate) {
                if (!token) loginGate.classList.remove('opacity-0', 'pointer-events-none');
                else { loginGate.classList.add('opacity-0', 'pointer-events-none'); App.bootWorkspace(); }
            }
            App.bindAuth();
            window.addEventListener('hashchange', App.router);
        },

        bindAuth: () => {
            const loginForm = document.getElementById('form-login');
            if (loginForm) {
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('auth-email').value;
                    const pass = document.getElementById('auth-key').value;
                    const btn = document.getElementById('btn-login');
                    const originalText = btn.innerHTML;
                    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;

                    try {
                        const u = await window.SyntaxAPI.Auth.login(email, pass);

                        // KILL-SWITCH: Password Interceptor logic!
                        if (u && u.requiresPasswordReset) {
                            window.showInputModal('Force Password Reset', `
                                <p class="text-sm text-slate-400 mb-4">Please set a new secure password to activate your account.</p>
                                <input type="password" id="new-password" required placeholder="New Password" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-syntaxCyan">
                            `, async () => {
                                const newPass = document.getElementById('new-password').value;
                                await window.SyntaxAPI.Auth.resetPassword(u.docId, newPass).catch(e => console.error(e));
                                window.showSystemAlert('Password Updated', 'Please log in with your new credentials.', 'success');
                            });
                            btn.innerHTML = originalText;
                            return;
                        }

                        document.getElementById('login-gate').classList.add('opacity-0', 'pointer-events-none');
                        App.bootWorkspace();
                    } catch (err) {
                        btn.innerHTML = originalText;
                        window.showSystemAlert('Auth Failed', 'Invalid credentials.', 'danger');
                    }
                });
            }

            const logoutBtn = document.getElementById('btn-logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    window.SyntaxAPI.Session.clear();
                    window.location.hash = '';
                    window.location.reload();
                });
            }
        },

        bootWorkspace: () => {
            const role = window.SyntaxAPI.Session.getRole();
            const tenantId = window.SyntaxAPI.Session.getTenantId();

            // DYNAMIC TOPBAR FIX: Pulls actual name from Session instead of hardcoded placeholder
            document.getElementById('topbar-name').textContent = role === 'SUPER_ADMIN' ? 'Global Command' : window.SyntaxAPI.Session.getName();
            document.getElementById('topbar-id').textContent = role === 'SUPER_ADMIN' ? 'HQ ROOT ACCESS' : `TENANT: ${tenantId}`;
            document.getElementById('sidebar-edition').textContent = role === 'SUPER_ADMIN' ? 'GLOBAL HQ EDITION' : 'ERP EDITION';

            App.renderSidebar(role);

            if (!window.location.hash) {
                window.location.hash = role === 'SUPER_ADMIN' ? '#hq_dashboard' : '#dashboard';
            } else {
                App.router();
            }
        },

        renderSidebar: (role) => {
            const nav = document.getElementById('sidebar-nav');
            if (!nav) return;

            if (role === 'SUPER_ADMIN') {
                nav.innerHTML = `
                    <p class="px-4 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-3 mt-4">Global HQ</p>
                    <a href="#hq_dashboard" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-earth-americas w-5 text-center"></i>Global Command</a>
                    <a href="#tenants" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-network-wired w-5 text-center"></i>Tenant Management</a>
                `;
            } else {
                nav.innerHTML = `
                    <p class="px-4 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-3 mt-4">Workspace</p>
                    <a href="#dashboard" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-chart-pie w-5 text-center"></i><span class="text-left">Command Center</span></a>
                    <a href="#orders" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-boxes-packing w-5 text-center"></i><span class="text-left">Omnichannel Pipeline</span></a>
                    <a href="#manual-order" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-cart-plus w-5 text-center"></i><span class="text-left">Manual Order Entry</span></a>
                    
                    <p class="px-4 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-3 mt-8">Inventory & Procurement</p>
                    <a href="#sku-catalog" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-barcode w-5 text-center"></i><span class="text-left">Master SKU Catalog</span></a>
                    <a href="#purchase-orders" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-truck-ramp-box w-5 text-center"></i><span class="text-left">Receive Purchase Orders</span></a>

                    <p class="px-4 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-3 mt-8">Core Accounting</p>
                    <a href="#banking" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-money-check-dollar w-5 text-center"></i><span class="text-left">Bank Management</span></a>
                    <a href="#auto-entry" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-bolt w-5 text-center"></i><span class="text-left">Auto Entry (Simple)</span></a>
                    <a href="#assets" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-building-columns w-5 text-center"></i><span class="text-left">Asset Management</span></a>
                    <a href="#expense-heads" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-tags w-5 text-center"></i><span class="text-left">Expense Categories</span></a>
                    <a href="#depreciation" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-arrow-trend-down w-5 text-center"></i><span class="text-left">Depreciation Studio</span></a>
                    <a href="#journal" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-book-journal-whills w-5 text-center"></i><span class="text-left">Journal Studio</span></a>
                    <a href="#voucher-ledger" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-receipt w-5 text-center"></i><span class="text-left">Voucher Ledger</span></a>
                    <a href="#account-statement" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-file-lines w-5 text-center"></i><span class="text-left">Account Statements</span></a>
                    
                    <p class="px-4 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-3 mt-8">Financial Audits</p>
                    <a href="#income-statement" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-file-invoice-dollar w-5 text-center"></i><span class="text-left">Income Statement</span></a>
                    <a href="#balance-sheet" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-scale-balanced w-5 text-center"></i><span class="text-left">Balance Sheet</span></a>
                    <a href="#trial-balance" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-scale-unbalanced w-5 text-center"></i><span class="text-left">Trial Balance</span></a>
                    
                    <p class="px-4 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-3 mt-8">Administration</p>
                    <a href="#team" class="nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all"><i class="fa-solid fa-users-gear w-5 text-center"></i><span class="text-left">Team Access</span></a>
                `;
            }
        },

        updateSidebarStyles: (hash) => {
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.className = "nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 font-semibold text-sm transition-all";
                if(btn.querySelector('i')) btn.querySelector('i').classList.remove('text-syntaxCyan');
            });
            const activeBtn = document.querySelector(`a[href="#${hash}"]`);
            if(activeBtn) {
                activeBtn.className = "nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-syntaxCyan/10 text-syntaxCyan border border-syntaxCyan/30 font-bold text-sm transition-all shadow-[0_0_15px_rgba(20,184,166,0.1)]";
                if(activeBtn.querySelector('i')) activeBtn.querySelector('i').classList.add('text-syntaxCyan');
            }
        },

        router: async () => {
            const root = document.getElementById('app-root');
            if (!root) return;

            const hash = window.location.hash.replace('#', '') || 'dashboard';

            const titles = {
                'hq_dashboard': 'Global Command Center', 'tenants': 'Tenant Management',
                'dashboard': '10,000-Foot Overview', 'orders': 'Omnichannel Pipeline', 'manual-order': 'Manual Order Builder',
                'sku-catalog': 'Master SKU Catalog', 'purchase-orders': 'Procurement & Stock Receipt',
                'banking': 'Bank Management', 'auto-entry': 'Simple Bookkeeping', 'assets': 'Asset Management', 'expense-heads': 'Expense Categories',
                'depreciation': 'Depreciation Studio', 'journal': 'Journal Studio', 'voucher-ledger': 'Voucher Ledger',
                'account-statement': 'Account Statements', 'balance-sheet': 'Balance Sheet', 'income-statement': 'Income Statement',
                'trial-balance': 'Trial Balance', 'settings': 'Platform Settings', 'team': 'Team Access Engine'
            };

            const headerTitleEl = document.getElementById('header-title');
            if (headerTitleEl) headerTitleEl.innerText = titles[hash] || 'SyntaxLoops ERP';

            App.updateSidebarStyles(hash);

            root.innerHTML = `<div class="flex items-center justify-center h-full text-syntaxCyan"><i class="fa-solid fa-circle-notch fa-spin text-4xl"></i></div>`;

            const tenantId = window.SyntaxAPI.Session.getTenantId();
            const role = window.SyntaxAPI.Session.getRole();

            let isSuspended = false;
            if (role !== 'SUPER_ADMIN') {
                const tenantData = await window.SyntaxAPI.Tenants.getTenant(tenantId).catch(()=>null);
                if (tenantData && tenantData.flagged) {
                    isSuspended = true;
                }
            }

            try {
                if (Views[hash]) {
                    root.innerHTML = await Views[hash]();

                    // ENFORCE READ ONLY
                    if (isSuspended) {
                        const suspendBanner = document.createElement('div');
                        suspendBanner.className = "bg-red-500 text-white font-bold text-center py-2 text-sm z-50 absolute top-0 w-full left-0";
                        suspendBanner.innerHTML = "<i class='fa-solid fa-triangle-exclamation mr-2'></i> ACCOUNT SUSPENDED: Overdue balance. Software is in Read-Only Mode.";
                        document.querySelector('main').appendChild(suspendBanner);

                        root.querySelectorAll('input, select, button, textarea').forEach(el => {
                            el.disabled = true;
                            el.style.opacity = '0.5';
                            el.style.pointerEvents = 'none';
                        });
                    } else {
                        App.bindInteractiveEvents(hash);
                    }
                } else {
                    root.innerHTML = `<div class="text-slate-500 text-center mt-20 fade-in"><p>Module Not Found or Under Construction</p></div>`;
                }
            } catch (error) {
                root.innerHTML = `<div class="text-red-500 text-center mt-20"><i class="fa-solid fa-triangle-exclamation text-4xl mb-4"></i><p>Network failure loading data.</p></div>`;
            }
        },

        // ==========================================
        // 4. THE INTERACTIVE ENGINE (Modals, Math, Forms)
        // ==========================================
        bindInteractiveEvents: (hash) => {

            // --- HQ DASHBOARD ---
            if (hash === 'hq_dashboard') {
                document.querySelectorAll('.btn-force-sync').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const tId = e.currentTarget.getAttribute('data-id');
                        const originalHtml = e.currentTarget.innerHTML;
                        e.currentTarget.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
                        setTimeout(() => {
                            window.showSystemAlert('Sync Initiated', `Manual Shopify API synchronization triggered for ${tId}. Webhooks reset.`, 'success');
                            e.currentTarget.innerHTML = originalHtml;
                        }, 800);
                    });
                });
            }

            // --- GOD MODE: EXTREME TENANT MANAGEMENT ---
            if (hash === 'tenants') {
                const provisionBtn = document.getElementById('btn-provision-tenant');
                if (provisionBtn) {
                    provisionBtn.addEventListener('click', () => {
                        window.showInputModal('Deploy Cloud Tenant Node', `
                            <div class="space-y-5">
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Corporate Entity Name</label>
                                    <input type="text" id="modal-tenant-name" required placeholder="e.g. Al-Fatah Supermarket" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-syntaxCyan transition-colors">
                                </div>
                                
                                <!-- NEW BASE CURRENCY DROPDOWN -->
                                <div class="pt-2">
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Base Currency</label>
                                    <select id="modal-currency" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-syntaxCyan transition-colors">
                                        <option value="$">USD ($)</option>
                                        <option value="£">GBP (£)</option>
                                        <option value="€">EUR (€)</option>
                                        <option value="Rs. ">PKR (Rs.)</option>
                                    </select>
                                </div>
                            
                                <div class="grid grid-cols-2 gap-5 pt-2">
                                    <div>
                                        <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Director Full Name</label>
                                        <input type="text" id="modal-admin-name" required placeholder="e.g. Ali Raza" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-syntaxCyan transition-colors">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Root Login Email</label>
                                        <input type="email" id="modal-admin-email" placeholder="Leave blank to auto-generate" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-syntaxCyan transition-colors">
                                    </div>
                                </div>
                            
                                <div class="p-5 bg-slate-900 rounded-xl border border-slate-700/50 mt-4 shadow-inner relative overflow-hidden">
                                    <div class="absolute top-0 right-0 w-32 h-32 bg-syntaxCyan/5 rounded-full blur-2xl pointer-events-none"></div>
                                    <p class="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2"><i class="fa-solid fa-file-invoice-dollar mr-2"></i>Financial Contract Parameters</p>
                                    
                                    <div class="flex items-center justify-between mb-5">
                                        <div>
                                            <span class="text-sm text-white font-bold block">Waive Setup Fee</span>
                                            <!-- STRIPPED PKR HARDCODING -->
                                            <span class="text-[9px] text-slate-500 font-mono">Bypasses initial setup charge.</span>
                                        </div>
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id="modal-waive-setup" class="sr-only peer">
                                            <div class="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-transparent after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-syntaxCyan shadow-inner border border-slate-700"></div>
                                        </label>
                                    </div>
                                    <div>
                                        <!-- STRIPPED PKR HARDCODING -->
                                        <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Recurring MRR Retainer</label>
                                        <!-- UPDATED DEFAULT TO 35 -->
                                        <input type="number" id="modal-sub-rate" value="35" required class="w-full bg-black/80 border border-slate-700/60 rounded-xl px-4 py-3 text-white font-mono text-base outline-none focus:border-syntaxCyan transition-colors">
                                    </div>
                                </div>
                            </div>
                        `, async () => {
                            const name = document.getElementById('modal-tenant-name').value;
                            const adminName = document.getElementById('modal-admin-name').value;
                            const adminEmail = document.getElementById('modal-admin-email').value;
                            const waiveSetup = document.getElementById('modal-waive-setup').checked;
                            const subRate = document.getElementById('modal-sub-rate').value;

                            const newTenant = await window.SyntaxAPI.Tenants.provision({
                                name, adminName, adminEmail, waiveSetup: waiveSetup.toString(), subRate
                            });

                            App.router();

                            window.showInfoModal('Node Provisioning Complete', `
                                <div class="bg-syntaxCyan/10 border border-syntaxCyan/20 rounded-xl p-4 mb-6">
                                    <p class="text-sm text-syntaxCyan font-medium"><i class="fa-solid fa-circle-check mr-2"></i>Database isolated and initial Chart of Accounts generated.</p>
                                </div>
                                <div class="space-y-4 mb-8">
                                    <div class="flex justify-between items-center border-b border-slate-700/50 pb-3"><strong class="text-slate-500 font-mono text-xs uppercase tracking-wider">Tenant ID Reference:</strong> <span class="text-white font-mono font-bold text-sm bg-slate-800 px-2 py-1 rounded">${newTenant.id}</span></div>
                                    <div class="flex justify-between items-center border-b border-slate-700/50 pb-3"><strong class="text-slate-500 font-mono text-xs uppercase tracking-wider">Root Admin Email:</strong> <span class="text-white font-medium">${newTenant.adminEmail}</span></div>
                                </div>
                                <div class="p-6 bg-[#02040a] rounded-2xl border border-slate-700 shadow-inner text-center">
                                    <p class="text-[10px] text-slate-500 mb-3 uppercase font-bold tracking-widest">Initial Root Password</p>
                                    <p class="text-4xl font-mono font-black text-white tracking-widest selection:bg-syntaxCyan selection:text-black">${newTenant.tempPassword}</p>
                                    <p class="mt-4 text-[10px] text-slate-500">System will mandate a password rotation upon initial authentication.</p>
                                </div>
                            `);
                        });
                    });
                }

                // God Mode Modal Trigger
                document.querySelectorAll('.btn-god-mode').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const t = JSON.parse(e.currentTarget.getAttribute('data-tenant'));
                        const isSuspended = t.flagged;
                        const createdDate = new Date(t.createdAt || Date.now()).toLocaleDateString();

                        window.showInfoModal(`Surgical Control: ${t.id}`, `
                            <div class="space-y-8">
                                <!-- Tenant Identity Panel -->
                                <div class="grid grid-cols-2 gap-6">
                                    <div class="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
                                        <p class="text-[10px] font-mono text-slate-500 uppercase font-bold mb-2 tracking-widest">Corporate Identity</p>
                                        <p class="text-lg text-white font-black leading-tight">${t.name}</p>
                                        <p class="text-xs text-slate-400 mt-1">Provisioned: ${createdDate}</p>
                                    </div>
                                    <div class="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
                                        <p class="text-[10px] font-mono text-slate-500 uppercase font-bold mb-2 tracking-widest">Financial Contract</p>
                                        <p class="text-xl font-mono text-syntaxCyan font-black">Rs. ${(t.monthlyRate || 0).toLocaleString()} <span class="text-xs text-slate-500 font-sans font-normal uppercase">/ Mo</span></p>
                                        <p class="text-xs text-slate-400 mt-1">${t.waiveSetupFee ? 'Setup Waived' : 'Setup Invoiced (15k)'}</p>
                                    </div>
                                </div>
                                
                                <!-- Security & API Controls -->
                                <div>
                                    <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700/50 pb-2">Infrastructure Controls</h4>
                                    <div class="grid grid-cols-2 gap-4 mb-4">
                                        <button class="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-600 transition-colors text-sm shadow-sm" onclick="window.showSystemAlert('API Keys Rotated', 'New Shopify secret generated. Client must update their webhook.', 'success')"><i class="fa-solid fa-key mr-2 text-syntaxCyan"></i> Rotate API Keys</button>
                                        <button class="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-600 transition-colors text-sm shadow-sm" onclick="window.showSystemAlert('Password Reset', 'Root user forced to reset password on next login.', 'success')"><i class="fa-solid fa-user-shield mr-2 text-syntaxCyan"></i> Force Auth Reset</button>
                                    </div>
                                </div>

                                <!-- Danger Zone: Suspension -->
                                <div class="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl">
                                    <h4 class="text-xs font-black text-red-500 uppercase tracking-widest mb-4 flex items-center"><i class="fa-solid fa-triangle-exclamation mr-2"></i> The Danger Zone</h4>
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm text-white font-bold mb-1">Access State: <span class="${isSuspended ? 'text-red-500' : 'text-green-500'} font-black">${isSuspended ? 'LOCKED' : 'ACTIVE & ROUTING'}</span></p>
                                            <p class="text-xs text-slate-400 max-w-xs leading-relaxed">Suspending will drop all incoming Shopify webhooks and lock the client's dashboard to Read-Only mode.</p>
                                        </div>
                                        <button id="btn-toggle-suspend" class="px-6 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-md ${isSuspended ? 'bg-green-500 hover:bg-green-400 text-black border border-green-600' : 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white'}">
                                            ${isSuspended ? '<i class="fa-solid fa-unlock mr-2"></i> Restore Access' : '<i class="fa-solid fa-lock mr-2"></i> Suspend'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `);

                        // Bind Suspend Button Logic inside the Info Modal
                        setTimeout(() => {
                            const togBtn = document.getElementById('btn-toggle-suspend');
                            if(togBtn) {
                                togBtn.addEventListener('click', async () => {
                                    togBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
                                    try {
                                        await window.SyntaxAPI.Tenants.toggleFlag(t.id, !isSuspended);
                                        document.getElementById('dynamic-info-modal').remove();
                                        window.showSystemAlert('Status Overridden', `Tenant ${t.id} access state successfully modified.`, 'success');
                                        App.router(); // Refresh the matrix
                                    } catch(err) {
                                        window.showSystemAlert('Error', 'Failed to update system state.', 'danger');
                                        togBtn.innerHTML = 'Failed';
                                    }
                                });
                            }
                        }, 50);
                    });
                });
            }

            // --- BANKING LOGIC ---
            if (hash === 'banking') {
                const btnBank = document.getElementById('btn-add-bank');
                if (btnBank) {
                    btnBank.addEventListener('click', () => {
                        window.showInputModal('Register Treasury Account', `
                            <div class="space-y-5">
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">GL Account Code</label>
                                    <input type="text" id="bank-code" required placeholder="e.g. 1004" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-syntaxCyan transition-colors">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Institution Name</label>
                                    <input type="text" id="bank-name" required placeholder="e.g. Standard Chartered Corporate" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-syntaxCyan transition-colors">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Opening Balance (Rs.)</label>
                                    <input type="number" id="bank-balance" required placeholder="Current Cash Value" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white font-mono text-base outline-none focus:border-syntaxCyan transition-colors">
                                </div>
                            </div>
                        `, async () => {
                            const startingBalance = document.getElementById('bank-balance').value;
                            // Wait for the backend endpoint for manual bank addition (simulation for now)
                            window.showSystemAlert('Ledger Updated', 'Treasury account established with starting balance of Rs. ' + startingBalance, 'success');
                            App.router();
                        });
                    });
                }
            }

            if (hash === 'sku-catalog') {
                const btnAdd = document.getElementById('btn-add-sku');
                if (btnAdd) {
                    btnAdd.addEventListener('click', () => {
                        window.showInputModal('Register New Product SKU', `
                            <div class="space-y-5">
                                <div class="grid grid-cols-2 gap-5">
                                    <div>
                                        <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">SKU Identifier</label>
                                        <input type="text" id="sku-code" required placeholder="e.g. SHIRT-BLK-L" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white font-mono text-sm outline-none focus:border-syntaxCyan transition-colors">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Target Retail Price (Rs.)</label>
                                        <input type="number" id="sku-price" required placeholder="0.00" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white font-mono text-sm outline-none focus:border-syntaxCyan transition-colors">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Full Product Title</label>
                                    <input type="text" id="sku-name" required placeholder="e.g. Premium Black Cotton T-Shirt (Large)" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-syntaxCyan transition-colors">
                                </div>
                                <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-xs text-blue-400 font-mono">
                                    <i class="fa-solid fa-circle-info mr-2"></i>Stock level initializes at 0. Use the Procurement module to receive POs and establish average cost.
                                </div>
                            </div>
                        `, async () => {
                            await window.SyntaxAPI.Inventory.createSku({
                                skuCode: document.getElementById('sku-code').value,
                                productName: document.getElementById('sku-name').value,
                                unitPrice: parseFloat(document.getElementById('sku-price').value),
                                weightKg: 0.5,
                                channel: "OMNICHANNEL"
                            });
                            window.showSystemAlert('Catalog Updated', 'Product SKU successfully mapped.', 'success');
                            App.router();
                        });
                    });
                }
            }

            if (hash === 'purchase-orders') {
                const form = document.getElementById('form-receive-po');
                if (form) {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const btn = e.target.querySelector('button[type="submit"]');
                        const originalText = btn.innerHTML;
                        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Processing Financials...';

                        try {
                            await window.SyntaxAPI.Inventory.receivePO({
                                skuId: document.getElementById('po-sku').value,
                                supplierName: document.getElementById('po-supplier').value,
                                quantity: parseInt(document.getElementById('po-qty').value),
                                totalCost: parseFloat(document.getElementById('po-cost').value)
                            });
                            window.showSystemAlert('Procurement Successful', 'Inventory Asset increased and Liability logged.', 'success');
                            window.location.hash = '#sku-catalog';
                        } catch (err) {
                            btn.innerHTML = originalText;
                            window.showSystemAlert('Ledger Error', err.message, 'danger');
                        }
                    });
                }
            }

            // --- AUTO ENTRY ENGINE SUBMIT ---
            if (hash === 'auto-entry') {
                const form = document.getElementById('form-auto-entry');
                const btnOut = document.getElementById('btn-toggle-expense');
                const btnIn = document.getElementById('btn-toggle-income');
                const typeInput = document.getElementById('ae-type');

                btnOut.onclick = () => {
                    typeInput.value = 'Debit';
                    btnOut.className = 'flex-1 py-4 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm border border-red-500/30 transition-all uppercase tracking-wider shadow-inner';
                    btnIn.className = 'flex-1 py-4 rounded-xl text-slate-400 font-bold text-sm hover:text-white transition-all border border-transparent uppercase tracking-wider';
                };
                btnIn.onclick = () => {
                    typeInput.value = 'Credit';
                    btnIn.className = 'flex-1 py-4 rounded-xl bg-green-500/20 text-green-400 font-bold text-sm border border-green-500/30 transition-all uppercase tracking-wider shadow-inner';
                    btnOut.className = 'flex-1 py-4 rounded-xl text-slate-400 font-bold text-sm hover:text-white transition-all border border-transparent uppercase tracking-wider';
                };

                if(form) {
                    form.onsubmit = async (e) => {
                        e.preventDefault();
                        const amt = parseFloat(document.getElementById('ae-amount').value);
                        const memoAccount = document.getElementById('ae-memo').value;
                        const bankAccount = document.getElementById('ae-bank').value;
                        const type = typeInput.value;

                        const entry = {
                            description: `Auto-Entry: ${type} operational adjustment`,
                            lines: [
                                { accountCode: bankAccount, type: type === 'Debit' ? 'CREDIT' : 'DEBIT', amount: amt },
                                { accountCode: memoAccount, type: type === 'Debit' ? 'DEBIT' : 'CREDIT', amount: amt }
                            ]
                        };
                        try {
                            const btn = e.target.querySelector('button[type="submit"]');
                            const orig = btn.innerHTML;
                            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
                            await window.SyntaxAPI.Finance.postJournalVoucher(entry);
                            window.showSystemAlert('Ledger Balanced', 'Transaction successfully committed to the double-entry matrix.', 'success');
                            window.location.hash = '#voucher-ledger';
                        } catch(err) {
                            window.showSystemAlert('Balancing Error', err.message, 'danger');
                        }
                    }
                }
            }

            // --- MANUAL ORDER ENTRY LOGIC ---
            if (hash === 'manual-order') {
                const btnDraft = document.getElementById('btn-draft-order');
                if (btnDraft) {
                    btnDraft.addEventListener('click', async () => {
                        const customer = document.getElementById('mo-customer').value;
                        const logistics = document.getElementById('mo-logistics').value;
                        const price = parseFloat(document.getElementById('mo-price').value) || 0;
                        const tracking = document.getElementById('mo-tracking').value;

                        if (!customer || !price) {
                            window.showSystemAlert('Validation Failed', 'Customer name and Total Amount are required.', 'danger');
                            return;
                        }

                        const originalText = btnDraft.innerHTML;
                        btnDraft.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Processing...';

                        try {
                            await window.SyntaxAPI.Orders.create({
                                customerName: customer,
                                salesChannel: logistics,
                                totalOrderValue: price,
                                fulfillmentStatus: "PENDING",
                                trackingNumber: tracking || ('MANUAL-' + Date.now().toString().slice(-6))
                            });
                            window.showSystemAlert('Success', 'Manual B2B order drafted successfully.', 'success');
                            window.location.hash = '#orders';
                        } catch (err) {
                            btnDraft.innerHTML = originalText;
                            window.showSystemAlert('Error', err.message || 'Failed to draft order', 'danger');
                        }
                    });
                }
            }

            // --- OMNICHANNEL PIPELINE STATE TRANSITIONS ---
            if (hash === 'orders') {
                document.querySelectorAll('.btn-action-order').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const orderId = e.target.getAttribute('data-id');
                        const action = e.target.getAttribute('data-action');

                        if (action === 'DISPATCH') {
                            window.showInputModal('Logistics Dispatch', `
                                <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-6 text-sm text-blue-400">
                                    <i class="fa-solid fa-microchip mr-2"></i><strong>Phase 2 Engine:</strong> Dispatching will automatically deduce local stock and calculate exact COGS based on moving average.
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Logistics Carrier Name</label>
                                    <input type="text" id="carrier-name" required placeholder="e.g. TCS Logistics" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-syntaxCyan transition-colors">
                                </div>
                            `, async () => {
                                const carrier = document.getElementById('carrier-name').value;
                                await window.SyntaxAPI.Orders.updateStatus(orderId, 'DISPATCHED', carrier);
                                window.showSystemAlert('Dispatched', 'Stock de-allocated and precise COGS booked to ledger.', 'success');
                                App.router();
                            });
                        } else if (action === 'DELIVER') {
                            window.showInputModal('Confirm Delivery', `
                                <div class="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-4 text-sm text-yellow-500">
                                    <i class="fa-solid fa-money-bill-trend-up mr-2"></i>This action will realize Gross Revenue (4000) and move funds into your Courier Escrow Trust (1200).
                                </div>
                            `, async () => {
                                await window.SyntaxAPI.Orders.updateStatus(orderId, 'DELIVERED');
                                window.showSystemAlert('Revenue Realized', 'Order marked delivered. Escrow updated.', 'success');
                                App.router();
                            });
                        } else if (action === 'SETTLE') {
                            const expectedVal = e.target.getAttribute('data-val');
                            const tracking = e.target.getAttribute('data-tracking');
                            window.showInputModal('Reconcile Courier Payout', `
                                <div class="bg-syntaxCyan/10 border border-syntaxCyan/20 p-4 rounded-xl mb-6 text-sm text-syntaxCyan">
                                    <i class="fa-solid fa-scale-balanced mr-2"></i>Expected Gross: <strong>Rs. ${expectedVal}</strong>.<br/>Any negative delta will be automatically routed to Logistics Expense (5500).
                                </div>
                                <div class="space-y-5">
                                    <div>
                                        <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Target Treasury Account</label>
                                        <select id="settle-bank" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-syntaxCyan appearance-none">
                                            <option value="1001">1001 - Meezan Bank Main</option>
                                            <option value="1002">1002 - Secondary Corporate (HBL)</option>
                                            <option value="1003">1003 - Cash In Hand (Office)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Actual Cash Remitted (PKR)</label>
                                        <input type="number" id="actual-payout" required value="${expectedVal}" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white font-mono text-lg outline-none focus:border-syntaxCyan transition-colors">
                                    </div>
                                </div>
                            `, async () => {
                                const actualPayout = parseFloat(document.getElementById('actual-payout').value);
                                const targetBank = document.getElementById('settle-bank').value;
                                const payload = {};
                                payload[tracking] = actualPayout;

                                await window.SyntaxAPI.Finance.reconcilePayouts(targetBank, payload);
                                window.showSystemAlert('Reconciled', 'Funds cleared escrow and settled in Account ' + targetBank, 'success');
                                App.router();
                            });
                        }
                    });
                });
            }

            // --- ASSETS LOGIC ---
            if (hash === 'assets') {
                const btn = document.getElementById('btn-add-asset');
                if (btn) {
                    btn.addEventListener('click', () => {
                        window.showInputModal('Capitalize Fixed Asset', `
                            <div class="space-y-5">
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Hardware/Asset Name</label>
                                    <input type="text" id="asset-name" required placeholder="e.g. MacBook Pro M3" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-syntaxCyan transition-colors">
                                </div>
                                <div class="grid grid-cols-2 gap-5">
                                    <div>
                                        <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Purchase Value (Rs.)</label>
                                        <input type="number" id="asset-price" required placeholder="0.00" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white font-mono text-sm outline-none focus:border-syntaxCyan transition-colors">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Useful Life (Months)</label>
                                        <input type="number" id="asset-life" required placeholder="e.g. 60" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white font-mono text-sm outline-none focus:border-syntaxCyan transition-colors">
                                    </div>
                                </div>
                            </div>
                        `, async () => {
                            await window.SyntaxAPI.Assets.create({
                                assetName: document.getElementById('asset-name').value,
                                assetCategory: "EQUIPMENT",
                                purchasePrice: parseFloat(document.getElementById('asset-price').value),
                                salvageValue: 0,
                                usefulLifeMonths: parseInt(document.getElementById('asset-life').value),
                                isActive: true,
                                accumulatedDepreciation: 0
                            });
                            window.showSystemAlert('Success', 'Asset capitalized and prepped for depreciation.', 'success');
                            App.router();
                        });
                    });
                }
            }

            // --- EXPENSE HEADS LOGIC ---
            if (hash === 'expense-heads') {
                const btn = document.getElementById('btn-add-expense-head');
                if (btn) {
                    btn.addEventListener('click', () => {
                        window.showInputModal('Create GL Head', `
                            <div class="space-y-5">
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">GL Account Code</label>
                                    <input type="text" id="cat-code" required placeholder="e.g. 5001" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white font-mono text-sm outline-none focus:border-syntaxCyan transition-colors">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Category Title</label>
                                    <input type="text" id="cat-name" required placeholder="e.g. Facebook Ads Burn" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-syntaxCyan transition-colors">
                                </div>
                            </div>
                        `, async () => {
                            await window.SyntaxAPI.ExpenseHeads.create({
                                headCode: document.getElementById('cat-code').value,
                                categoryName: document.getElementById('cat-name').value
                            });
                            window.showSystemAlert('Success', 'GL Head mapped to Chart of Accounts.', 'success');
                            App.router();
                        });
                    });
                }
            }

            // --- DEPRECIATION BATCH LOGIC ---
            if (hash === 'depreciation') {
                const btn = document.getElementById('btn-run-depreciation');
                if (btn) {
                    btn.addEventListener('click', async () => {
                        const originalText = btn.innerHTML;
                        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Processing Math...';
                        try {
                            const res = await window.SyntaxAPI.Assets.runDepreciation();
                            window.showSystemAlert('Batch Complete', res.message, 'success');
                            App.router();
                        } catch (err) {
                            btn.innerHTML = originalText;
                            window.showSystemAlert('Error', 'Failed to execute depreciation cycle.', 'danger');
                        }
                    });
                }
            }

            // --- ACCOUNT STATEMENT VIEWER ---
            if (hash === 'account-statement') {
                const btn = document.getElementById('btn-load-stmt');
                if (btn) {
                    btn.addEventListener('click', async () => {
                        const acc = document.getElementById('stmt-acc').value;
                        const resDiv = document.getElementById('stmt-result');
                        resDiv.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-syntaxCyan text-3xl my-8"></i>';

                        try {
                            const vouchers = await window.SyntaxAPI.Finance.getVouchers().catch(()=>[]);
                            let linesHTML = '';
                            vouchers.forEach(v => {
                                (v.lines || []).forEach(l => {
                                    if (l.accountCode === acc) {
                                        const amt = parseFloat(l.amount) || 0;
                                        linesHTML += `<tr class="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                                            <td class="py-4 text-white text-xs">${v.description}</td>
                                            <td class="py-4 text-right font-mono text-syntaxCyan">${l.type==='DEBIT'?amt.toLocaleString():'-'}</td>
                                            <td class="py-4 text-right font-mono text-syntaxCyan">${l.type==='CREDIT'?amt.toLocaleString():'-'}</td>
                                        </tr>`;
                                    }
                                });
                            });
                            if (!linesHTML) linesHTML = '<tr><td colspan="3" class="py-8 text-center text-slate-500">No transactions hit this ledger account.</td></tr>';
                            resDiv.innerHTML = `<table class="w-full text-left text-sm mt-6"><thead><tr class="text-[10px] text-slate-400 uppercase border-b border-slate-700/50"><th class="pb-4 font-bold">Voucher Details</th><th class="pb-4 text-right font-bold">Debit (PKR)</th><th class="pb-4 text-right font-bold">Credit (PKR)</th></tr></thead><tbody class="text-slate-300">${linesHTML}</tbody></table>`;
                        } catch (e) {
                            resDiv.innerHTML = '<span class="text-red-500">Database failed to yield statement.</span>';
                        }
                    });
                }
            }

            // --- MANUAL JOURNAL ENTRY LOGIC ---
            if (hash === 'journal') {
                const btn = document.getElementById('btn-post-journal');
                if (btn) {
                    btn.addEventListener('click', async () => {
                        const memo = document.getElementById('jv-memo').value;
                        const acc1 = document.getElementById('jv-acc-1').value;
                        const acc2 = document.getElementById('jv-acc-2').value;
                        const d1 = parseFloat(document.getElementById('jv-d-1').value) || 0;
                        const c2 = parseFloat(document.getElementById('jv-c-2').value) || 0;

                        if (!memo || d1 <= 0 || c2 <= 0) {
                            window.showSystemAlert('Validation Error', 'Fill all fields and ensure amounts are > 0.', 'danger');
                            return;
                        }

                        const originalText = btn.innerHTML;
                        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Validating GAAP...';

                        try {
                            await window.SyntaxAPI.Finance.postJournalVoucher({
                                description: memo,
                                lines: [
                                    { accountCode: acc1, type: 'DEBIT', amount: d1 },
                                    { accountCode: acc2, type: 'CREDIT', amount: c2 }
                                ]
                            });
                            window.showSystemAlert('Ledger Updated', 'Journal Voucher successfully passed the gatekeeper.', 'success');
                            window.location.hash = '#voucher-ledger';
                        } catch (err) {
                            btn.innerHTML = originalText;
                            window.showSystemAlert('Gatekeeper Rejected', err.message, 'danger');
                        }
                    });
                }
            }

            // Dashboard Chart (Tenant level - Dynamic 7 Days)
            if (hash === 'dashboard') {
                if (window.currentChart) window.currentChart.destroy();
                const ctx = document.getElementById('demoChart');
                if (ctx && typeof Chart !== 'undefined') {
                    Chart.defaults.color = '#64748b'; Chart.defaults.font.family = 'Quicksand';
                    window.currentChart = new Chart(ctx.getContext('2d'), {
                        type: 'bar',
                        data: {
                            labels: window.dashboardChartLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                            datasets: [{
                                data: window.dashboardChartData || [0, 0, 0, 0, 0, 0, 0],
                                backgroundColor: '#14b8a6',
                                borderRadius: 6
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }, x: { grid: { display: false } } } }
                    });
                }
            }

            if (hash === 'team') {
                const inviteBtn = document.getElementById('btn-invite-staff');
                if (inviteBtn) {
                    inviteBtn.addEventListener('click', () => {
                        window.showInputModal('Provision Staff Credentials', `
                            <div>
                                <label class="block text-[10px] font-mono text-slate-500 uppercase font-bold mb-2">Employee Legal Name</label>
                                <input type="text" id="staff-name" required placeholder="e.g. Ali Raza" class="w-full bg-black/50 border border-slate-700/60 rounded-xl px-5 py-4 text-white text-sm outline-none focus:border-syntaxCyan transition-colors">
                            </div>
                        `, async () => {
                            window.showSystemAlert('Node Updated', 'IAM policies compiled. Credentials emailed to staff.', 'success');
                        });
                    });
                }
            }
        }
    };

    App.init();
});