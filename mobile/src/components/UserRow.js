import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { C } from '../theme';
import { Btn, Card, Input, s } from './ui';

export default function UserRow({ u, onPatch }) {
  const [open, setOpen] = useState(false);
  const [p, setP] = useState('');
  const type = u.isAdmin ? 'Admin' : u.isDefault ? 'Default member' : 'Member';
  const save = async () => {
    if (await onPatch(u, { password: p })) { setOpen(false); setP(''); Alert.alert('Password changed'); }
  };
  return (
    <Card style={{ opacity: u.isActive ? 1 : 0.5 }}>
      <Text style={{ fontWeight: '600', color: C.ink }}>{u.name}</Text>
      <Text style={{ color: C.mute }}>{u.username}, {type}{u.isActive ? '' : ' (inactive)'}</Text>
      <View style={[s.row, { marginTop: 8 }]}>
        <Btn v="ghost" title="Reset password" onPress={() => setOpen(!open)} />
        {!u.isAdmin && <Btn v="ghost" title={u.isActive ? 'Deactivate' : 'Activate'} onPress={() => onPatch(u, { isActive: !u.isActive })} />}
      </View>
      {open && (
        <View style={{ marginTop: 8 }}>
          <Input placeholder="New password (6+ characters)" value={p} onChangeText={setP} />
          <Btn title="Save password" onPress={save} />
        </View>
      )}
    </Card>
  );
}
