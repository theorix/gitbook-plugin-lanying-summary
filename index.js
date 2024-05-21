const fs = require('fs');
const path = require('path');
const Summary = require('gitbook-summary');

module.exports = {
  hooks: {
    'init': function() {
      const logger = this.log; // 获取日志记录器

      // 获取当前 GitBook 根目录
      const rootPath = this.book.root;
      const summaryPath = path.join(rootPath, 'SUMMARY.md');

      // 读取 SUMMARY.md 文件内容
      let summaryContent = fs.readFileSync(summaryPath, 'utf-8');

      // 定义占位符的正则表达式
      const placeholderRegex = /{% lanying_summary dir="([^"]+)" %}/g;
      let match;

      // 查找并替换所有占位符
      while ((match = placeholderRegex.exec(summaryContent)) !== null) {
        const relativeSubdirectoryPath = match[1];
        const subdirectoryPath = path.join(rootPath, relativeSubdirectoryPath);

        if (fs.existsSync(subdirectoryPath) && fs.statSync(subdirectoryPath).isDirectory()) {
          // 递归获取子目录中的所有 Markdown 文件并生成 SUMMARY 结构
          const summaryItems = generateSummaryItems(subdirectoryPath, relativeSubdirectoryPath);
          const summaryText = summaryItems.join('\n');
          
          // 替换占位符
          summaryContent = summaryContent.replace(match[0], summaryText);
          logger.info(`Replaced placeholder for directory: ${relativeSubdirectoryPath}`);
        } else {
          logger.warn(`Directory not found: ${subdirectoryPath}`);
        }
      }

      // 将新的 SUMMARY.md 内容写回文件（仅在内存中，不实际写入文件系统）
      this.summary = new Summary.parse(summaryContent);
    }
  }
};

// 递归遍历目录，生成 SUMMARY 项目列表
function generateSummaryItems(dirPath, relativePath) {
  let summaryItems = [];
  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const itemRelativePath = path.join(relativePath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // 如果是目录，递归处理
      const subSummaryItems = generateSummaryItems(itemPath, itemRelativePath);
      summaryItems.push(`* [${item}](#)`);
      summaryItems = summaryItems.concat(subSummaryItems.map(subItem => '  ' + subItem));
    } else if (stat.isFile() && item.endsWith('.md')) {
      // 如果是 Markdown 文件，添加到 SUMMARY
      summaryItems.push(`* [${path.basename(item, '.md')}](${itemRelativePath.replace(/\\/g, '/')})`);
    }
  });

  return summaryItems;
}
