export function estimationQuestion(difficulty='foundation',random=Math.random){
 const pick=(a,b)=>a+Math.floor(random()*(b-a+1)),hard=difficulty==='challenge',kind=pick(0,3);
 let prompt,answer,explanation,topic;
 if(kind===0){const rate=pick(7,43),base=pick(hard?1000:100,hard?9999:999);topic='Percentages';prompt=rate+'% of '+base;answer=rate*base/100;explanation='Estimate 10% by dividing by 10, then combine multiples and smaller percentages.';}
 if(kind===1){const a=pick(11,hard?999:99),b=pick(13,hard?999:99);topic='Fractions';prompt=a+' ÷ '+b;answer=a/b;explanation='Round the numerator and denominator to nearby convenient numbers, then divide. Enter the ratio as a decimal or fraction.';}
 if(kind===2){const n=pick(hard?1000:20,hard?99999:999);topic='Square roots';prompt='√'+n;answer=Math.sqrt(n);const low=Math.floor(answer);explanation='The root lies between '+low+' and '+(low+1)+', since their squares are '+low*low+' and '+(low+1)*(low+1)+'.';}
 if(kind===3){const a=pick(hard?100:20,hard?999:99),b=pick(hard?100:20,hard?999:99);topic='Multiplication';prompt=a+' × '+b;answer=a*b;explanation='Round one factor to a convenient number, multiply, then adjust for the amount you rounded.';}
 return {prompt:'Estimate: '+prompt,answer,topic,explanation,tolerance:hard?.02:.05};
}
export function estimationGrade(value,answer,tolerance){const relativeError=Math.abs(value-answer)/Math.abs(answer);return {correct:Number.isFinite(value)&&relativeError<=tolerance+1e-12,relativeError};}
