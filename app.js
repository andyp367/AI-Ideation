// ==== Element handles ====
const promptInput   = document.getElementById("prompt");
const generateBtn   = document.getElementById("generate");
const outputDiv     = document.getElementById("output");
const budgetSlider  = document.getElementById("budget-slider");
const budgetDisplay = document.getElementById("budget-display");
const timeframeSlider = document.getElementById("timeframe-slider");
const timeframeDisplay = document.getElementById("timeframe-display");
const techGroup     = document.getElementById("technologies");
const industryGroup = document.getElementById("industries");
const complexityRadios = document.getElementsByName("complexity");
const innovationSelect = document.getElementById("innovation");
const extraButtons  = document.getElementById("extra-buttons");

// ==== Sliders ====
noUiSlider.create(budgetSlider, { start:[100,1000], connect:true, range:{min:0,max:10000}, step:50 });
budgetSlider.noUiSlider.on("update",()=>{ const vals=budgetSlider.noUiSlider.get(true); budgetDisplay.textContent=`Range: $${Math.round(vals[0])} – $${Math.round(vals[1])}`; });

noUiSlider.create(timeframeSlider, { start:[6], connect:[true,false], range:{min:1,max:24}, step:1 });
timeframeSlider.noUiSlider.on("update",()=>{ const val=Math.round(timeframeSlider.noUiSlider.get()); timeframeDisplay.textContent=`${val} month${val>1?'s':''}`; });

function getBudgetRange(){ const v=budgetSlider.noUiSlider.get(true); return [Math.round(v[0]),Math.round(v[1])]; }
function getTimeframeRange(){ return [Math.round(timeframeSlider.noUiSlider.get()),Math.round(timeframeSlider.noUiSlider.get())]; }
function getSelected(group){ const cbs=group?.querySelectorAll("input[type=checkbox]:checked")||[]; return Array.from(cbs).map(cb=>cb.value); }
function getSelectedRadio(name){ const r=document.querySelector('input[name="'+name+'"]:checked'); return r?r.value:"Medium"; }

// ==== Output ====
function setOutput(msg, asHTML=false){ outputDiv.innerHTML = asHTML?msg:`<p>${msg}</p>`; }

// ==== Format Output ====
function formatOutput(text){
  let cleaned = text.replace(/\|/g," ").replace(/---+/g,"").replace(/<\/?table.*?>/gi,"")
    .replace(/<\/?tr.*?>/gi,"").replace(/<\/?td.*?>/gi,"").replace(/\*\*/g,"").replace(/\*/g,"")
    .replace(/###/g,"").replace(/##/g,"").trim();

  let desc = cleaned.split(/\n/).slice(0,2).join(" ");
  let html = `<div class="gen-description">${desc}</div>`;

  let projects = cleaned.split(/Project Idea\s*\d+/i).filter(s=>s.trim()).slice(0,3);
  if(projects.length===0 && cleaned) projects=[cleaned];

  const budgetRange=getBudgetRange();
  const timeframe=getTimeframeRange()[0];
  const complexity=getSelectedRadio("complexity");
  const innovation=innovationSelect.value;

  projects.forEach((proj,idx)=>{
    let titleMatch=proj.match(/Name\s*[:\-]\s*(.*)/i);
    let title=titleMatch?titleMatch[1]:`Project ${idx+1}`;

    const sections=["General Description","Required Technologies & Budget","Timeframe Breakdown","Complexity & Innovation","Similar Products","Novel Elements"];
    let htmlSections="";
    sections.forEach(sec=>{
      let content="";
      if(sec==="General Description"){ content=proj.match(/General Description[:\-]?\s*(.*)/is)?.[1]||"- Description not provided"; }
      if(sec==="Required Technologies & Budget"){ content=proj.match(/(Required Technologies|Budget Breakdown)[:\-]?\s*(.*)/is)?.[2]||`- Tech: ${getSelected(techGroup).join(", ")}\n- Budget: $${budgetRange[0]} – $${budgetRange[1]}`; }
      if(sec==="Timeframe Breakdown"){ 
        content=`- Research: ${Math.round(timeframe*0.25)} mo\n- Development: ${Math.round(timeframe*0.4)} mo\n- Hardware setup: ${Math.round(timeframe*0.2)} mo\n- Final prototype ready: ${Math.round(timeframe*0.15)} mo`; 
      }
      if(sec==="Complexity & Innovation"){ content=`- Complexity: ${complexity}\n- Innovation Level: ${innovation}\n- Skills/Experience Needed: ${complexity==="High"?"Advanced engineering and professional experience":complexity==="Medium"?"Some prior experience in engineering projects": "Entry-level/college skills"}`; }
      if(sec==="Similar Products"){ content=proj.match(/Similar Products[:\-]?\s*(.*)/is)?.[1]||"- None"; }
      if(sec==="Novel Elements"){ content=proj.match(/Novel Elements[:\-]?\s*(.*)/is)?.[1]||"- Unique aspects TBD"; }

      // Ensure dash list formatting
      content = content.split(/\n/).map(l=>l.trim()).filter(Boolean).map(l=>l.startsWith("-")?l:`- ${l}`).join("<br>");

      htmlSections+=`<div class="section-title">${sec} <span class="expand-icon">▶</span></div>
        <div class="section-content">${content}</div>`;
    });

    html+=`<div class="idea-card fade-in"><h2>${title}</h2>${htmlSections}</div>`;
  });
  return html;
}

function initCollapsible(){
  document.querySelectorAll(".section-title").forEach(title=>{
    const icon=title.querySelector(".expand-icon");
    const content=title.nextElementSibling;
    content.style.display="none";
    title.addEventListener("click",()=>{
      const isOpen=content.style.display==="block";
      content.style.display=isOpen?"none":"block";
      icon.classList.toggle("open",!isOpen);
    });
  });
}

// ==== Generate Function ====
async function generateIdeas(mode="normal"){
  const prompt=promptInput.value.trim();
  const apiKey=document.getElementById("api-key").value.trim();
  if(!prompt){ setOutput("⚠️ Please enter a prompt before generating ideas."); return; }
  if(!apiKey){ setOutput("⚠️ Please enter your API key."); return; }

  const [budgetMin,budgetMax]=getBudgetRange();
  const [timeMin,timeMax]=getTimeframeRange();
  const selectedTechs=getSelected(techGroup);
  const selectedIndustries=getSelected(industryGroup);
  const complexity=getSelectedRadio("complexity");
  const innovation=innovationSelect.value;
  const demo=document.getElementById("demo").value;

  let enhancedPrompt=`User idea/constraints: ${prompt}
Budget: $${budgetMin}-${budgetMax}
Timeframe: ${timeMin}-${timeMax} months
Technologies: ${selectedTechs.join(", ")}
Industry: ${selectedIndustries.join(", ")}
Complexity: ${complexity}
Innovation: ${innovation}
Demo: ${demo}
Generate 3 computer engineering project ideas. Include:
- Name
- General Description
- Required Technologies & Budget
- Timeframe Breakdown
- Complexity & Innovation
- Similar Products
- Novel Elements`;

  setOutput("⏳ Generating ideas...");
  extraButtons.classList.remove("hidden");

  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
      body: JSON.stringify({contents:[{parts:[{text:enhancedPrompt}]}], generationConfig:{temperature:0.7}})
    });
    const data=await res.json();
    if(data.error){ setOutput(`❌ API Error: ${data.error.message}`); return; }
    const text=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim();
    if(text){ setOutput(formatOutput(text),true); initCollapsible(); } else setOutput("⚠️ No response from AI.");
  }catch{ setOutput("❌ Network or fetch error."); }
}

generateBtn?.addEventListener("click",()=>generateIdeas("normal"));
