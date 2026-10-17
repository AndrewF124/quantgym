export function question(track, difficulty, random = Math.random) {
  const integer = (a,b) => a + Math.floor(random() * (b-a+1));
  const hard = difficulty === 'challenge';
  const kind = integer(0,3);
  if (track === 'math') {
    const a = integer(hard ? 21 : 2, hard ? 99 : 20), b = integer(2,hard ? 19 : 12);
    if (kind === 0) return {prompt:`${a} × ${b}`, answer:a*b, explanation:`${a} × ${b} = ${a*b}. Break one factor into tens and units to work it out mentally.`};
    if (kind === 1) return {prompt:`${a*b} ÷ ${b}`, answer:a, explanation:`${a*b} divided into ${b} equal parts is ${a}. Check: ${a} × ${b} = ${a*b}.`};
    if (kind === 2) { const rate = [5,10,15,20,25][integer(0,4)], base=integer(2,hard?80:20)*20; return {prompt:`${rate}% of ${base}`, answer:rate*base/100, explanation:`Multiply ${base} by ${rate}/100 to get ${rate*base/100}.`}; }
    return {prompt:`${a*b} + ${a} − ${b}`,answer:a*b+a-b,explanation:`First add ${a*b} + ${a} = ${a*b+a}, then subtract ${b} to get ${a*b+a-b}.`};
  }
  if(kind === 0) {const n=integer(2,hard?6:4);return {prompt:`Flip a fair coin ${n} times. What is the probability of all heads?`,answer:1/2**n,explanation:`Independent probabilities multiply: (1/2)^${n} = 1/${2**n}.`};}
  if(kind === 1) {const red=integer(2,hard?12:6),blue=integer(2,hard?12:6);return {prompt:`A bag has ${red} red and ${blue} blue balls. Draw two without replacement. What is the probability both are red?`,answer:red/(red+blue)*(red-1)/(red+blue-1),explanation:`P(two red) = ${red}/${red+blue} × ${red-1}/${red+blue-1}. The second draw has one fewer red ball and one fewer total ball.`};}
  if(kind === 2) {const win=integer(2,hard?20:8)*5,loss=integer(1,hard?10:4)*5,p=integer(1,4)/5;return {prompt:`A game earns you $${win} with ${p*100}% probability and loses $${loss} otherwise. What is the expected net gain in dollars?`,answer:p*win-(1-p)*loss,explanation:`Expected gain = ${p} × ${win} − ${(1-p).toFixed(1)} × ${loss} = $${(p*win-(1-p)*loss).toFixed(2)}.`};}
  const sides=hard?integer(7,12):6, threshold=integer(2,sides-1);return {prompt:`Roll a fair ${sides}-sided die numbered 1 to ${sides}. What is the probability of rolling at least ${threshold}?`,answer:(sides-threshold+1)/sides,explanation:`There are ${sides-threshold+1} favorable outcomes (${threshold} through ${sides}), out of ${sides} equally likely outcomes.`};
}
export function parseAnswer(raw) {
  const s=raw.trim();
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*\/\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) {const [a,b]=s.split('/').map(Number);return b ? a/b : NaN;}
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)%?$/.test(s)) return NaN;
  return s.endsWith('%')?Number(s.slice(0,-1))/100:Number(s);
}
export const isCorrect = (value, answer) => Number.isFinite(value) && Math.abs(value-answer)<=0.005001;
export function summary(rows) {
  const attempts=rows.flatMap(r=>Array.isArray(r.results?.attempts)?r.results.attempts:[]);
  return {sessions:rows.length,total:attempts.length,correct:attempts.filter(a=>a.correct===true).length,seconds:attempts.reduce((s,a)=>s+(Number(a.seconds)||0),0)};
}
