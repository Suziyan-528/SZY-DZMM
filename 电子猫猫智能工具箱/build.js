const fs = require('fs');
const path = require('path');

// 主脚本文件路径
const mainScriptPath = path.join(__dirname, 'szy-dzmm.user.js');
// 输出文件路径
const outputPath = path.join(__dirname, 'dist', 'szy-dzmm.bundle.user.js');

// 读取主脚本文件
fs.readFile(mainScriptPath, 'utf8', (err, mainScriptContent) => {
    if (err) {
        console.error('读取主脚本文件时出错:', err);
        return;
    }

    // 提取导入语句
    const importRegex = /import \{?([^}]+)\}? from ['"]([^'"]+)['"];/g;
    let match;
    const importStatements = [];
    const importPaths = [];

    while ((match = importRegex.exec(mainScriptContent))!== null) {
        importStatements.push(match[0]);
        importPaths.push(match[2]);
    }

    // 移除导入语句
    mainScriptContent = mainScriptContent.replace(importRegex, '');

    // 读取导入的模块文件
    const moduleContents = [];
    importPaths.forEach((importPath) => {
        const modulePath = path.join(__dirname, importPath + '.js');
        try {
            const moduleContent = fs.readFileSync(modulePath, 'utf8');
            moduleContents.push(moduleContent);
        } catch (error) {
            console.error(`读取模块文件 ${modulePath} 时出错:`, error);
        }
    });

    // 合并所有内容
    const bundleContent = [
        ...importStatements,
        ...moduleContents,
        mainScriptContent
    ].join('\n');

    // 创建输出目录
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 写入打包后的文件
    fs.writeFile(outputPath, bundleContent, 'utf8', (err) => {
        if (err) {
            console.error('写入打包后的文件时出错:', err);
        } else {
            console.log('打包完成，输出文件:', outputPath);
        }
    });
});    
