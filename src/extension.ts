import * as vscode from "vscode";
import * as path from "path";
import dayjs from "dayjs"; // 导入 moment.js

// 辅助函数：获取插件配置
function getConfig() {
  return vscode.workspace.getConfiguration("myFileHeader");
}

// 辅助函数：根据语言ID获取对应的文件头模板
function getHeaderTemplate(languageId: string): string {
  const config = getConfig();
  const languageTemplates = config.get<{ [key: string]: string }>(
    "languageTemplates",
    {}
  );

  // 优先使用语言特定模板
  if (languageTemplates[languageId]) {
    return languageTemplates[languageId];
  }

  // 回退到默认模板
  return config.get<string>("defaultTemplate", "");
}

// 辅助函数：构建最终的文件头字符串
function buildHeader(document: vscode.TextDocument): string {
  const config = getConfig();
  const template = getHeaderTemplate(document.languageId);

  // 获取配置值，提供默认值
  const author = config.get<string>("author", "Your Name");
  const version = config.get<string>("version", "1.0.0");
  const description = config.get<string>(
    "description",
    "A brief description of the file."
  );
  const fileName = path.basename(document.uri.fsPath);
  const dateFormat = config.get<string>("dateFormat", "YYYY-MM-DD");
  const date = dayjs().format(dateFormat); // 使用 dayjs 格式化日期

  let header = template;
  // 替换占位符
  header = header.replace(/\$\{fileName\}/g, fileName);
  header = header.replace(/\$\{author\}/g, author);
  header = header.replace(/\$\{date\}/g, date);
  header = header.replace(/\$\{version\}/g, version);
  header = header.replace(/\$\{description\}/g, description);

  return header;
}

// 辅助函数：检查文件是否已经包含文件头
function hasHeader(document: vscode.TextDocument): boolean {
  // 简单检查：查看文件前几行是否包含常见的头部标识符
  // 限制检查行数，避免读取大文件全部内容影响性能
  const firstLines = document.getText(
    new vscode.Range(0, 0, Math.min(document.lineCount, 10), 0)
  );
  // 使用不区分大小写的正则匹配
  return /@file|@author|@date|Version:|Description:|Created by:/i.test(
    firstLines
  );
}

// 辅助函数：判断当前文档是否应该被处理
function shouldProcessDocument(document: vscode.TextDocument): boolean {
  const config = getConfig();

  // 1. 检查插件是否已启用
  if (!config.get<boolean>("enabled", true)) {
    return false;
  }

  // 2. 排除特定语言
  const excludeLanguages = config.get<string[]>("excludeLanguages", []);
  if (excludeLanguages.includes(document.languageId)) {
    return false;
  }

  // 3. 检查文件大小，排除过大的文件
  const maxFileSizeKB = config.get<number>("maxFileSizeKB", 20);
  if (document.getText().length > maxFileSizeKB * 1024) {
    // console.log(`File ${document.fileName} is too large (${document.getText().length / 1024}KB) to process.`);
    return false;
  }

  // 4. 判断是否为新文件或空文件（或内容极少的文件）
  //    - document.isUntitled: 文件尚未保存到磁盘
  //    - document.getText().trim().length === 0: 文件内容为空白
  //    - document.getText().length < 50: 文件内容非常少，可能是新创建的
  const isNewOrEmpty =
    document.isUntitled ||
    document.getText().trim().length === 0 ||
    document.getText().length < 50;

  // 5. 如果不是新文件/空文件，则检查是否已存在文件头
  if (!isNewOrEmpty && hasHeader(document)) {
    // console.log(`File ${document.fileName} already has a header.`);
    return false; // 已经有文件头，无需再次插入
  }

  // 如果是新文件/空文件，或者是一个现有文件但没有文件头（且通过了其他检查），则应该处理
  return true;
}

export function activate(context: vscode.ExtensionContext) {
  console.log("My File Header Extension is now active!");

  // 注册 onWillSaveTextDocument 监听器
  const disposableOnWillSave = vscode.workspace.onWillSaveTextDocument(
    async (event) => {
      const document = event.document;

      // 判断是否应该处理当前文档
      if (!shouldProcessDocument(document)) {
        return;
      }

      try {
        // 构建文件头
        const header = buildHeader(document);

        // 创建一个 TextEdit，在文件开头插入文件头
        const edit = vscode.TextEdit.insert(new vscode.Position(0, 0), header);

        // 使用 event.waitUntil 确保在文件保存前应用修改
        event.waitUntil(Promise.resolve([edit]));
        // vscode.window.showInformationMessage(`File header added to ${path.basename(document.uri.fsPath)}`);
      } catch (error) {
        console.error("Error inserting file header:", error);
        vscode.window.showErrorMessage(
          `Failed to insert file header: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  );

  // 可选：注册一个手动插入文件头的命令
  const disposableCommand = vscode.commands.registerCommand(
    "myFileHeader.insertHeader",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active text editor found.");
        return;
      }

      const document = editor.document;

      // 检查是否已存在文件头
      if (hasHeader(document)) {
        vscode.window.showInformationMessage(
          "File already contains a header. No new header inserted."
        );
        return;
      }

      try {
        const header = buildHeader(document);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(document.uri, new vscode.Position(0, 0), header);
        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage("File header inserted manually.");
      } catch (error) {
        console.error("Error inserting file header manually:", error);
        vscode.window.showErrorMessage(
          `Failed to insert file header manually: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  );

  // 将所有 disposable 对象添加到 context.subscriptions，以便在插件停用时自动清理
  context.subscriptions.push(disposableOnWillSave, disposableCommand);
}

// 当插件停用时调用
export function deactivate() {
  console.log("My File Header Extension is deactivated.");
}
