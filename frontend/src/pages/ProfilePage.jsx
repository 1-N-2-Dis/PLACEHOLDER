// guidHER Profile — user info, saved routes, submitted reports, emergency contacts, theme.
import { useState } from 'react';
import { Moon, Sun, Train, Footprints, MapPin, LogOut, ChevronRight, Moon as MoonIcon, Phone, Plus, Trash2, Edit2, Check, AlertTriangle, Lightbulb, AlertOctagon } from 'lucide-react';
import { useAuth } from '../lib/authContext.jsx';
import { useTheme } from '../lib/theme.jsx';

const COMMUTE_PREFS = [
  { id: 'lrt', label: 'LRT commuter', Icon: Train },
  { id: 'jeepney', label: 'Jeepney commuter', Icon: ChevronRight },
  { id: 'walking', label: 'Walking routes', Icon: Footprints },
  { id: 'night', label: 'Night commute', Icon: MoonIcon },
];

const MOCK_REPORTS = [
  { id: 'r1', type: 'poor_lighting', location: 'Teresa Street', date: 'Jul 1, 2026', status: 'active' },
  { id: 'r2', type: 'no_crowd', location: 'Pureza Station approach', date: 'Jun 29, 2026', status: 'active' },
];

const CONDITION_LABELS = { poor_lighting: 'Poor lighting', no_crowd: 'No crowd', recent_incident: 'Recent incident' };

function conditionIcon(type) {
  if (type === 'poor_lighting') return <Lightbulb size={14} />;
  if (type === 'no_crowd') return <AlertTriangle size={14} />;
  return <AlertOctagon size={14} />;
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const CONTACT_DEFAULTS = [
  { id: 'c1', name: 'Mom', relationship: 'Parent', phone: '+63 912 345 6789' },
];

export default function ProfilePage() {
  const { user, logout, update } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [editInfo, setEditInfo] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', homeLocation: user?.homeLocation || '', destination: user?.destination || '' });
  const [prefs, setPrefs] = useState(user?.commutePrefs || []);
  const [saving, setSaving] = useState(false);

  const [contacts, setContacts] = useState(CONTACT_DEFAULTS);
  const [addingContact, setAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phone: '' });
  const [editingContactId, setEditingContactId] = useState(null);

  function togglePref(id) {
    setPrefs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  async function saveInfo() {
    setSaving(true);
    await update({ name: form.name, homeLocation: form.homeLocation, destination: form.destination, commutePrefs: prefs });
    setSaving(false);
    setEditInfo(false);
  }

  function addContact() {
    if (!newContact.name.trim()) return;
    setContacts(c => [...c, { id: `c_${Date.now()}`, ...newContact }]);
    setNewContact({ name: '', relationship: '', phone: '' });
    setAddingContact(false);
  }

  function removeContact(id) {
    setContacts(c => c.filter(x => x.id !== id));
  }

  return (
    <div className="page-scroll">
      <div className="page-scroll-inner">

        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">{initials(user?.name)}</div>
          <div>
            <div className="profile-name">{user?.name || 'Guest'}</div>
            <div className="profile-email">{user?.email || ''}</div>
            <div className="text-caption" style={{ marginTop: 2 }}>{user?.campus || ''}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[['Reports submitted', user?.reportsCount || MOCK_REPORTS.length, 'var(--primary)'], ['Saved routes', (user?.savedRoutes||[]).length || 1, 'var(--secondary)']].map(([lbl, val, col]) => (
            <div key={lbl} className="card card-sm" style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: col }}>{val}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Profile info */}
        <div className="card mb-14">
          <div className="flex-between" style={{ marginBottom: editInfo ? 14 : 0 }}>
            <div className="card-title">Profile info</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditInfo(e => !e)}>
              {editInfo ? 'Cancel' : <><Edit2 size={13} /> Edit</>}
            </button>
          </div>
          {editInfo ? (
            <>
              {[['Full name','name','text','Maria Santos'],['Home area','homeLocation','text','e.g. near Pureza Station'],['Typical destination','destination','text','e.g. PUP Main Campus']].map(([lbl,k,t,ph]) => (
                <div className="form-group" key={k}>
                  <label className="form-label">{lbl}</label>
                  <input type={t} className="form-input" placeholder={ph} value={form[k]}
                    onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                </div>
              ))}
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8 }}>Commute preferences</div>
              <div className="pref-chips" style={{ marginBottom: 14 }}>
                {COMMUTE_PREFS.map(({ id, label, Icon }) => (
                  <button type="button" key={id}
                    className={`pref-chip${prefs.includes(id) ? ' selected' : ''}`}
                    onClick={() => togglePref(id)}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
              <button className="btn btn-primary btn-sm" onClick={saveInfo} disabled={saving}>
                {saving ? <span className="spinner" /> : <><Check size={14} /> Save changes</>}
              </button>
            </>
          ) : (
            <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 10 }}>
              {user?.homeLocation && <div style={{ marginBottom: 4 }}><MapPin size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Home: {user.homeLocation}</div>}
              {user?.destination && <div style={{ marginBottom: 4 }}><MapPin size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Destination: {user.destination}</div>}
              {!user?.homeLocation && !user?.destination && <div>No locations saved yet. Tap Edit to add them.</div>}
              {prefs.length > 0 && (
                <div className="pref-chips" style={{ marginTop: 10 }}>
                  {COMMUTE_PREFS.filter(p => prefs.includes(p.id)).map(({ id, label, Icon }) => (
                    <span key={id} className="pref-chip selected" style={{ pointerEvents: 'none', fontSize: '0.75rem' }}>
                      <Icon size={12} /> {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submitted reports */}
        <div className="card mb-14">
          <div className="card-title mb-12">Your reports</div>
          {MOCK_REPORTS.length === 0 ? (
            <div className="muted">No reports submitted yet.</div>
          ) : MOCK_REPORTS.map(r => (
            <div key={r.id} className="report-row">
              <div className="report-row-icon">
                {conditionIcon(r.type)}
              </div>
              <div className="report-row-body">
                <div className="report-row-title">{CONDITION_LABELS[r.type]}</div>
                <div className="report-row-sub">{r.location} · {r.date}</div>
              </div>
              <span className="status-badge badge-green" style={{ flexShrink: 0 }}>{r.status}</span>
            </div>
          ))}
        </div>

        {/* Emergency contacts */}
        <div className="card mb-14">
          <div className="flex-between mb-12">
            <div className="card-title">Emergency contacts</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setAddingContact(a => !a)}>
              {addingContact ? 'Cancel' : <><Plus size={13} /> Add</>}
            </button>
          </div>
          {addingContact && (
            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              {[['Name','name','text','e.g. Mom'],['Relationship','relationship','text','e.g. Parent'],['Phone','phone','tel','+63 9XX XXX XXXX']].map(([lbl,k,t,ph]) => (
                <div className="form-group" key={k} style={{ marginBottom: 10 }}>
                  <label className="form-label">{lbl}</label>
                  <input type={t} className="form-input" placeholder={ph}
                    value={newContact[k]} onChange={e => setNewContact(c => ({ ...c, [k]: e.target.value }))} />
                </div>
              ))}
              <button className="btn btn-primary btn-sm" onClick={addContact}>
                <Check size={14} /> Save contact
              </button>
            </div>
          )}
          {contacts.length === 0 && !addingContact && (
            <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>No contacts added yet.</div>
          )}
          {contacts.map(c => (
            <div key={c.id} className="contact-item">
              <div className="contact-avatar">{c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}</div>
              <div style={{ flex: 1 }}>
                <div className="contact-name">{c.name}</div>
                <div className="contact-rel">{c.relationship}</div>
                <div className="contact-phone">{c.phone}</div>
              </div>
              <div className="contact-actions">
                <a href={`tel:${c.phone}`} className="btn btn-secondary btn-sm" style={{ padding: '6px 8px' }}>
                  <Phone size={14} />
                </a>
                <button className="btn btn-danger btn-sm" style={{ padding: '6px 8px' }} onClick={() => removeContact(c.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Appearance */}
        <div className="card mb-14">
          <div className="flex-between">
            <div>
              <div className="card-title">Appearance</div>
              <div className="text-caption" style={{ marginTop: 2 }}>{theme === 'dark' ? 'Dark mode on' : 'Light mode on'}</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={toggleTheme}>
              {theme === 'dark' ? <><Sun size={14} /> Light</> : <><Moon size={14} /> Dark</>}
            </button>
          </div>
        </div>

        {/* Sign out */}
        <button className="btn btn-danger btn-full" style={{ marginBottom: 32 }} onClick={logout}>
          <LogOut size={16} /> Sign out
        </button>

      </div>
    </div>
  );
}
