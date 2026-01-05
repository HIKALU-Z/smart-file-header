import * as vscode from "vscode";
import * as cp from "child_process";
import { promisify } from "util";

const exec = promisify(cp.exec);

// 定义不同语言的注释模板
const TEMPLATES: Record<string, string> = {
  javascript: `/**
 * @Author: {{author}}
 * @Email: {{email}}
 * @Date: {{createTime}}
 * @LastEditors: {{author}}
 * @LastEditTime: {{lastEditTime}}
 * @Copyright: {{author}} All Rights Reserved
 * @Description: 
 */`,
  typescript: `/**
 * @Author: {{author}}
 * @Email: {{email}}
 * @Date: {{createTime}}
 * @LastEditors: {{author}}
 * @LastEditTime: {{lastEditTime}}
 * @Copyright: {{author}} All Rights Reserved
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

// 新增：工具函数，用于生成完整的头部注释字符串
async function generateFullHeader(
  languageId: string,
  config: vscode.WorkspaceConfiguration,
  isForNewFile: boolean = false
): Promise<string | null> {
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
  const timeFormat = config.get("dateFormat", "YYYY-MM-DD HH:mm:ss");
  const createTime = isForNewFile ? formatDate(now, timeFormat) : ""; // 对于旧文件，我们可能不想预设创建时间
  const lastEditTime = formatDate(now, timeFormat);

  // 3. 获取模板
  const template = TEMPLATES[languageId];
  if (!template) {
    return null;
  }

  // 4. 渲染模板
  let header = template
    .replace(/{{author}}/g, author)
    .replace(/{{email}}/g, email)
    .replace(/{{createTime}}/g, createTime)
    .replace(/{{lastEditTime}}/g, lastEditTime);

  return header;
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
// 修改原有的 insertHeaderComment 函数，让它复用新函数
async function insertHeaderComment(editor: vscode.TextEditor) {
  const config = vscode.workspace.getConfiguration("smartFileHeader");
  const document = editor.document;
  const languageId = document.languageId;

  const header = await generateFullHeader(languageId, config, true);
  if (!header) {
    vscode.window.showWarningMessage(
      `No header template for language: ${languageId}`
    );
    return;
  }

  const firstLine = document.lineAt(0);
  await editor.edit((editBuilder) => {
    editBuilder.insert(firstLine.range.start, header + "\n\n");
  });
}
// 新增：工具函数，用于检测文件是否已有我们的文件头
function hasExistingHeader(
  text: string,
  maxLinesToCheck: number = 20
): boolean {
  const lines = text.split("\n").slice(0, maxLinesToCheck);
  // 检查是否存在我们特有的标记
  return lines.some(
    (line) =>
      line.includes("@Author") ||
      line.includes("@Date:") ||
      line.includes("@LastEditors") ||
      line.includes("@LastEditTime")
  );
}

// 核心：更新已存在的头部注释
// 重写 updateHeaderComment 函数
async function updateHeaderComment(document: vscode.TextDocument) {
  const config = vscode.workspace.getConfiguration("smartFileHeader");
  const shouldAutoInsert = config.get<boolean>("autoInsertOnSave", false);

  // 如果既不更新也不自动插入，直接退出
  const shouldUpdateLastEditors = config.get<boolean>("lastEditors", true);
  const shouldUpdateLastEditTime = config.get<boolean>("lastEditTime", true);
  if (
    !shouldUpdateLastEditors &&
    !shouldUpdateLastEditTime &&
    !shouldAutoInsert
  ) {
    return;
  }

  const text = document.getText();
  const languageId = document.languageId;

  // 1. 首先，检查文件是否已经有我们的文件头
  const alreadyHasHeader = hasExistingHeader(text);

  // 2. 如果没有文件头，并且启用了自动插入
  if (!alreadyHasHeader && shouldAutoInsert) {
    // 判断是新文件还是旧文件
    const isNewFile = text.trim() === "";

    // 生成完整的头部注释
    const fullHeader = await generateFullHeader(languageId, config, isNewFile);
    if (fullHeader) {
      // 构建新文本：头部 + 原有内容
      const newText = fullHeader + "\n\n" + text;

      // 应用编辑
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text.length)
      );
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, fullRange, newText);
      await vscode.workspace.applyEdit(edit);
      // 插入后直接返回，无需再执行更新逻辑
      return;
    }
  }

  // 3. 如果已经有文件头，则执行原有的更新逻辑
  if (alreadyHasHeader) {
    let updatedText = text;
    const now = new Date();
    const formattedTime = formatDate(
      now,
      config.get("dateFormat", "YYYY-MM-DD HH:mm:ss")
    );

    if (shouldUpdateLastEditTime) {
      const timeRegex = /(\*\s*@LastEditTime:\s*|\#\s*@LastEditTime:\s*)\S.*$/m;
      if (timeRegex.test(updatedText)) {
        updatedText = updatedText.replace(timeRegex, `$1${formattedTime}`);
      }
    }

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
