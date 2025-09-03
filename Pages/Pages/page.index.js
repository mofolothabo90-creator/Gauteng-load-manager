import '../styles/globals.css';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// create once per session
let supabase;
if (typeof window !== 'undefined') {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export const SupabaseContext = React.createContext(null);

export default function App({ Component, pageProps }) {
  const [client, setClient] = useState(supabase ?? null);

  useEffect(() => {
    if (!client && typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey) {
      setClient(createClient(supabaseUrl, supabaseAnonKey));
    }
  }, []);

  return (
    <SupabaseContext.Provider value={client}>
      <Component {...pageProps} />
    </SupabaseContext.Provider>
  );
}
