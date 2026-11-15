import { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { api } from '../api';
import { C } from '../theme';
import { Btn, Err, s } from '../components/ui';
import SummaryCards from '../components/SummaryCards';
import EntryForm from '../components/EntryForm';
import EntryList from '../components/EntryList';

export default function BusinessScreen({ biz, me }) {
  const [tab, setTab] = useState('expenses');
  const [sum, setSum] = useState(null);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const loadSum = () => api(`/businesses/${biz.id}/summary`).then(setSum).catch(() => {});
  const loadRows = () => api(`/businesses/${biz.id}/${tab}`).then(setRows).catch(e => setErr(e.message));
  useEffect(() => { loadSum(); }, [biz.id]);
  useEffect(() => { setRows([]); setErr(''); loadRows(); }, [biz.id, tab]);
  const refresh = () => { loadSum(); loadRows(); };
  const del = id => Alert.alert('Delete this entry?', '', [
    { text: 'Cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await api(`/${tab}/${id}`, 'DELETE'); refresh(); } },
  ]);
  return (
    <View>
      {!!biz.details && <Text style={{ color: C.mute, marginBottom: 8 }}>{biz.details}</Text>}
      <SummaryCards data={sum} />
      <View style={[s.row, { marginBottom: 12 }]}>
        <Btn v={tab === 'expenses' ? 'tabOn' : 'tab'} title="Items bought" onPress={() => setTab('expenses')} />
        <Btn v={tab === 'sales' ? 'tabOn' : 'tab'} title="Products sold" onPress={() => setTab('sales')} />
      </View>
      <EntryForm bizId={biz.id} kind={tab} onAdded={refresh} />
      <Err text={err} />
      <EntryList rows={rows} kind={tab} isAdmin={me.isAdmin} onDelete={del} />
    </View>
  );
}
