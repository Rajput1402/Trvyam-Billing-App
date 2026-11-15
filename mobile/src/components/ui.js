import { Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { C } from '../theme';

const T = {
  solid: { bg: C.btn, bd: C.btn, fg: '#fff' },
  ghost: { bg: '#fff', bd: C.btn, fg: C.btn },
  tab: { bg: '#fff', bd: C.line, fg: C.ink },
  tabOn: { bg: C.ink, bd: C.ink, fg: '#fff' },
};
export const Btn = ({ title, onPress, v = 'solid', style }) => {
  const t = T[v];
  return (
    <TouchableOpacity onPress={onPress} style={[s.btn, { backgroundColor: t.bg, borderColor: t.bd }, style]}>
      <Text style={{ color: t.fg }}>{title}</Text>
    </TouchableOpacity>
  );
};
export const Input = p => <TextInput placeholderTextColor={C.mute} {...p} style={[s.input, p.style]} />;
export const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;
export const Err = ({ text }) => (text ? <Text style={{ color: C.exp, marginBottom: 8 }}>{text}</Text> : null);

export const s = StyleSheet.create({
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 4, borderWidth: 1, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 4, padding: 10, backgroundColor: '#fff', marginBottom: 8, color: C.ink },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 12, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
});
