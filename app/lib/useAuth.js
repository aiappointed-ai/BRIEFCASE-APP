import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

export function useAuth() {
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
if (!isSupabaseConfigured()) {
setLoading(false);
return;
}

let mounted = true;

// Get initial session
supabase.auth.getSession().then(({ data, error }) => {
if (mounted && !error) {
setUser(data?.session?.user ?? null);
}
if (mounted) setLoading(false);
}).catch(() => {
if (mounted) setLoading(false);
});

// Listen for auth changes
const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
if (mounted) {
setUser(session?.user ?? null);
}
});

return () => {
mounted = false;
listener?.subscription?.unsubscribe();
};
}, []);

const signUp = async (email, password, fullName) => {
const { data, error } = await supabase.auth.signUp({
email,
password,
options: { data: { full_name: fullName } },
});
if (error) throw error;
// If email confirmation is disabled, user is logged in immediately
// If enabled, data.user exists but data.session may be null
if (data?.session?.user) {
setUser(data.session.user);
} else if (data?.user && !data?.session) {
// Email confirmation required - don't set user yet
throw new Error('Check your email for a confirmation link, then sign in.');
}
return data;
};

const signIn = async (email, password) => {
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) throw error;
if (data?.user) setUser(data.user);
return data;
};

const signOut = async () => {
try {
await supabase.auth.signOut();
} catch (e) {
console.error('Sign out error:', e);
}
setUser(null);
};

return { user, loading, signUp, signIn, signOut };
}

