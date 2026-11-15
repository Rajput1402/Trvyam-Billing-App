import { useState } from 'react';
import { View } from 'react-native';
import { api } from '../api';
import { today } from '../theme';
import { Btn, Card, Input, Err } from './ui';

// One form for both "items bought" (expenses) and "products sold" (sales)
export default function EntryForm({ bizId, kind, onAdded }) {
  const sale = kind === 'sales';
  const blank = { name: '', amount: '', qty: '1', date: today(), notes: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const set = k => v => setF({ ...f, [k]: v });
  const submit = async () => {
    setErr('');
    try {
      await api(`/businesses/${bizId}/${kind}`, 'POST', { name: f.name, amount: parseFloat(f.amount) || 0, qty: parseInt(f.qty) || 1, date: f.date, notes: f.notes });
      setF({ ...blank, date: f.date });
      onAdded();
    } catch (e) { setErr(e.message); }
  };
  return (
    <Card>
      <Input placeholder={sale ? 'Product sold' : 'Item bought'} value={f.name} onChangeText={set('name')} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {sale && <Input style={{ width: 70 }} placeholder="Qty" keyboardType="number-pad" value={f.qty} onChangeText={set('qty')} />}
        <Input style={{ flex: 1 }} placeholder={sale ? 'Total amount' : 'Amount'} keyboardType="decimal-pad" value={f.amount} onChangeText={set('amount')} />
      </View>
      <Input placeholder="Date (YYYY-MM-DD)" value={f.date} onChangeText={set('date')} />
      <Input placeholder="Notes (optional)" value={f.notes} onChangeText={set('notes')} />
      <Err text={err} />
      <Btn title={sale ? 'Add sale' : 'Add expense'} onPress={submit} />
    </Card>
  );
}
