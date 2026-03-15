import './polyfills.server.mjs';
import{d as p,y}from"./chunk-YEIMT7VC.mjs";import{k as f}from"./chunk-H4UZCO6D.mjs";var v=(()=>{class g{results=new p([]);isProcessing=new p(!1);results$=this.results.asObservable();isProcessing$=this.isProcessing.asObservable();constructor(){this.loadResults()}loadResults(){let s=localStorage.getItem("ai-analysis-results");if(s)try{this.results.next(JSON.parse(s))}catch(e){console.error("Error loading results:",e)}}saveResults(){localStorage.setItem("ai-analysis-results",JSON.stringify(this.results.value))}analyze(s,e){return f(this,null,function*(){this.isProcessing.next(!0);try{yield this.delay(1e3+Math.random()*2e3);let t=this.generateAnalysis(s,e),a=this.results.value;return this.results.next([t,...a]),this.saveResults(),this.isProcessing.next(!1),t}catch(t){throw this.isProcessing.next(!1),t}})}generateAnalysis(s,e){let t=s.toLowerCase(),{data:a,metadata:r}=e;return t.includes("summarize")||t.includes("summary")?this.generateSummary(s,e):t.includes("chart")||t.includes("visual")?this.generateChart(s,e):t.includes("top")||t.includes("highest")?this.generateTopValues(s,e):t.includes("correlation")||t.includes("correlate")?this.generateCorrelation(s,e):t.includes("insight")||t.includes("analyze")?this.generateInsights(s,e):this.generateGeneralResponse(s,e)}generateSummary(s,e){let{data:t,metadata:a}=e,r=this.createBasicSummary(t,a);return{id:this.generateId(),type:"summary",title:"Dataset Summary",content:r,timestamp:new Date}}createBasicSummary(s,e){let t=Object.entries(e.columnTypes).filter(([r,i])=>i==="integer"||i==="float").map(([r])=>r),a=`## Dataset Overview

`;return a+=`This dataset contains **${e.rowCount} rows** and **${e.columnNames.length} columns**.

`,a+=`**Columns:** ${e.columnNames.join(", ")}

`,a+=`**Data Types:**
`,Object.entries(e.columnTypes).forEach(([r,i])=>{a+=`- ${r}: ${i}
`}),t.length>0&&(a+=`
**Numeric Analysis:**
`,t.slice(0,3).forEach(r=>{let i=s.map(l=>l[r]).filter(l=>typeof l=="number");if(i.length>0){let c=i.reduce((m,d)=>m+d,0)/i.length,o=Math.min(...i),n=Math.max(...i);a+=`- ${r}: Min=${o.toFixed(2)}, Max=${n.toFixed(2)}, Avg=${c.toFixed(2)}
`}})),a}generateChart(s,e){let{data:t,metadata:a}=e,r="bar";s.toLowerCase().includes("line")||s.toLowerCase().includes("trend")?r="line":s.toLowerCase().includes("pie")||s.toLowerCase().includes("distribution")?r="pie":s.toLowerCase().includes("scatter")&&(r="scatter");let i=Object.entries(a.columnTypes).filter(([o,n])=>n==="integer"||n==="float").map(([o])=>o),l=a.columnNames.filter(o=>a.columnTypes[o]==="string"),c;if(r==="pie"&&l.length>0){let o=l[0],n={};t.forEach(d=>{let u=d[o]||"Unknown";n[u]=(n[u]||0)+1});let m=Object.entries(n).slice(0,10);c={type:"pie",labels:m.map(([d])=>d),datasets:[{label:o,data:m.map(([d,u])=>u),backgroundColor:this.generateColors(m.length)}]}}else if(i.length>=2&&l.length>0){let o=l[0],n=i[0],m={};t.slice(0,20).forEach(u=>{let h=u[o]||"Unknown";m[h]=(m[h]||0)+(Number(u[n])||0)});let d=Object.keys(m);c={type:r,labels:d,datasets:[{label:n,data:d.map(u=>m[u]),backgroundColor:"#4F46E5",borderColor:"#4F46E5"}]}}else i.length>=2?c={type:"scatter",labels:t.slice(0,20).map((o,n)=>`Point ${n+1}`),datasets:[{label:`${i[0]} vs ${i[1]}`,data:t.slice(0,20).map(o=>[o[i[0]],o[i[1]]]).flat()}]}:c={type:"bar",labels:a.columnNames.slice(0,5),datasets:[{label:"Sample Data",data:t.slice(0,5).map((o,n)=>n+1),backgroundColor:"#4F46E5"}]};return{id:this.generateId(),type:"chart",title:this.getChartTitle(r),content:this.generateChartDescription(r,e),chartData:c,timestamp:new Date}}getChartTitle(s){switch(s){case"bar":return"Bar Chart Visualization";case"line":return"Line Chart - Trend Analysis";case"pie":return"Pie Chart - Distribution";case"scatter":return"Scatter Plot";default:return"Data Visualization"}}generateChartDescription(s,e){return`This ${s} chart provides a visual representation of your dataset (${e.metadata.filename}). It shows the distribution and relationships within your ${e.metadata.rowCount} rows of data.`}generateTopValues(s,e){let{data:t,metadata:a}=e,r=Object.entries(a.columnTypes).filter(([o,n])=>n==="integer"||n==="float").map(([o])=>o);if(r.length===0)return{id:this.generateId(),type:"table",title:"Top Values",content:"No numeric columns found in the dataset.",timestamp:new Date};let i=r[0],l=[...t].sort((o,n)=>n[i]-o[i]).slice(0,10),c=`## Top 10 Highest Values in ${i}

`;return c+=`| Rank | ${i} | 
|------|------|
`,l.forEach((o,n)=>{c+=`| ${n+1} | ${o[i]} |
`}),{id:this.generateId(),type:"table",title:`Top 10 ${i} Values`,content:c,rawData:l,timestamp:new Date}}generateCorrelation(s,e){let{data:t,metadata:a}=e,r=Object.entries(a.columnTypes).filter(([l,c])=>c==="integer"||c==="float").map(([l])=>l);if(r.length<2)return{id:this.generateId(),type:"insight",title:"Correlation Analysis",content:"Not enough numeric columns to perform correlation analysis. Need at least 2 numeric columns.",timestamp:new Date};let i=[];for(let l=0;l<Math.min(r.length,3);l++)for(let c=l+1;c<Math.min(r.length,3);c++){let o=r[l],n=r[c],m=this.calculateCorrelation(t,o,n);i.push(`- **${o}** and **${n}**: ${m>0?"positive":"negative"} correlation (${m.toFixed(2)})`)}return{id:this.generateId(),type:"insight",title:"Correlation Analysis",content:`## Correlation Analysis

${i.join(`

`)}

This analysis shows the relationship between numeric variables in your dataset. Values close to 1 indicate strong positive correlation, while values close to -1 indicate strong negative correlation.`,timestamp:new Date}}calculateCorrelation(s,e,t){let a=s.filter(u=>typeof u[e]=="number"&&typeof u[t]=="number");if(a.length<2)return 0;let r=a.length,i=a.reduce((u,h)=>u+h[e],0),l=a.reduce((u,h)=>u+h[t],0),c=a.reduce((u,h)=>u+h[e]*h[e],0),o=a.reduce((u,h)=>u+h[t]*h[t],0),n=a.reduce((u,h)=>u+h[e]*h[t],0),m=r*n-i*l,d=Math.sqrt((r*c-i*i)*(r*o-l*l));return d===0?0:m/d}generateInsights(s,e){let{data:t,metadata:a}=e,r=[];r.push(`- Dataset contains **${a.rowCount} records** across **${a.columnNames.length} fields**`);let i={};t.forEach(o=>{a.columnNames.forEach(n=>{(!o[n]||o[n]==="")&&(i[n]=(i[n]||0)+1)})});let l=Object.entries(i).filter(([o,n])=>n>0);l.length>0&&r.push(`- **${l.length} columns** have missing values`);let c=Object.entries(a.columnTypes).filter(([o,n])=>n==="integer"||n==="float").map(([o])=>o);return c.length>0&&r.push(`- **${c.length} numeric columns** available for analysis`),{id:this.generateId(),type:"insight",title:"Data Insights",content:`## Key Insights

${r.join(`
`)}

---

This analysis provides an overview of your dataset's structure and quality. Use the AI chat to ask specific questions about patterns, trends, or anomalies in your data.`,timestamp:new Date}}generateGeneralResponse(s,e){let{metadata:t}=e;return{id:this.generateId(),type:"summary",title:"AI Response",content:`## Response to: "${s}"

I've analyzed your dataset (${t.filename}) which contains ${t.rowCount} rows and ${t.columnNames.length} columns.

**Available columns:** ${t.columnNames.join(", ")}

You can ask me to:
- \u{1F4CA} "Summarize this dataset"
- \u{1F4C8} "Generate a chart"
- \u{1F51D} "Show top 10 values"
- \u{1F517} "Find correlations"
- \u{1F4A1} "Provide insights"

What would you like to explore?`,timestamp:new Date}}generateColors(s){let e=["#4F46E5","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4","#84CC16","#F97316","#6366F1"];return Array(s).fill(0).map((t,a)=>e[a%e.length])}delay(s){return new Promise(e=>setTimeout(e,s))}generateId(){return`result-${Date.now()}-${Math.random().toString(36).substr(2,9)}`}getResults(){return this.results.value}clearResults(){this.results.next([]),localStorage.removeItem("ai-analysis-results")}deleteResult(s){let e=this.results.value.filter(t=>t.id!==s);this.results.next(e),this.saveResults()}static \u0275fac=function(e){return new(e||g)};static \u0275prov=y({token:g,factory:g.\u0275fac,providedIn:"root"})}return g})();export{v as a};
