import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api, setToken, setOnExpired } from './src/api';
import { C } from './src/theme';
import { Btn, Card, s } from './src/components/ui';
import LoginScreen from './src/screens/LoginScreen';
import BusinessScreen from './src/screens/BusinessScreen';
import AdminScreen from './src/screens/AdminScreen';

export default function App() {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState(null);
  const [list, setList] = useState([]);
  const [sel, setSel] = useState(null);
  const [view, setView] = useState('biz');

  const logout = useCallback(async () => {
    setToken(null); await SecureStore.deleteItemAsync('session');
    setMe(null); setList([]); setView('biz');
  }, []);
  const loadBiz = useCallback(() => api('/businesses').then(l => {
    setList(l); setSel(cur => (l.some(b => b.id === cur) ? cur : l[0]?.id ?? null));
  }).catch(() => {}), []);
  const login = async r => { setToken(r.token); await SecureStore.setItemAsync('session', JSON.stringify(r)); setMe(r); };

  useEffect(() => {
    setOnExpired(logout);
    (async () => {
      const saved = await SecureStore.getItemAsync('session');
      if (saved) { const m = JSON.parse(saved); setToken(m.token); setMe(m); }
      setReady(true);
    })();
  }, []);
  useEffect(() => { if (me) loadBiz(); }, [me]);

  const root = { flex: 1, backgroundColor: C.bg, paddingTop: StatusBar.currentHeight };
  if (!ready) return null;
  if (!me) return <View style={root}><LoginScreen onDone={login} /></View>;

  const cur = list.find(b => b.id === sel);
  return (
    <View style={root}>
      <View style={{ backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderColor: C.line }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.ink }}>BizTracker</Text>
          <View style={s.row}>
            <Text style={{ color: C.mute }}>{me.name}</Text>
            <Btn v="ghost" title="Sign out" onPress={logout} style={{ paddingVertical: 4 }} />
          </View>
        </View>
        {me.isAdmin && (
          <View style={[s.row, { marginTop: 8 }]}>
            <Btn v={view === 'biz' ? 'tabOn' : 'tab'} title="Businesses" onPress={() => setView('biz')} />
            <Btn v={view === 'admin' ? 'tabOn' : 'tab'} title="Manage" onPress={() => setView('admin')} />
          </View>
        )}
      </View>
      <ScrollView contentContainerStyle={{ padding: 12 }} keyboardShouldPersistTaps="handled">
        {view === 'admin' && me.isAdmin ? (
          <AdminScreen businesses={list} reloadBiz={loadBiz} />
        ) : list.length === 0 ? (
          <Card><Text style={{ color: C.mute }}>{me.isAdmin ? 'No businesses yet. Open Manage to add one.' : 'You are not part of any business yet. Ask the admin to add you.'}</Text></Card>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
              {list.map(b => <Btn key={b.id} v={b.id === sel ? 'tabOn' : 'tab'} title={b.name} onPress={() => setSel(b.id)} />)}
            </ScrollView>
            {cur && <BusinessScreen key={cur.id} biz={cur} me={me} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}
