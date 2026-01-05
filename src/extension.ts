import * as vscode from "vscode";
import * as cp from "child_process";
import { promisify } from "util";

const exec = promisify(cp.exec);

// 定义不同语言的注释模板
const TEMPLATES: Record<string, string> = {
  javascript: `/*
* @Author: {{author}}
* @Email: {{email}}
* @Date: {{createTime}}
* @LastEditors: {{author}}
* @LastEditTime: {{lastEditTime}}
* @Description: 
*/`,
  typescript: `/*
* @Author: {{author}}
* @Email: {{email}}
* @Date: {{createTime}}
* @LastEditors: {{author}}
* @LastEditTime: {{lastEditTime}}
* @Description: 
*/`,
  // 可以继续添加更多语言...
};

// 工具函数：格式化日期
function formatDate(date: Date, format: string): string {
  const map: Record<string, string> = {
    YYYY: date.getFullYear().toString(),
    MM: (date.getMonth() + 1).toString().padStart(2, "0"),
    DD: date.getDate().toString().padStart(2, "0"),
    HH: date.getHours().toString().padStart(2, "0"),
    mm: date.getMinutes().toString().padStart(2, "0"),
    ss: date.getSeconds().toString().padStart(2, "0"),
  };
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (matched) => map[matched]);
}

// 工具函数：尝试从 Git 获取用户名和邮箱
async function getGitUserInfo(): Promise<{ name: string; email: string }> {
  try {
    const { stdout: name } = await exec("git config user.name");
    const { stdout: email } = await exec("git config user.email");
    return { name: name.trim(), email: email.trim() };
  } catch (error) {
    console.warn("Failed to get git user info:", error);
    return { name: "", email: "" };
  }
}

// 核心：插入新的头部注释
async function insertHeaderComment(editor: vscode.TextEditor) {
  const config = vscode.workspace.getConfiguration("smartFileHeader");
  const document = editor.document;
  const languageId = document.languageId;

  // 1. 获取作者和邮箱
  let author = config.get<string>("author") || "";
  let email = config.get<string>("email") || "";

  if (!author || !email) {
    const gitInfo = await getGitUserInfo();
    author = author || gitInfo.name;
    email = email || gitInfo.email;
  }

  // 2. 获取时间
  const now = new Date();
  const createTime = formatDate(
    now,
    config.get("dateFormat", "YYYY-MM-DD HH:mm:ss")
  );
  const lastEditTime = createTime; // 新建时，创建时间和最后编辑时间相同

  // 3. 获取模板
  const template = TEMPLATES[languageId];
  if (!template) {
    vscode.window.showWarningMessage(
      `No header template for language: ${languageId}`
    );
    return;
  }

  // 4. 渲染模板
  let header = template
    .replace(/{{author}}/g, author)
    .replace(/{{email}}/g, email)
    .replace(/{{createTime}}/g, createTime)
    .replace(/{{lastEditTime}}/g, lastEditTime);

  // 5. 插入到文件顶部
  const firstLine = document.lineAt(0);
  await editor.edit((editBuilder) => {
    editBuilder.insert(firstLine.range.start, header + "\n\n");
  });
}

// 核心：更新已存在的头部注释
async function updateHeaderComment(document: vscode.TextDocument) {
  const config = vscode.workspace.getConfiguration("smartFileHeader");

  // 检查是否启用了自动更新
  const shouldUpdateLastEditors = config.get<boolean>("lastEditors", true);
  const shouldUpdateLastEditTime = config.get<boolean>("lastEditTime", true);

  if (!shouldUpdateLastEditors && !shouldUpdateLastEditTime) {
    return;
  }

  // 读取文件的前 N 行，寻找我们的注释标记
  const maxLinesToCheck = 20; // 只检查前20行，提高性能
  const text = document.getText();
  const lines = text.split("\n").slice(0, maxLinesToCheck);

  // 构建正则表达式来匹配需要更新的字段
  let updatedText = text;
  const now = new Date();
  const formattedTime = formatDate(
    now,
    config.get("dateFormat", "YYYY-MM-DD HH:mm:ss")
  );

  // 更新 LastEditTime
  if (shouldUpdateLastEditTime) {
    const timeRegex = /(\*\s*@LastEditTime:\s*|\#\s*@LastEditTime:\s*)\S.*$/m;
    if (timeRegex.test(updatedText)) {
      updatedText = updatedText.replace(timeRegex, `$1${formattedTime}`);
    }
  }

  // 更新 LastEditors (这里简化处理，直接用配置的作者)
  if (shouldUpdateLastEditors) {
    let author = config.get<string>("author") || "";
    if (!author) {
      const gitInfo = await getGitUserInfo();
      author = gitInfo.name;
    }
    if (author) {
      const editorsRegex =
        /(\*\s*@LastEditors:\s*|\#\s*@LastEditors:\s*)\S.*$/m;
      if (editorsRegex.test(updatedText)) {
        updatedText = updatedText.replace(editorsRegex, `$1${author}`);
      }
    }
  }

  // 如果文本有变化，则应用编辑
  if (updatedText !== text) {
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(text.length)
    );
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, fullRange, updatedText);
    await vscode.workspace.applyEdit(edit);
  }
}

// 主激活函数
export function activate(context: vscode.ExtensionContext) {
  // 1. 注册 "Insert Header" 命令
  const insertCmd = vscode.commands.registerCommand(
    "smart-file-header.insertHeader",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor!");
        return;
      }
      await insertHeaderComment(editor);
    }
  );

  // 2. 监听文件保存事件，用于自动更新
  const saveListener = vscode.workspace.onWillSaveTextDocument(
    async (event) => {
      // 只处理普通文件
      if (event.document.uri.scheme !== "file") {
        return;
      }
      await updateHeaderComment(event.document);
    }
  );

  context.subscriptions.push(insertCmd, saveListener);
}

export function deactivate() {
  vscode.window.showInformationMessage("smart header comment is closed!");
}
