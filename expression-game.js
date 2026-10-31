export function expressionQuestion(random=Math.random){
 const n=()=>2+Math.floor(random()*9),a=n(),b=n(),c=n(),d=n();
 return [
 {text:`${a} + ${b} × ${c}`,answer:a+b*c},
 {text:`${a*b} ÷ ${b} + ${c} × ${d}`,answer:a+c*d},
 {text:`(${a} + ${b}) × ${c}`,answer:(a+b)*c},
 {text:`${a*b+c} − ${a} × ${b}`,answer:c},
 {text:`${a} × ${b} + ${c} × ${d}`,answer:a*b+c*d},
 {text:`(${a*b} + ${b*c}) ÷ ${b}`,answer:a+c}
 ][Math.floor(random()*6)];
}
