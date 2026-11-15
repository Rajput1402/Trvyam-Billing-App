import { useState } from 'react';
import { View, Text } from 'react-native';
import { api } from '../api';
import { C } from '../theme';
import { Btn, Card, Input, Err } from '../components/ui';

export default function LoginScreen({ onDone }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const go = async () => {
    setErr('');
    try { onDone(await api('/login', 'POST', { username: u, password: p })); }
    catch (e) { setErr(e.message); }
  };
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Card>
        <Text style={{ fontSize: 20, fontWeight: '600', color: C.ink, marginBottom: 12 }}>Sign in</Text>
        <Input placeholder="Username" autoCapitalize="none" value={u} onChangeText={setU} />
        <Input placeholder="Password" secureTextEntry value={p} onChangeText={setP} />
        <Err text={err} />
        <Btn title="Sign in" onPress={go} />
      </Card>
    </View>
  );
}
