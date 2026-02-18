import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const lsSave = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch {} };
const lsLoad = (key) => { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } catch { return null; } };

export function useDatabase(userId) {
  const [coaches, setCoaches] = useState([]);
  const [events, setEvents] = useState([]);
  const [players, setPlayers] = useState([]);
  const [coachNotes, setCoachNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const online = isSupabaseConfigured() && !!userId;

  // Load data
  useEffect(() => {
    if (online) {
      setLoading(true);
      Promise.all([
        supabase.from('coaches').select('*').order('name'),
        supabase.from('events').select('*').order('created_at', { ascending: false }),
        supabase.from('players').select('*').order('created_at', { ascending: false }),
        supabase.from('coach_notes').select('*').order('created_at', { ascending: false }),
      ]).then(([cR, eR, pR, nR]) => {
        if (cR.data) setCoaches(cR.data);
        if (eR.data) setEvents(eR.data);
        if (pR.data) setPlayers(pR.data);
        if (nR.data) setCoachNotes(nR.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setCoaches(lsLoad('bc_coaches') || []);
      setEvents(lsLoad('bc_events') || []);
      setPlayers(lsLoad('bc_players') || []);
      setCoachNotes([]);
      setLoading(false);
    }
  }, [online, userId]);

  // Realtime sync
  useEffect(() => {
    if (!online) return;
    const channel = supabase
      .channel('players-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        supabase.from('players').select('*').order('created_at', { ascending: false })
          .then(({ data }) => { if (data) setPlayers(data); });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [online]);

  // Coaches
  const cleanCoachData = (data) => {
    return {
      name: data.name || '',
      photo: data.photo || null,
      school: data.school || '',
      division: data.division || '',
      conference: data.conference || '',
      record: data.record || '',
      position: data.position || '',
      signed_players: data.signed_players || data.signedPlayers || '',
      bio: data.bio || '',
      notes: data.notes || '',
      event_ids: data.event_ids || data.events || [],
    };
  };

  const saveCoach = async (data) => {
    if (online) {
      const clean = cleanCoachData(data);
      if (data.id) {
        const { data: u, error } = await supabase.from('coaches').update(clean).eq('id', data.id).select().single();
        if (error) { console.error('Coach update error:', error); return; }
        if (u) setCoaches(p => p.map(c => c.id === u.id ? u : c));
      } else {
        const { data: c, error } = await supabase.from('coaches').insert({ ...clean, created_by: userId }).select().single();
        if (error) { console.error('Coach insert error:', error); return; }
        if (c) setCoaches(p => [...p, c]);
      }
    } else {
      setCoaches(p => { const n = data.id ? p.map(c => c.id === data.id ? data : c) : [...p, { ...data, id: genId() }]; lsSave('bc_coaches', n); return n; });
    }
  };

  const deleteCoach = async (id) => {
    if (online) await supabase.from('coaches').delete().eq('id', id);
    setCoaches(p => { const n = p.filter(c => c.id !== id); if (!online) lsSave('bc_coaches', n); return n; });
  };

  // Events
  const saveEvent = async (data) => {
    if (online) {
      if (data.id && events.find(e => e.id === data.id)) {
        const { data: u } = await supabase.from('events').update(data).eq('id', data.id).select().single();
        if (u) setEvents(p => p.map(e => e.id === u.id ? u : e));
      } else {
        const { id, ...rest } = data;
        const { data: c } = await supabase.from('events').insert({ ...rest, created_by: userId }).select().single();
        if (c) setEvents(p => [...p, c]);
        return c;
      }
    } else {
      setEvents(p => { const n = data.id && p.find(e => e.id === data.id) ? p.map(e => e.id === data.id ? data : e) : [...p, { ...data, id: data.id || genId() }]; lsSave('bc_events', n); return n; });
    }
  };

  const deleteEvent = async (id) => {
    if (online) await supabase.from('events').delete().eq('id', id);
    setEvents(p => { const n = p.filter(e => e.id !== id); if (!online) lsSave('bc_events', n); return n; });
    if (!online) setCoaches(p => { const n = p.map(c => ({ ...c, events: (c.events || []).filter(e => e !== id) })); lsSave('bc_coaches', n); return n; });
  };

  // Coach-Event linking
  const toggleCoachEvent = async (coachId, eventId) => {
    if (online) {
      const coach = coaches.find(c => c.id === coachId);
      if (!coach) return;
      const evts = coach.event_ids || [];
      const newEvts = evts.includes(eventId) ? evts.filter(e => e !== eventId) : [...evts, eventId];
      const { data: u } = await supabase.from('coaches').update({ event_ids: newEvts }).eq('id', coachId).select().single();
      if (u) setCoaches(p => p.map(c => c.id === coachId ? u : c));
    } else {
      setCoaches(p => { const n = p.map(c => { if (c.id !== coachId) return c; const evts = c.events || []; return { ...c, events: evts.includes(eventId) ? evts.filter(e => e !== eventId) : [...evts, eventId] }; }); lsSave('bc_coaches', n); return n; });
    }
  };

  // Players
  const cleanPlayerData = (data) => {
    // Only send fields that match the database columns
    return {
      name: data.name || '',
      jersey_number: data.jersey_number || data.jerseyNumber || '',
      jersey_color: data.jersey_color || data.jerseyColor || '#cc0000',
      position: data.position || '',
      division: data.division || '',
      rating: data.rating || '',
      notes: data.notes || '',
      event_id: (data.event_id || data.eventId || null) || null,
    };
  };

  const savePlayer = async (data) => {
    if (online) {
      const clean = cleanPlayerData(data);
      if (data.id && players.find(p => p.id === data.id)) {
        const { data: u, error } = await supabase.from('players').update(clean).eq('id', data.id).select().single();
        if (error) { console.error('Player update error:', error); return; }
        if (u) setPlayers(p => p.map(x => x.id === u.id ? u : x));
      } else {
        const { data: c, error } = await supabase.from('players').insert({ ...clean, scouted_by: userId }).select().single();
        if (error) { console.error('Player insert error:', error); return; }
        if (c) setPlayers(p => [c, ...p]);
      }
    } else {
      setPlayers(p => { const n = data.id && p.find(x => x.id === data.id) ? p.map(x => x.id === data.id ? data : x) : [...p, { ...data, id: genId(), created_at: new Date().toISOString() }]; lsSave('bc_players', n); return n; });
    }
  };

  const deletePlayer = async (id) => {
    if (online) await supabase.from('players').delete().eq('id', id);
    setPlayers(p => { const n = p.filter(x => x.id !== id); if (!online) lsSave('bc_players', n); return n; });
  };

  // Coach Notes
  const saveCoachNote = async (playerId, noteData, coachName) => {
    if (!online) return;
    const existing = coachNotes.find(n => n.player_id === playerId && n.coach_user_id === userId);
    if (existing) {
      const { data: u } = await supabase.from('coach_notes').update({ ...noteData, coach_name: coachName, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single();
      if (u) setCoachNotes(p => p.map(n => n.id === u.id ? u : n));
    } else {
      const { data: c } = await supabase.from('coach_notes').insert({ player_id: playerId, coach_user_id: userId, coach_name: coachName, ...noteData }).select().single();
      if (c) setCoachNotes(p => [...p, c]);
    }
  };

  const getMyNoteForPlayer = (playerId) => online ? (coachNotes.find(n => n.player_id === playerId && n.coach_user_id === userId) || null) : null;
  const getAllNotesForPlayer = (playerId) => coachNotes.filter(n => n.player_id === playerId);
  const findDuplicatePlayer = (jerseyNumber, eventId) => (!jerseyNumber || !eventId) ? null : (players.find(p => p.jersey_number === jerseyNumber && p.event_id === eventId) || null);

  return {
    coaches: online ? coaches.map(c => ({ ...c, events: c.event_ids || [] })) : coaches,
    events, players, coachNotes, loading,
    saveCoach, deleteCoach, saveEvent, deleteEvent, toggleCoachEvent,
    savePlayer, deletePlayer, saveCoachNote, getMyNoteForPlayer, getAllNotesForPlayer, findDuplicatePlayer,
  };
}
