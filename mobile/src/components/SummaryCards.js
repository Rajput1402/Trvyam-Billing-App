import { View, Text } from 'react-native';
import { C, money } from '../theme';
import { s } from './ui';

const Box = ({ label, value, color }) => (
  <View style={[s.card, { flex: 1, marginBottom: 0, padding: 10 }]}>
    <Text style={{ color: C.mute, fontSize: 12 }}>{label}</Text>
    <Text style={{ color: color || C.ink, fontSize: 17, fontWeight: '600' }}>{money(value)}</Text>
  </View>
);
export default function SummaryCards({ data }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
      <Box label="Sales" value={data?.sales} color={C.sale} />
      <Box label="Expenses" value={data?.expenses} color={C.exp} />
      <Box label="Profit" value={data?.profit} />
    </View>
  );
}
