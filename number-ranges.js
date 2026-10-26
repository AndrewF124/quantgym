export const fractionDefaults={numerator:[1,9],denominator:[2,12]};
export const decimalDefaults={range:[0.1,0.9],places:1};
export function numberRanges(s){return s.numberType==='fractions'?(s.fractionRanges||fractionDefaults):s.numberType==='decimals'?(s.decimalRanges||decimalDefaults):null;}
export function validateNumberRanges(s){
 const r=numberRanges(s);if(!r)return '';
 if(s.numberType==='fractions'){
  for(const pair of [r.numerator,r.denominator])if(!Array.isArray(pair)||pair.length!==2||pair.some(n=>!Number.isInteger(n)||n<1||n>999)||pair[0]>pair[1])return 'Use whole numbers from 1 to 999, with each minimum no greater than its maximum.';
 }else{
  if(![1,2,3].includes(r.places))return 'Choose 1, 2, or 3 decimal places.';
  const scale=10**r.places;
  if(!Array.isArray(r.range)||r.range.length!==2||r.range.some(n=>!Number.isFinite(n)||n<1/scale||n>999)||r.range[0]>r.range[1])return 'Use positive numbers up to 999, with the minimum no greater than the maximum.';
  if(r.range.some(n=>Math.abs(n*scale-Math.round(n*scale))>1e-7))return 'Range bounds must fit the selected number of decimal places.';
 }return '';
}
export function rangesLabel(s){const r=numberRanges(s);if(!r)return '';return s.numberType==='fractions'?'Numerators '+r.numerator.join('–')+'; denominators '+r.denominator.join('–'):'Numbers '+r.range.join('–')+'; '+r.places+' decimal places';}
export function rangesMarkup(type,f,d){
 const input=(id,label,value,step='1')=>'<label>'+label+'<input data-number-range id="'+id+'" type="number" step="'+step+'" value="'+value+'"></label>';
 if(type==='fractions')return '<fieldset><legend>Fraction ranges</legend><div class="range-pair">'+input('num-min','Numerator minimum',f.numerator[0])+input('num-max','Numerator maximum',f.numerator[1])+'</div><div class="range-pair">'+input('den-min','Denominator minimum',f.denominator[0])+input('den-max','Denominator maximum',f.denominator[1])+'</div></fieldset><p class="footnote">Both fractions use these ranges. Denominators must be positive. Subtraction puts the larger fraction first.</p>';
 if(type==='decimals')return '<fieldset><legend>Decimal ranges</legend><div class="range-pair">'+input('dec-min','Number minimum',d.range[0],'any')+input('dec-max','Number maximum',d.range[1],'any')+'</div><label>Decimal places <select data-number-range id="dec-places">'+[1,2,3].map(n=>'<option '+(n===d.places?'selected':'')+'>'+n+'</option>').join('')+'</select></label></fieldset><p class="footnote">Both numbers use this range, in steps of the selected precision. Use positive bounds so division is always defined. Subtraction puts the larger number first.</p>';
 return '';
}
