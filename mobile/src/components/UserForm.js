import { useState } from 'react';
import { View, Text, Switch } from 'react-native';
import { Btn, Card, Input } from './ui';

export default function UserForm({ onSubmit }) {
  const blank = { name: '', username: '', password: '', isDefault: false };
  const [u, setU] = useState(blank);
  const set = k => v => setU({ ...u, [k]: v });
  return (
    <Card>
      <Input placeholder="Name" value={u.name} onChangeText={set('name')} />
      <Input placeholder="Username" autoCapitalize="none" value={u.username} onChangeText={set('username')} />
      <Input placeholder="Password (6+ characters)" value={u.password} onChangeText={set('password')} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text>Default account (in every business)</Text>
        <Switch value={u.isDefault} onValueChange={set('isDefault')} />
      </View>
      <Btn title="Create account" onPress={async () => { if (await onSubmit(u)) setU(blank); }} />
    </Card>
  );
}
