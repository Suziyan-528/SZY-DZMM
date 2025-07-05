// 世界模拟器.js

const worldBackgrounds = [
  { 
    value: "modern", 
    text: "现代都市（预设）",
    desc: "高度发达的城市环境，科技先进，社会结构复杂。包含摩天大楼、繁华商业区、高科技设施和多元文化背景。"
  },
  { 
    value: "immortal", 
    text: "修仙世界（预设）",
    desc: "以修炼为核心的世界观，包含灵气、功法、法宝等元素。存在修真门派、妖兽、秘境和天材地宝等设定。"
  },
  { 
    value: "magic", 
    text: "魔法世界（预设）",
    desc: "魔法是世界的核心力量，存在法师协会、魔法学院、元素生物等设定。包含多种魔法体系和魔法生物。"
  },
  { 
    value: "custom", 
    text: "自定义",
    desc: ""
  }
];

const bodyTypes = [
  "苗条修长", "匀称健美", "肌肉发达", "丰满性感", 
  "娇小玲珑", "高大魁梧", "纤细柔弱", "微胖可爱", 
  "健壮有力", "骨感明显", "运动型", "丰满圆润", 
  "瘦高型", "矮壮型", "模特身材", "运动员身材"
];

const xpGroups = [
  {
    title: "A",
    options: ["支配", "臣服", "羞辱", "疼痛", "捆绑"]
  },
  {
    title: "B",
    options: ["暴露", "恋物", "角色扮演", "多角关系", "偷窥"]
  },
  {
    title: "C",
    options: ["展示", "恋足", "制服", "权力交换", "感官剥夺"]
  },
  {
    title: "D",
    options: ["宠物扮演", "年龄扮演", "公开场合", "束缚", "控制"]
  },
  {
    title: "E",
    options: ["服从", "施虐", "受虐", "恋物癖", "暴露癖"]
  },
  {
    title: "F",
    options: ["角色互换", "多人游戏", "偷窥癖", "展示癖", "恋鞋"]
  },
  {
    title: "G",
    options: ["恋袜", "制服诱惑", "权力游戏", "感官刺激", "动物扮演", "年龄差异"]
  }
];

const genders = [
  { value: "", text: "选择" },
  { value: "男", text: "男" },
  { value: "女", text: "女" },
  { value: "custom", text: "自定义" }
];

const perspectives = [
  { value: "first", text: "第一人称" },
  { value: "third", text: "第三人称" }
];

const abilities = [
  "超强力量", "飞行能力", "隐身术", "心灵感应", 
  "元素控制", "变形能力", "瞬间移动", "预知未来",
  "治疗能力", "读心术", "能量护盾", "动物沟通",
  "时间操控", "物质转换", "幻象制造", "精神控制",
  "超速再生", "意念移物", "空间扭曲", "能量吸收"
];


function initPage(){const n=document.getElementById("w"),a=(worldBackgrounds.forEach(e=>{var t=document.createElement("option");t.value=e.value,t.textContent=e.text,n.appendChild(t)}),document.getElementById("bd").value=worldBackgrounds[0].desc,document.getElementById("np")),d=(perspectives.forEach(e=>{var t=document.createElement("option");t.value=e.value,t.textContent=e.text,a.appendChild(t)}),document.getElementById("gs")),l=(genders.forEach(e=>{var t=document.createElement("option");t.value=e.value,t.textContent=e.text,d.appendChild(t)}),document.getElementById("bts")),o=(bodyTypes.forEach(e=>{var t=document.createElement("div");t.className="bo",t.dataset.value=e,t.textContent=e,t.addEventListener("click",function(){document.getElementById("cb").value=e,l.classList.remove("active")}),l.appendChild(t)}),document.getElementById("xg")),c=(xpGroups.forEach(e=>{var t=document.createElement("div");t.className="xg-title",t.textContent=e.title,o.appendChild(t);const n=document.createElement("div");n.className="xg-items"，e.options.forEach(t=>{var e=document.createElement("div");e.className="xi",e.dataset.value=t,e.textContent=t,e.addEventListener("click",function(){var e=document.getElementById("cx");e.value?e.value+=", "+t:e.value=t}),n.appendChild(e)}),o.appendChild(n)}),document.getElementById("abs"));abilities.forEach(a=>{var e=document.createElement("div");e.className="ao",e.textContent=a,e.addEventListener("click"，function(){var e=document.getElementById("ca2")，t=e。value?e。value。split(", ")。filter(Boolean):[];if(t。length<3)t。includes(a)||(0<t。length?e.value+=", "+a:e。value=a);else{const n=document。getElementById("toast");n。textContent="最多只能选择3个能力"，n。classList。add("show")，setTimeout(()=>n。classList。remove("show")，3e3)}c。classList。remove("active")})，c。appendChild(e)})，createBubbles()}document。getElementById("w")。addEventListener("change"，function(){var e=document。getElementById("cwc")，t=document。getElementById("bd");"custom"===this。value?(t。readOnly=!1，t.value=""，t。placeholder="请输入自定义世界背景描述..."):(e。classList。add("h")，t.readOnly=!0，e=worldBackgrounds。find(e=>e。value===this。value)，t。value=e.desc)});const bodyInput=document。getElementById("cb")，bodySelect=document。getElementById("bts")，bodyDropdownBtn=document.getElementById("bdb")，abilitySelect=(bodyDropdownBtn。addEventListener("click"，function(e){e。stopPropagation()，bodySelect。classList。toggle("active")})，document。addEventListener("click"，function(e){bodySelect。contains(e。target)||e。target===bodyDropdownBtn||bodySelect。classList.remove("active")})，document.getElementById("abs"))，abilityDropdownBtn=document.getElementById("adb")，rulesContainer=(abilityDropdownBtn。addEventListener("click"，function(e){e。stopPropagation()，abilitySelect。classList.toggle("active")})，document。addEventListener("click"，function(e){abilitySelect.contains(e。target)||e。target===abilityDropdownBtn||abilitySelect.classList.remove("active")})，document。getElementById("rc"))，addRuleBtn=document.getElementById("arb");let ruleCount=0;const maxRules=3,toggleDetailsBtn=(addRuleBtn.addEventListener("click",function(){var e;ruleCount>=maxRules||((e=document.createElement("div")).className="ri",e.innerHTML=`
<input type="text" class="f1" placeholder="请输入世界规则...">
<button class="b bsm bd drb">-</button>
`，rulesContainer.appendChild(e),++ruleCount>=maxRules&&(addRuleBtn.disabled=!0))}),rulesContainer.addEventListener("click",function(e){e.target.classList.contains("drb")&&(e.target.closest(".ri").remove(),ruleCount--,addRuleBtn.disabled=!1)}),document.getElementById("tdb")),characterDetails=document.getElementById("cd"),simpleDescriptionContainer=document.getElementById("sdc"),xpModal=(toggleDetailsBtn.addEventListener("click",function(){characterDetails.classList.contains("h")?(characterDetails.classList.remove("h")，simpleDescriptionContainer.classList.add("h"),this.innerHTML="<i>▲</i> 收起详细设定"):(characterDetails.classList.add("h"),simpleDescriptionContainer.classList.remove("h"),this.innerHTML="<i>▼</i> 人物详细设定")}),document.getElementById("xm")),overlay=document.getElementById("o"),xpModalBtn=document.getElementById("xmb"),closeXpModal=document.getElementById("cxm"),behaviorContainer=(xpModalBtn.addEventListener("click",function(){xpModal.classList.remove("h"),overlay.classList.remove("h")}),closeXpModal.addEventListener("click"，function(){xpModal.classList.add("h"),overlay.classList.add("h")}),overlay.addEventListener("click",function(){xpModal.classList.add("h"),this.classList.add("h")}),document.getElementById("bc2")),addBehaviorBtn=document.getElementById("abb");let behaviorCount=0;const maxBehaviors=15,saveBtn=(addBehaviorBtn.addEventListener("click",function(){var e;behaviorCount>=maxBehaviors||((e=document.createElement("div")).className="ri",e.innerHTML=`
<input type="text" class="f1" placeholder="请输入行为模式...">
<button class="b bsm bd dbb">-</button>
`，behaviorContainer.appendChild(e),++behaviorCount>=maxBehaviors&&(addBehaviorBtn.disabled=!0))}),behaviorContainer.addEventListener("click",function(e){e.target.classList.contains("dbb")&&(e.target.closest(".ri").remove(),behaviorCount--,addBehaviorBtn.disabled=!1)}),document.getElementById("sb")),toast=document.getElementById("toast");function createBubbles(){var t=document.getElementById("bubbles");for(let e=0;e<20;e++){var n=document.createElement("div"),a=(n.classList.add("bubble"),90*Math.random()+20)，d=100*Math.random(),l=12*Math.random()+5,o=5*Math.random();n.style.width=a+"px",n.style.height=a+"px",n.style.left=d+"%",n.style.animationDuration=l+"s",n.style.animationDelay=o+"s",t.appendChild(n)}}saveBtn.addEventListener("click",function(){let n="";n+="# 世界背景\n";var e,t,a=document.getElementById("w"),d=a.options[a.selectedIndex].text,a=(n=(n+="custom"===a.value?document.getElementById("cw").value+"\n":d+"\n")+(document.getElementById("bd").value+"\n")+"\n# 世界规则\n",document.querySelectorAll(".ri input"))，d=(a.forEach((e,t)=>{e.value.trim()&&(n+=`${t+1}. ${e.value}\n`)}),0===a.length&&(n+="无特殊规则\n"),n+="\n# 系统注册\n",document.getElementById("sa").value),a=(n=n+(d||"无系统能力\n")+"\n# 主要角色\n",document.getElementById("cn").value||"未命名"),d=document.getElementById("cg").value||"未指定",l=document.getElementById("ca").value||"18",o=document.getElementById("cb").value||"未描述",l=(n+=`姓名：${a}
性别：${d}
年龄：${l}
身材：${o}
`，characterDetails.classList.contains("h")?(a=document.getElementById("cs").value).trim()&&(n+=`描述：${a}
`):(n+="\n## 详细设定\n",d=document.getElementById("cc").value,l=document.getElementById("cbg").value,o=document.getElementById("ce").value,a=document.getElementById("ci").value,e=document.getElementById("cx").value,t=document.getElementById("ca2").value,d.trim()&&(n+=`穿着：${d}
`)，l.trim()&&(n+=`背景：${l}
`)，o.trim()&&(n+=`外在人设：${o}
`)，a.trim()&&(n+=`内在人设：${a}
`)，e.trim()&&(n+=`XP：${e}
`)，0<(d=document.querySelectorAll("#bc2 input")).length&&(n+="行为模式：\n",d.forEach(e=>{e.value.trim()&&(n+=`- ${e.value}
`)}))，t.trim()&&(n+=`能力：${t}
`))，n+="\n# 其他设定\n",document.getElementById("np")),o=l.options[l.selectedIndex].text;n+=`人称：${o}
`，navigator.clipboard.writeText(n).then(()=>{toast.textContent="设定内容已复制到剪贴板，即将关闭窗口...",toast.classList.add("show"),setTimeout(()=>{window.close()},2e3)}).catch(e=>{alert("复制失败: "+e)})}),document.addEventListener("DOMContentLoaded",initPage);
