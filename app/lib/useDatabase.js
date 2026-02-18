import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

// ============ LOCAL STORAGE FALLBACK ============
function useLocalDB() {
  const [coaches, setCoaches] = useState([]);
  const [events, setEvents] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    try {
      const c = localStorage.getItem('bc_coaches');
      const e = localStorage.getItem('bc_events');
      const p = localStorage.getItem('bc_players');
      if (c) setCoaches(JSON.parse(c));
      if (e) setEvents(JSON.parse(e));
      if (p) setPlayers(JSON.parse(p));
    } catch {}
  }, []);

  const save = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
  };

  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

  return {
    coaches,
    events,
    players,
    coachNotes: [],
    loading: false,

    saveCoach: (data) => {
      setCoaches(prev => {
        const next = data.id
          ? prev.map(c => c.id === data.id ? { ...data } : c)
          : [...prev, { ...data, id: genId() }];
        save('bc_coaches', next);
        return next;
      });
    },
    deleteCoach: (id) => {
      setCoaches(prev => {
        const next = prev.filter(c => c.id !== id);
        save('bc_coaches', next);
        return next;
      });
    },

    saveEvent: (data) => {
      setEvents(prev => {
        const next = data.id && prev.find(e => e.id === data.id)
          ? prev.map(e => e.id === data.id ? { ...data } : e)
          : [...prev, { ...data, id: data.id || genId() }];
        save('bc_events', next);
        return next;
      });
    },
    deleteEvent: (id) => {
      setEvents(prev => {
        const next = prev.filter(e => e.id !== id);
        save('bc_events', next);
        return next;
      });
      setCoaches(prev => {
        const next = prev.map(c => ({ ...c, events: (c.events || []).filter(e => e !== id) }));
        save('bc_coaches', next);
        return next;
      });
    },

    toggleCoachEvent: (coachId, eventId) => {
      setCoaches(prev => {
        const next = prev.map(c => {
          if (c.id !== coachId) return c;
          const evts = c.events || [];
          return { ...c, events: evts.includes(eventId) ? evts.filter(e => e !== eventId) : [...evts, eventId] };
        });
        save('bc_coaches', next);
        return next;
      });
    },

    savePlayer: (data) => {
      setPlayers(prev => {
        const next = data.id && prev.find(p => p.id === data.id)
          ? prev.map(p => p.id === data.id ? { ...data } : p)
          : [...prev, { ...data, id: genId(), created_at: new Date().toISOString() }];
        save('bc_players', next);
        return next;
      });
    },
    deletePlayer: (id) => {
      setPlayers(prev => {
        const next = prev.filter(p => p.id !== id);
        save('bc_players', next);
        return next;
      });
    },

    saveCoachNote: () => {},
    getMyNoteForPlayer: () => null,
    getAllNotesForPlayer: () => [],
    findDuplicatePlayer: (jerseyNumber, eventId) => null,
  };
}

// ============ SUPABASE DATABASE ============
function useSupabaseDB(userId) {
  const [coaches, setCoaches] = useState([]);
  const [events, setEvents] = useState([]);
  const [players, setPlayers] = useState([]);
  const [coachNotes, setCoachNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [coachRes, eventRes, playerRes, notesRes] = await Promise.all([
        supabase.from('coaches').select('*').order('name'),
        supabase.from('events').select('*').order('created_at', { ascending: false }),
        supabase.from('players').select('*').order('created_at', { ascending: false }),
        supabase.from('coach_notes').select('*').order('created_at', { ascending: false }),
      ]);
      if (coachRes.data) setCoaches(coachRes.data);
      if (eventRes.data) setEvents(eventRes.data);
      if (playerRes.data) setPlayers(playerRes.data);
      if (notesRes.data) setCoachNotes(notesRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Subscribe to real-time changes on players table
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('players-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        supabase.from('players').select('*').order('created_at', { ascending: false })
          .then(({ data }) => { if (data) setPlayers(data); });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // COACHES
  const saveCoach = async (data) => {
    if (data.id) {
      const { data: updated, error } = await supabase
        .from('coaches').update(data).eq('id', data.id).select().single();
      if (!error && updated) setCoaches(prev => prev.map(c => c.id === updated.id ? updated : c));
    } else {
      const { id, ...rest } = data;
      const { data: created, error } = await supabase
        .from('coaches').insert({ ...rest, created_by: userId }).select().single();
      if (!error && created) setCoaches(prev => [...prev, created]);
    }
  };

  const deleteCoach = async (id) => {
    await supabase.from('coaches').delete().eq('id', id);
    setCoaches(prev => prev.filter(c => c.id !== id));
  };

  // EVENTS
  const saveEvent = async (data) => {
    if (data.id && events.find(e => e.id === data.id)) {
      const { data: updated, error } = await supabase
        .from('events').update(data).eq('id', data.id).select().single();
      if (!error && updated) setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
    } else {
      const { id, ...rest } = data;
      const { data: created, error } = await supabase
        .from('events').insert({ ...rest, created_by: userId }).select().single();
      if (!error && created) setEvents(prev => [...prev, created]);
      return created;
    }
  };

  const deleteEvent = async (id) => {
    await supabase.from('events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // COACH-EVENT linking (using a junction or array — keeping simple with coach.event_ids jsonb)
  const toggleCoachEvent = async (coachId, eventId) => {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) return;
    const evts = coach.event_ids || [];
    const newEvts = evts.includes(eventId) ? evts.filter(e => e !== eventId) : [...evts, eventId];
    const { data: updated } = await supabase
      .from('coaches').update({ event_ids: newEvts }).eq('id', coachId).select().single();
    if (updated) setCoaches(prev => prev.map(c => c.id === coachId ? updated : c));
  };

  // PLAYERS (shared)
  const savePlayer = async (data) => {
    if (data.id && players.find(p => p.id === data.id)) {
      const { data: updated, error } = await supabase
        .from('players').update(data).eq('id', data.id).select().single();
      if (!error && updated) setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p));
    } else {
      const { id, ...rest } = data;
      const { data: created, error } = await supabase
        .from('players').insert({ ...rest, scouted_by: userId }).select().single();
      if (!error && created) setPlayers(prev => [created, ...prev]);
    }
  };

  const deletePlayer = async (id) => {
    await supabase.from('players').delete().eq('id', id);
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  // COACH NOTES (per coach per player — upsert pattern)
  const saveCoachNote = async (playerId, noteData, coachName) => {
    const existing = coachNotes.find(n => n.player_id === playerId && n.coach_user_id === userId);
    if (existing) {
      const { data: updated } = await supabase
        .from('coach_notes')
        .update({ ...noteData, coach_name: coachName, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select().single();
      if (updated) setCoachNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
    } else {
      const { data: created } = await supabase
        .from('coach_notes')
        .insert({ player_id: playerId, coach_user_id: userId, coach_name: coachName, ...noteData })
        .select().single();
      if (created) setCoachNotes(prev => [...prev, created]);
    }
  };

  // Get current user's note for a player
  const getMyNoteForPlayer = (playerId) => {
    return coachNotes.find(n => n.player_id === playerId && n.coach_user_id === userId) || null;
  };

  // Get ALL notes for a player (from all coaches)
  const getAllNotesForPlayer = (playerId) => {
    return coachNotes.filter(n => n.player_id === playerId);
  };

  // Duplicate detection
  const findDuplicatePlayer = (jerseyNumber, eventId) => {
    if (!jerseyNumber || !eventId) return null;
    return players.find(p => p.jersey_number === jerseyNumber && p.event_id === eventId) || null;
  };

  return {
    coaches: coaches.map(c => ({ ...c, events: c.event_ids || [] })),
    events,
    players,
    coachNotes,
    loading,
    saveCoach,
    deleteCoach,
    saveEvent,
    deleteEvent,
    toggleCoachEvent,
    savePlayer,
    deletePlayer,
    saveCoachNote,
    getMyNoteForPlayer,
    getAllNotesForPlayer,
    findDuplicatePlayer,
  };
}

// ============ EXPORT ============
export function useDatabase(userId) {
  if (isSupabaseConfigured() && userId) {
    return useSupabaseDB(userId);
  }
  return useLocalDB();
}
