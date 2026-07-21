// ── CONFIG — all secrets from .env (set in Vercel dashboard) ──
// NEVER hardcode secrets here

export const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const SHEETS_URL = import.meta.env.VITE_SHEETS_URL || '';

// App constants
export const LS_KEY      = 'frp_factory_v5';
export const STAGES      = ['Moulding','Finishing','Painting','Packing','Dispatch'];
export const FG_STAGES   = ['Moulding','Finishing','Painting','Packing'];
export const MNAMES      = ['January','February','March','April','May',
                             'June','July','August','September','October',
                             'November','December'];

// Role access map
export const ROLE_ACCESS = {
  owner:      ['dashboard','setup','sheets','att','sup','raw','day','month',
               'orders','payments','dispatch','transfers','salary','inventory',
               'stock','rmpurchase','fgstock','docs','bom','export'],
  supervisor: ['dashboard','att','sup','raw','day'],
  rm:         ['dashboard','raw','stock','rmpurchase','inventory','fgstock'],
};

export const ROLE_HOME = {
  owner:      'dashboard',
  supervisor: 'att',
  rm:         'raw',
};
