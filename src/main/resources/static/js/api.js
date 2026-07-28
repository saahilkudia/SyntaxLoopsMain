window.SyntaxAPI = (function () {
    const USE_REAL_BACKEND = true;

    // Dynamic BASE_URL: Automatically detects production domain and routes API calls to api.syntaxloops.com
    const isProduction = window.location.hostname.endsWith('syntaxloops.com');
    const BASE_URL = isProduction
        ? 'https://api.syntaxloops.com/api'
        : window.location.origin + '/api';

    const Session = {
        save: (u) => {
            localStorage.setItem('sl_token', u.token || 'jwt_dummy');
            localStorage.setItem('sl_tenant', u.tenantId);
            localStorage.setItem('sl_role', u.role);
            localStorage.setItem('sl_name', u.name);
        },
        clear: () => localStorage.clear(),
        getToken: () => localStorage.getItem('sl_token'),
        getTenantId: () => localStorage.getItem('sl_tenant'),
        getRole: () => localStorage.getItem('sl_role'),
        getName: () => localStorage.getItem('sl_name')
    };

    async function fetchAPI(endpoint, method = 'GET', body = null) {
        if (!USE_REAL_BACKEND) throw new Error("Mock DB disabled. Start the Java server.");

        const headers = { 'Content-Type': 'application/json' };

        // Multi-tenant isolation header
        const tenantId = Session.getTenantId();
        if (tenantId) headers['X-Tenant-ID'] = tenantId;

        // JWT Auth header
        const token = Session.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, config);

            // Handle empty responses gracefully
            const text = await response.text();
            const data = text ? JSON.parse(text) : null;

            if (!response.ok) {
                // Global 401 Interceptor: Auto-logout on expired JWT
                if (response.status === 401) {
                    Session.clear();
                    window.location.reload();
                }
                throw new Error(data?.message || `Server Error: ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error(`[API FAILED] ${method} ${endpoint}:`, error.message);
            throw error;
        }
    }

    const Auth = {
        login: async (email, password) => {
            const u = await fetchAPI('/auth/login', 'POST', { email, password });
            if (!u.requiresPasswordReset) Session.save(u);
            return u;
        },
        resetPassword: async (docId, newPassword) => fetchAPI('/auth/reset-password', 'POST', { docId, newPassword }),
        logout: () => Session.clear()
    };

    const Tenants = {
        getAll: async () => fetchAPI('/tenants', 'GET'),
        getTenant: async (id) => fetchAPI(`/tenants/${id}`, 'GET'),
        toggleFlag: async (id, isFlagged) => fetchAPI(`/tenants/${id}/flag`, 'PUT', { flagged: isFlagged }),
        provision: async (data) => fetchAPI('/tenants/provision', 'POST', data)
    };

    const Orders = {
        getAll: async () => {
            const tenantId = Session.getTenantId();
            return fetchAPI(`/orders?tenantId=${tenantId}`, 'GET');
        },
        create: async (data) => {
            data.tenantId = Session.getTenantId();
            return fetchAPI('/orders', 'POST', data);
        },
        updateStatus: async (id, status, carrierName = null) => {
            return fetchAPI(`/orders/${id}/status`, 'PUT', { status, carrierName });
        }
    };

    const ExpenseHeads = {
        getAll: async () => {
            const tenantId = Session.getTenantId();
            return fetchAPI(`/expense-heads?tenantId=${tenantId}`, 'GET');
        },
        create: async (data) => {
            data.tenantId = Session.getTenantId();
            return fetchAPI('/expense-heads', 'POST', data);
        },
        delete: async (id) => fetchAPI(`/expense-heads/${id}`, 'DELETE')
    };

    const Assets = {
        getAll: async () => [], // UI mock array, backend AssetController currently only processes POSTs
        create: async (data) => {
            data.tenantId = Session.getTenantId();
            return fetchAPI('/assets', 'POST', data);
        },
        runDepreciation: async () => {
            const tenantId = Session.getTenantId();
            return fetchAPI(`/assets/run-depreciation?tenantId=${tenantId}`, 'POST');
        }
    };

    const Finance = {
        bootstrapTenant: async () => {
            const tenantId = Session.getTenantId();
            return fetchAPI(`/finance/bootstrap?tenantId=${tenantId}`, 'POST');
        },
        getAccounts: async () => {
            const tenantId = Session.getTenantId();
            return fetchAPI(`/finance/accounts?tenantId=${tenantId}`, 'GET').catch(() => []);
        },
        postJournalVoucher: async (entry) => {
            entry.tenantId = Session.getTenantId();
            return fetchAPI('/finance/journal-entries', 'POST', entry);
        },
        getVouchers: async () => {
            const tenantId = Session.getTenantId();
            return fetchAPI(`/finance/journal-entries?tenantId=${tenantId}`, 'GET').catch(() => []);
        },
        reconcilePayouts: async (targetBankAccount, payoutsData) => {
            const tenantId = Session.getTenantId();
            let endpoint = `/finance/reconcile-payout?tenantId=${tenantId}`;
            if (targetBankAccount) {
                endpoint += `&targetBankAccount=${targetBankAccount}`;
            }
            return fetchAPI(endpoint, 'POST', payoutsData);
        }
    };

    const Inventory = {
        getSkus: async () => {
            const tenantId = Session.getTenantId();
            return fetchAPI(`/inventory/skus?tenantId=${tenantId}`, 'GET').catch(() => []);
        },
        createSku: async (data) => {
            data.tenantId = Session.getTenantId();
            return fetchAPI('/inventory/skus', 'POST', data);
        },
        receivePO: async (data) => {
            const tenantId = Session.getTenantId();
            return fetchAPI(`/inventory/receive-po?tenantId=${tenantId}`, 'POST', data);
        }
    };

    return { Session, Auth, Orders, ExpenseHeads, Assets, Finance, Tenants, Inventory };
})();