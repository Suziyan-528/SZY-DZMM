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
function initPage() { const worldSelect = document.getElementById('w'); worldBackgrounds.forEach(bg => { const option = document.createElement('option'); option.value = bg.value; option.textContent = bg.text; worldSelect.appendChild(option); }); document.getElementById('bd').value = worldBackgrounds[0].desc; const perspectiveSelect = document.getElementById('np'); perspectives.forEach(p => { const option = document.createElement('option'); option.value = p.value; option.textContent = p.text; perspectiveSelect.appendChild(option); }); const genderSelect = document.getElementById('gs'); genders.forEach(g => { const option = document.createElement('option'); option.value = g.value; option.textContent = g.text; genderSelect.appendChild(option); }); const bodySelect = document.getElementById('bts'); bodyTypes.forEach(type => { const option = document.createElement('div'); option.className = 'bo'; option.dataset.value = type; option.textContent = type; option.addEventListener('click', function() { document.getElementById('cb').value = type; bodySelect.classList.remove('active'); }); bodySelect.appendChild(option); }); const xpGrid = document.getElementById('xg'); xpGroups.forEach(group => { const title = document.createElement('div'); title.className = 'xg-title'; title.textContent = group.title; xpGrid.appendChild(title); const itemsContainer = document.createElement('div'); itemsContainer.className = 'xg-items'; group.options.forEach(xp => { const item = document.createElement('div'); item.className = 'xi'; item.dataset.value = xp; item.textContent = xp; item.addEventListener('click', function() { const xpInput = document.getElementById('cx'); if (xpInput.value) { xpInput.value += ', ' + xp; } else { xpInput.value = xp; } }); itemsContainer.appendChild(item); }); xpGrid.appendChild(itemsContainer); }); const abilitySelect = document.getElementById('abs'); abilities.forEach(ability => { const option = document.createElement('div'); option.className = 'ao'; option.textContent = ability; option.addEventListener('click', function() { const abilityInput = document.getElementById('ca2'); const currentAbilities = abilityInput.value ? abilityInput.value.split(', ').filter(Boolean) : []; if (currentAbilities.length < 3) { if (!currentAbilities.includes(ability)) { if (currentAbilities.length > 0) { abilityInput.value += ', ' + ability; } else { abilityInput.value = ability; } } } else { const toast = document.getElementById('toast'); toast.textContent = '最多只能选择3个能力'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); } abilitySelect.classList.remove('active'); }) abilitySelect.appendChild(option); }); createBubbles(); } document.getElementById('w').addEventListener('change', function() { const customContainer = document.getElementById('cwc'); const bgDesc = document.getElementById('bd'); if (this.value === 'custom') { bgDesc.readOnly = false; bgDesc.value = ''; bgDesc.placeholder = "请输入自定义世界背景描述..."; } else { customContainer.classList.add('h'); bgDesc.readOnly = true; const selectedBg = worldBackgrounds.find(bg => bg.value === this.value); bgDesc.value = selectedBg.desc; } }); const bodyInput = document.getElementById('cb'); const bodySelect = document.getElementById('bts'); const bodyDropdownBtn = document.getElementById('bdb'); bodyDropdownBtn.addEventListener('click', function(e) { e.stopPropagation(); bodySelect.classList.toggle('active'); }); document.addEventListener('click', function(e) { if (!bodySelect.contains(e.target) && e.target !== bodyDropdownBtn) { bodySelect.classList.remove('active'); } }); const abilitySelect = document.getElementById('abs'); const abilityDropdownBtn = document.getElementById('adb'); abilityDropdownBtn.addEventListener('click', function(e) { e.stopPropagation(); abilitySelect.classList.toggle('active'); }); document.addEventListener('click', function(e) { if (!abilitySelect.contains(e.target) && e.target !== abilityDropdownBtn) { abilitySelect.classList.remove('active'); } }); const rulesContainer = document.getElementById('rc'); const addRuleBtn = document.getElementById('arb'); let ruleCount = 0; const maxRules = 3; addRuleBtn.addEventListener('click', function() { if (ruleCount >= maxRules) return; const ruleItem = document.createElement('div'); ruleItem.className = 'ri'; ruleItem.innerHTML = ` <input type="text" class="f1" placeholder="请输入世界规则..."> <button class="b bsm bd drb">-</button> `; rulesContainer.appendChild(ruleItem); ruleCount++; if (ruleCount >= maxRules) { addRuleBtn.disabled = true; } }); rulesContainer.addEventListener('click', function(e) { if (e.target.classList.contains('drb')) { e.target.closest('.ri').remove(); ruleCount--; addRuleBtn.disabled = false; } }); const toggleDetailsBtn = document.getElementById('tdb'); const characterDetails = document.getElementById('cd'); const simpleDescriptionContainer = document.getElementById('sdc'); toggleDetailsBtn.addEventListener('click', function() { if (characterDetails.classList.contains('h')) { characterDetails.classList.remove('h'); simpleDescriptionContainer.classList.add('h'); this.innerHTML = '<i>▲</i> 收起详细设定'; } else { characterDetails.classList.add('h'); simpleDescriptionContainer.classList.remove('h'); this.innerHTML = '<i>▼</i> 人物详细设定'; } }); const xpModal = document.getElementById('xm'); const overlay = document.getElementById('o'); const xpModalBtn = document.getElementById('xmb'); const closeXpModal = document.getElementById('cxm'); xpModalBtn.addEventListener('click', function() { xpModal.classList.remove('h'); overlay.classList.remove('h'); }); closeXpModal.addEventListener('click', function() { xpModal.classList.add('h'); overlay.classList.add('h'); }); overlay.addEventListener('click', function() { xpModal.classList.add('h'); this.classList.add('h'); }); const behaviorContainer = document.getElementById('bc2'); const addBehaviorBtn = document.getElementById('abb'); let behaviorCount = 0; const maxBehaviors = 15; addBehaviorBtn.addEventListener('click', function() { if (behaviorCount >= maxBehaviors) return; const behaviorItem = document.createElement('div'); behaviorItem.className = 'ri'; behaviorItem.innerHTML = ` <input type="text" class="f1" placeholder="请输入行为模式..."> <button class="b bsm bd dbb">-</button> `; behaviorContainer.appendChild(behaviorItem); behaviorCount++; if (behaviorCount >= maxBehaviors) { addBehaviorBtn.disabled = true; } }); behaviorContainer.addEventListener('click', function(e) { if (e.target.classList.contains('dbb')) { e.target.closest('.ri').remove(); behaviorCount--; addBehaviorBtn.disabled = false; } }); const saveBtn = document.getElementById('sb'); const toast = document.getElementById('toast'); saveBtn.addEventListener('click', function() { let output = ""; output += "# 世界背景\n"; const worldBg = document.getElementById('w'); const bgOption = worldBg.options[worldBg.selectedIndex].text; if (worldBg.value === 'custom') { output += document.getElementById('cw').value + "\n"; } else { output += bgOption + "\n"; } output += document.getElementById('bd').value + "\n"; output += "\n# 世界规则\n"; const rules = document.querySelectorAll('.ri input'); rules.forEach((rule, index) => { if (rule.value.trim()) { output += `${index + 1}. ${rule.value}\n`; } }); if (rules.length === 0) { output += "无特殊规则\n"; } output += "\n# 系统注册\n"; const systemAbility = document.getElementById('sa').value; output += systemAbility || "无系统能力\n"; output += "\n# 主要角色\n"; const charName = document.getElementById('cn').value || "未命名"; const charGender = document.getElementById('cg').value || "未指定"; const charAge = document.getElementById('ca').value || "18"; const charBody = document.getElementById('cb').value || "未描述"; output += `姓名：${charName}\n性别：${charGender}\n年龄：${charAge}\n身材：${charBody}\n`; if (characterDetails.classList.contains('h')) { const simpleDesc = document.getElementById('cs').value; if (simpleDesc.trim()) { output += `描述：${simpleDesc}\n`; } } else { output += "\n## 详细设定\n"; const clothing = document.getElementById('cc').value; const background = document.getElementById('cbg').value; const exterior = document.getElementById('ce').value; const interior = document.getElementById('ci').value; const xp = document.getElementById('cx').value; const ability = document.getElementById('ca2').value; if (clothing.trim()) output += `穿着：${clothing}\n`; if (background.trim()) output += `背景：${background}\n`; if (exterior.trim()) output += `外在人设：${exterior}\n`; if (interior.trim()) output += `内在人设：${interior}\n`; if (xp.trim()) output += `XP：${xp}\n`; const behaviors = document.querySelectorAll('#bc2 input'); if (behaviors.length > 0) { output += "行为模式：\n"; behaviors.forEach(behavior => { if (behavior.value.trim()) { output += `- ${behavior.value}\n`; } }); } if (ability.trim()) output += `能力：${ability}\n`; } output += "\n# 其他设定\n"; const perspective = document.getElementById('np'); const perspOption = perspective.options[perspective.selectedIndex].text; output += `人称：${perspOption}\n`; const platformInput = document.getElementById('cmt'); if (platformInput) { platformInput.value = output; toast.classList.add('show'); setTimeout(() => { toast.classList.remove('show'); }, 3000); } else { alert("未找到输入框！设定内容已复制到剪贴板。\n\n" + output); navigator.clipboard.writeText(output); } }); function createBubbles() { const container = document.getElementById('bubbles'); const count = 20; for (let i = 0; i < count; i++) { const bubble = document.createElement('div'); bubble.classList.add('bubble'); const size = Math.random() * 90 + 20; const left = Math.random() * 100; const duration = Math.random() * 12 + 5; const delay = Math.random() * 5; bubble.style.width = `${size}px`; bubble.style.height = `${size}px`; bubble.style.left = `${left}%`; bubble.style.animationDuration = `${duration}s`; bubble.style.animationDelay = `${delay}s`; container.appendChild(bubble); } } document.addEventListener('DOMContentLoaded', initPage);
