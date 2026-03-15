import './polyfills.server.mjs';
function i(a){let e=[],r="",o=!1;for(let n=0;n<a.length;n++){let t=a[n];t==='"'?o=!o:t===","&&!o?(e.push(r.trim()),r=""):r+=t}return e.push(r.trim()),e}function u(a){let e=a.trim().split(`
`);if(e.length===0)return{parsedData:[],headers:[]};let r=i(e[0]),o=[];for(let n=1;n<e.length;n++){let t=i(e[n]);if(t.length===r.length){let s={};r.forEach((l,c)=>{s[l]=t[c]}),o.push(s)}}return{parsedData:o,headers:r}}function g(a,e){let r=e.map(o=>a.map(n=>{let t=o[n];return typeof t=="string"&&(t.includes(",")||t.includes('"'))?`"${t.replace(/"/g,'""')}"`:t??""}).join(","));return[a.join(","),...r].join(`
`)}export{i as a,u as b,g as c};
