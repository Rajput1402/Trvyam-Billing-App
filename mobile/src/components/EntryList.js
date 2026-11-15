import { View, Text } from 'react-native';
import { C, money } from '../theme';
import { Btn, Card } from './ui';

export default function EntryList({ rows, kind, isAdmin, onDelete }) {
  const sale = kind === 'sales';
  if (rows.length === 0)
    return <Card><Text style={{ color: C.mute }}>{sale ? 'No sales yet. Add the first one above.' : 'No expenses yet. Add the first one above.'}</Text></Card>;
  return (
    <Card style={{ padding: 0 }}>
      {rows.map((r, i) => (
        <View key={r.id} style={{ padding: 12, borderTopWidth: i ? 1 : 0, borderColor: C.line }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ flex: 1, fontWeight: '600', color: C.ink }}>{r.name}{sale && r.qty > 1 ? ` x${r.qty}` : ''}</Text>
            <Text style={{ color: sale ? C.sale : C.exp, fontWeight: '600' }}>{money(r.amount)}</Text>
          </View>
          <Text style={{ color: C.mute, fontSize: 12 }}>{r.date}, added by {r.addedBy}</Text>
          {!!r.notes && <Text style={{ color: C.mute }}>{r.notes}</Text>}
          {isAdmin && <Btn v="ghost" title="Delete" onPress={() => onDelete(r.id)} style={{ alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4 }} />}
        </View>
      ))}
    </Card>
  );
}
