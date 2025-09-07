// ==== Element handles ====
const promptInput = document.getElementById("prompt");
const generateBtn = document.getElementById("generate");
const outputDiv = document.getElementById("output");
const budgetSlider = document.getElementById("budget-slider");
const budgetDisplay = document.getElementById("budget-display");
const timeframeSlider = document.getElementById("timeframe-slider");
const timeframeDisplay = document.getElementById("timeframe-display");
const techGroup = document.getElementById("technologies");
const industryGroup = document.getElementById("industries");
const complexityGroup = document.getElementById("complexity");
const innovationSelect = document.getElementById("innovation");
const demoSelect = document.getElementById("demo");
const extraButtons = document.getElementById("extra-buttons");
const expandBtn = document.getElementById("expand");
const similarBtn = document.getElementById("similar");
const summarizeBtn = document.getElementById("summarize");
const apiKeyInput = document.getElementById("api-key");

const DEFAULT_MODEL = "models/gemini-2.5-flash";

// ==== Sliders ====
noUiSlider.create(budgetSlider,{start:[100,1000],connect:true,range:{min:0,max:10000},step:50});
noUiSlider.create(timeframeSlider,{start:[6,12],connect:true,range:{min:1,max:24},step:1});

function getBudgetRange(){ const values = budgetSlider.noUiSlider.get(true); return [Math.round(values[0]),Math.round(values[1])]; }
function getTimeframeRange(){ const values = timeframeSlider.noUiSlider.get(true); return [Math.round(values[0]),Math.round(values[1])]; }

budgetSlider.noUiSlider.on("update",()=>{ const [min,max]=getBudgetRange(); budgetDisplay.textContent=`Range: $${min} – $${max}`; });
timeframeSlider.noUiSlider.on("update",()=>{ const [min,max]=getTimeframeRange(); timeframeDisplay.textContent=`${min} – ${max} months`; });

// ==== Helpers ====
function setOutput(msg,asHTML=false){ outputDiv.innerHTML = asHTML ? msg : `<p>${msg}</p>`; }

function getSelected(group){
  const checked = group.querySelectorAll("input[type=checkbox]:checked")||[];
  return Array.from(checked).map(cb=>cb.value);
}

// ==== Generate function ====
async function generateIdeas(mode="normal"){
  const prompt = promptInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  if(!prompt){ setOutput("⚠️ Please enter a prompt."); return; }
  if(!apiKey){ setOutput("⚠️ Please enter your API key."); return; }

  const [budgetMin,budgetMax] = getBudgetRange();
  const [timeMin,timeMax] = getTimeframeRange();
  const selectedTechs = getSelected(techGroup);
  const selectedIndustries = getSelected(industryGroup);
  const complexity = document.querySelector('input[name="complexity"]:checked')?.value || "Medium";
  const innovation = innovationSelect.value;
  const demo = demoSelect.value;

  let enhancedPrompt = `
User idea/constraints: ${prompt}
Budget range: $${budgetMin} – $${budgetMax}
Timeframe: ${timeMin} – ${timeMax} months
Preferred technologies: ${selectedTechs.join(", ") || "N/A"}
Industry focus: ${selectedIndustries.join(", ") || "N/A"}
Project Complexity: ${complexity}
Innovation Level: ${innovation}
Demo Considerations: ${demo}
`;

  if(mode==="normal"){ enhancedPrompt+=`
Generate up to 3 computer engineering project ideas. For each, provide:
- Name
- General Description
- Required Technologies & Budget Breakdown
- Timeframe Breakdown
- Complexity & Skills Needed
- Similar Products
- Novel Elements`; }
  else if(mode==="expand") enhancedPrompt+=`Expand the previous ideas with deeper technical details.`;
  else if(mode==="similar") enhancedPrompt+=`Generate 3–5 related variations of the previous ideas.`;
  else if(mode==="summarize") enhancedPrompt+=`Summarize the previous ideas into concise bullet points.`;

  setOutput("⏳ Generating ideas...");
  extraButtons.classList.remove("hidden");

  try{
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${DEFAULT_MODEL}:generateContent`,{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
      body: JSON.stringify({contents:[{parts:[{text:enhancedPrompt}]}],generationConfig:{temperature:0.7}})
    });
    const data = await res.json();
    if(data.error){ setOutput(`❌ API Error: ${data.error.message}`); return; }
    const text = data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim();
    if(text){ setOutput(formatOutput(text),true); initCollapsible(); }
    else setOutput("⚠️ No response from Gemini.");
  }catch{ setOutput("❌ Network or fetch error."); }
}

// ==== Format output ====
function formatOutput(text){
  let cleaned = text.replace(/\|/g," ").replace(/---+/g,"")
    .replace(/<\/?table.*?>/gi,"").replace(/<\/?tr.*?>/gi,"")
    .replace(/<\/?td.*?>/gi,"").replace(/\*\*/g,"").replace(/\*/g,"")
    .replace(/###/g,"").replace(/##/g,"").trim();

  let descriptionBox = cleaned.split(/\n/).slice(0,2).join(" ");
  let html = `<div class="gen-description">${descriptionBox}</div>`;

  let projects = cleaned.split(/Project Idea\s*\d+/i).filter(s=>s.trim()).slice(0,3);
  if(projects.length===0 && cleaned) projects=[cleaned];

  projects.forEach((proj,idx)=>{
    let titleMatch = proj.match(/Name\s*[:\-]\s*(.*)/i);
    let title = titleMatch?titleMatch[1]:`Project ${idx+1}`;

    const sections = ["General Description","Required Technologies & Budget Breakdown","Timeframe Breakdown","Complexity & Skills Needed","Similar Products","Novel Elements"];

    let htmlSections="";
    sections.forEach(sec=>{
      let regex = new RegExp(sec+"[:\\-]?\\s*(.*?)((?="+sections.join("|")+")|$)","is");
      let match = proj.match(regex);
      let content = match?match[1].trim():"";

      if(sec==="Timeframe Breakdown" && !content){
        const [timeMin,timeMax]=getTimeframeRange();
        content = `- Research: ${Math.round(timeMax*0.25)} months
- Development: ${Math.round(timeMax*0.4)} months
- Hardware setup: ${Math.round(timeMax*0.2)} months
- Final prototype ready: ${Math.round(timeMax*0.15)} months`;
      }
      if(sec==="Complexity & Skills Needed" && !content){
        const comp=document.querySelector('input[name="complexity"]:checked')?.value||"Medium";
        const innov=innovationSelect.value;
        content = `- Complexity: ${comp}
- Skills / Experience Needed: ${innov}`;
      }

      content=content.split(/\n/).map(l=>l.trim()).filter(l=>l).map(l=>l.startsWith("-")?l:`- ${l}`).join("<br>");

      htmlSections+=`<div class="section-title">${sec} <span class="expand-icon">▶</span></div>
      <div class="section-content">${content}</div>`;
    });

    html+=`<div class="idea-card fade-in"><h2>${title}</h2>${htmlSections}</div>`;
  });

  return html;
}

// ==== Collapsible sections ====
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

// ==== Button events ====
generateBtn.addEventListener("click",()=>generateIdeas("normal"));
expandBtn.addEventListener("click",()=>generateIdeas("expand"));
similarBtn.addEventListener("click",()=>generateIdeas("similar"));
summarizeBtn.addEventListener("click",()=>generateIdeas("summarize"));
