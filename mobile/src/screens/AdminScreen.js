import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from '../api';
import { C } from '../theme';
import { Btn, Card, Input, Err } from '../components/ui';
import BusinessCard from '../components/BusinessCard';
import UserForm from '../components/UserForm';
import UserRow from '../components/UserRow';

export default function AdminScreen({ businesses, reloadBiz }) {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState('');
  const [nb, setNb] = useState({ name: '', details: '' });
  const loadUsers = () => api('/users').then(setUsers).catch(e => setErr(e.message));
  useEffect(() => { loadUsers(); }, []);
  // Wraps an action: shows the error text, returns true when it worked
  const run = fn => async (...a) => { setErr(''); try { await fn(...a); return true; } catch (e) { setErr(e.message); return false; } };

  const addBiz = run(async () => { await api('/businesses', 'POST', nb); setNb({ name: '', details: '' }); reloadBiz(); });
  const addUser = run(async u => { await api('/users', 'POST', u); await loadUsers(); reloadBiz(); });
  const patchUser = run(async (u, body) => { await api('/users/' + u.id, 'PUT', { name: u.name, isActive: u.isActive, ...body }); loadUsers(); });
  const toggleMember = run(async (b, uid, on) => {
    const ids = on ? [...b.memberIds, uid] : b.memberIds.filter(i => i !== uid);
    await api(`/businesses/${b.id}/members`, 'PUT', ids);
    reloadBiz();
  });

  const h = t => <Text style={{ fontSize: 16, fontWeight: '600', color: C.ink, marginVertical: 8 }}>{t}</Text>;
  return (
    <>
      <Err text={err} />
      {h('Businesses')}
      <Card>
        <Input placeholder="Business name" value={nb.name} onChangeText={v => setNb({ ...nb, name: v })} />
        <Input placeholder="Details (optional)" value={nb.details} onChangeText={v => setNb({ ...nb, details: v })} />
        <Btn title="Add business" onPress={addBiz} />
      </Card>
      {businesses.map(b => <BusinessCard key={b.id} biz={b} users={users} onToggle={toggleMember} />)}
      {h('Accounts')}
      <UserForm onSubmit={addUser} />
      {users.map(u => <UserRow key={u.id} u={u} onPatch={patchUser} />)}
    </>
  );
}
