export const C = { ink: '#1d2733', mute: '#66727f', line: '#d9dee3', bg: '#f3f5f7', card: '#fff', sale: '#0f766e', exp: '#b4442b', btn: '#1d3b5c' };
export const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const today = () => new Date().toISOString().slice(0, 10);
