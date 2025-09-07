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

// ==== Sliders ====
noUiSlider.create(budgetSlider, { start:[100,1000], connect:true, range:{min:0,max:10000}, step:50, tooltips:false });
noUiSlider.create(timeframeSlider, { start:[1,12], connect:true, range:{min:1,max:24}, step:1, tooltips:false });

function getBudgetRange(){ return budgetSlider.noUiSlider.get(true).map(v=>Math.round(v)); }
function getTimeframeRange(){ return timeframeSlider.noUiSlider.get(true).map(v=>Math.round(v)); }

budgetSlider.noUiSlider.on("update", ()=>{ const [min,max]=getBudgetRange(); budgetDisplay.textContent=`Range: $${min} – $${max}`; });
timeframeSlider.noUiSlider.on("update", ()=>{ const [min,max]=getTimeframeRange(); timeframeDisplay.textContent=`${min} – ${max} months`; });

// ==== Helpers ====
function setOutput(msg, asHTML=false){ outputDiv.innerHTML = asHTML?msg:`<p>${msg}</p>`; }
function getSelected(group){ return Array.from(group.querySelectorAll("input[type=checkbox]:checked")).map(cb=>cb.value); }
function getSelectedRadio(group){ const sel=group.querySelector("input[type=radio]:checked"); return sel?sel.value:""; }

// ==== Format output ====
function formatOutput(text){
  let cleaned = text.replace(/\|/g," ").replace(/---+/g,"").replace(/<\/?table.*?>/gi,"")
    .replace(/<\/?tr.*?>/gi,"").replace(/<\/?td.*?>/gi,"").replace(/\*\*/g,"").replace(/\*/g,"")
    .replace(/###/g,"").replace(/##/g,"").trim();

  let lines = cleaned.split(/\n/).filter(l=>l.trim());
  let desc = lines.slice(0,2).join(" "); // First lines as general description box
  let projects = cleaned.split(/Project Idea\s*\d+/i).filter(s=>s.trim()).slice(0,3);

  let html = `<div class="gen-description">${desc}</div>`;

  projects.forEach((proj,idx)=>{
    let titleMatch = proj.match(/Name\s*[:\-]\s*(.*)/i);
    let title = titleMatch?titleMatch[1]:`Project ${idx+1}`;
    // Always show section titles
    const sections = ["General Description","Required Technologies","Budget Breakdown","Timeframe Breakdown","Complexity","Similar Products","Novel Elements"];
    let htmlSections = "";
    sections.forEach(sec=>{
      let regex = new RegExp(sec+"[:\\-]?\\s*(.*?)((?="+sections.join("|")+")|$)","is");
      let match = proj.match(regex);
      let content = match?match[1].trim().replace(/\n{2,}/g,"<br>"):"Content not provided.";
      htmlSections += `<div class="section-title">${sec} <span class="expand-icon">▶</span></div>
        <div class="section-content">${content}</div>`;
    });
    html += `<div class="idea-card fade-in"><h2>${title}</h2>${htmlSections}</div>`;
  });
  return html;
}

// ==== Collapsible sections ====
function initCollapsible(){
  document.querySelectorAll(".section-title").forEach(title=>{
    const icon = title.querySelector(".expand-icon");
    const content = title.nextElementSibling;
    title.addEventListener("click", ()=>{
      const isOpen = content.style.display==="block";
      content.style.display = isOpen?"none":"block";
      icon.classList.toggle("open",!isOpen);
    });
  });
}

// ==== Generate function ====
async function generateIdeas(mode="normal"){
  const prompt = promptInput.value.trim();
  if(!prompt){ setOutput("⚠️ Please enter a prompt before generating ideas."); return; }
  const [budgetMin,budgetMax]=getBudgetRange();
  const [timeMin,timeMax]=getTimeframeRange();
  const selectedTechs=getSelected(techGroup);
  const selectedIndustries=getSelected(industryGroup);
  const complexity=getSelectedRadio(complexityGroup);
  const innovation=innovationSelect.value;
  const demo=demoSelect.value;

  let enhancedPrompt=`User idea/constraints: ${prompt}
Budget: $${budgetMin} – $${budgetMax}
Timeframe: ${timeMin} – ${timeMax} months
Technologies: ${selectedTechs.join(", ")||"N/A"}
Industries: ${selectedIndustries.join(", ")||"N/A"}
Complexity: ${complexity}
Innovation: ${innovation}
Demo: ${demo}
`;

  if(mode==="normal"){
    enhancedPrompt+=`Generate up to 3 project ideas. Include Name, General Description, Required Technologies, Budget Breakdown, Similar Products, Novel Elements.`;}
  else if(mode==="expand"){ enhancedPrompt+="Expand previous ideas with deeper technical details.";}
  else if(mode==="similar"){ enhancedPrompt+="Generate 3–5 related variations.";}
  else if(mode==="summarize"){ enhancedPrompt+="Summarize previous ideas into concise bullet points.";}

  setOutput("⏳ Generating ideas...");
  extraButtons.classList.remove("hidden");

  const apiKey = document.getElementById("api-key").value.trim();
  if(!apiKey){ setOutput("⚠️ Please enter your API key."); return; }

  try{
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
      body: JSON.stringify({contents:[{parts:[{text:enhancedPrompt}]}], generationConfig:{temperature:0.7}})
    });
    const data = await res.json();
    if(data.error){ setOutput(`❌ API Error: ${data.error.message}`); return; }
    const text = data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim();
    if(text){
      setOutput(formatOutput(text),true);
      initCollapsible();
    } else setOutput("⚠️ No response from Gemini.");
  }catch{
    setOutput("❌ Network or fetch error.");
  }
}

// ==== Button events ====
generateBtn?.addEventListener("click",()=>generateIdeas("normal"));
expandBtn?.addEventListener("click",()=>generateIdeas("expand"));
similarBtn?.addEventListener("click",()=>generateIdeas("similar"));
summarizeBtn?.addEventListener("click",()=>generateIdeas("summarize"));
