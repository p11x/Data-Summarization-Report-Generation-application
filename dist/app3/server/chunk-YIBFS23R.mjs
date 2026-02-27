import './polyfills.server.mjs';
function l(a){let t=[],e="",n=!1;for(let r=0;r<a.length;r++){let o=a[r];o==='"'?n=!n:o===","&&!n?(t.push(e.trim()),e=""):e+=o}return t.push(e.trim()),t}function u(a){let t=a.trim().split(`
`);if(t.length===0)return{parsedData:[],headers:[]};let e=l(t[0]),n=[];for(let r=1;r<t.length;r++){let o=l(t[r]);if(o.length===e.length){let s={};e.forEach((i,c)=>{s[i]=o[c]}),n.push(s)}}return{parsedData:n,headers:e}}export{l as a,u as b};
