/* eslint-disable */
// https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)#micro-functions-version-4

/**
 * Blend color (Lighten or Darken)
 * @param {number} p 混合百分比 范围 0.0 - 1.0
 * @param {string} c0 rgb(a) color1
 * @param {string} c1 rgb(a) color2
 * @returns color
 */
exports.RGB_Linear_Blend=(p,c0,c1)=>{
	var i=parseInt,r=Math.round,P=1-p,[a,b,c,d]=c0.split(","),[e,f,g,h]=c1.split(","),x=d||h,j=x?","+(!d?h:!h?d:r((parseFloat(d)*P+parseFloat(h)*p)*1000)/1000+")"):")";
	return"rgb"+(x?"a(":"(")+r(i(a[3]=="a"?a.slice(5):a.slice(4))*P+i(e[3]=="a"?e.slice(5):e.slice(4))*p)+","+r(i(b)*P+i(f)*p)+","+r(i(c)*P+i(g)*p)+j;
}

/**
 * Blend color (Lighten or Darken)
 * @param {number} p 混合百分比 范围 0.0 - 1.0
 * @param {string} c0 rgb(a) color1
 * @param {string} c1 rgb(a) color2
 * @returns color
 */
exports.RGB_Log_Blend=(p,c0,c1)=>{
	var i=parseInt,r=Math.round,P=1-p,[a,b,c,d]=c0.split(","),[e,f,g,h]=c1.split(","),x=d||h,j=x?","+(!d?h:!h?d:r((parseFloat(d)*P+parseFloat(h)*p)*1000)/1000+")"):")";
	return"rgb"+(x?"a(":"(")+r((P*i(a[3]=="a"?a.slice(5):a.slice(4))**2+p*i(e[3]=="a"?e.slice(5):e.slice(4))**2)**0.5)+","+r((P*i(b)**2+p*i(f)**2)**0.5)+","+r((P*i(c)**2+p*i(g)**2)**0.5)+j;
}


/**
 * Shade color (Lighten or Darken)
 * @param {number} p Shade 百分比范围为 -1.0 - 1.0 负为黑色，正为白色
 * @param {string} c0 rgb(a) color
 * @returns color
 */
exports.RGB_Linear_Shade=(p,c0)=>{
	var i=parseInt,r=Math.round,[a,b,c,d]=c0.split(","),n=p<0,t=n?0:255*p,P=n?1+p:1-p;
	return"rgb"+(d?"a(":"(")+r(i(a[3]=="a"?a.slice(5):a.slice(4))*P+t)+","+r(i(b)*P+t)+","+r(i(c)*P+t)+(d?","+d:")");
}


/**
 * Shade color (Lighten or Darken)
 * @param {number} p Shade 百分比范围为 -1.0 - 1.0 负为黑色，正为白色
 * @param {string} c0 rgb(a) color
 * @returns color
 */
exports.RGB_Log_Shade=(p,c0)=>{
	var i=parseInt,r=Math.round,[a,b,c,d]=c0.split(","),n=p<0,t=n?0:p*255**2,P=n?1+p:1-p;
	return"rgb"+(d?"a(":"(")+r((P*i(a[3]=="a"?a.slice(5):a.slice(4))**2+t)**0.5)+","+r((P*i(b)**2+t)**0.5)+","+r((P*i(c)**2+t)**0.5)+(d?","+d:")");
}


/**
 * 修改透明度
 * @param {number} p 透明度 -1.0 - 1.0
 * @param {string} color
 * @returns color
 */
exports.RGB_Alpha_Shade = (p, color) => {
  var i = parseInt
  var n = p < 0
  var [r, g, b, a] = color.split(",")
  r = r[3] == 'a' ? r.slice(5) : r.slice(4)
  if (a) {
    a = parseFloat(a)
    a = a - (n ? (1 - a) * p : a * p)
    a = n ? Math.max(0, a) : Math.min(1, a)
  } else {
    a = 1 - p
    a = Math.min(1, a)
  }
  return `rgba(${i(r)}, ${i(g)}, ${i(b)}, ${a.toFixed(2)})`
}
