import { View, Text, Switch } from 'react-native';
import { C } from '../theme';
import { Card } from './ui';

// Admin: choose which members belong to a business
export default function BusinessCard({ biz, users, onToggle }) {
  return (
    <Card>
      <Text style={{ fontWeight: '600', color: C.ink }}>{biz.name}</Text>
      {!!biz.details && <Text style={{ color: C.mute }}>{biz.details}</Text>}
      {users.filter(u => !u.isAdmin && u.isActive).map(u => (
        <View key={u.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>{u.name}</Text>
          <Switch value={biz.memberIds.includes(u.id)} onValueChange={on => onToggle(biz, u.id, on)} />
        </View>
      ))}
    </Card>
  );
}
