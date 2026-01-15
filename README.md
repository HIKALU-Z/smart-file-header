# smart-file-header README

A simple VS Code extension to automatically add and update file headers with metadata such as author, date, and description.

## Features

- Automatically inserts a customizable file header when a new file is created.
- Updates the "Last Modified" date each time the file is saved.
- Supports JS/TS programming languages with configurable header formats.

## Extension Settings

This extension contributes the following settings:
you can customize these settings in your VS Code settings.json file.

- "smartFileHeader.author": The author of the file it will default use git config user.name.
- "smartFileHeader.email": The email of the author it will default use git email.
- "smartFileHeader.description": use boolean to control whether to add a description field.
- "smartFileHeader.copyright": use boolean to control whether to add the copyright notice for the file.
- "smartFileHeader.dateFormat": use `YYYY-MM-DD HH:mm:ss` format strings to customize date formats.
- "smartFileHeader.autoInsertOnSave": use boolean to control whether to automatically insert the file header on save.
- "smartFileHeader.alignFields": use boolean to control whether to align the header fields for better readability.
- "smartFileHeader.useColonInFields": use boolean to control whether to use a colon after header fields (e.g., '@Author: name' vs '@Author name').

### 1.0.0

- Initial release with basic functionality for JS/TS files.

### 1.0.1

- update readme.md and logo
- add alignFields setting to control whether to align the header fields.
- add useColonInFields setting to control whether to use a colon after header fields.

---

## 中文版说明文档

一个简单的 VS Code 扩展，可自动添加和更新文件头部的元数据，包括作者、日期和描述。

## 功能特性

- 在创建新文件时自动插入可自定义的文件头部。
- 每次保存文件时更新"最后修改"日期。
- 支持 JS/TS 编程语言，可配置头部格式。

## 扩展设置

此扩展提供以下设置：
您可以在 VS Code 的 settings.json 文件中自定义这些设置。

- `smartFileHeader.author`: 文件作者，默认为 git config user.name。
- `smartFileHeader.email`: 作者邮箱，默认为 git email。
- `smartFileHeader.description`: 使用布尔值控制是否添加描述字段。
- `smartFileHeader.copyright`: 使用布尔值控制是否添加文件版权声明。
- `smartFileHeader.dateFormat`: 使用 `YYYY-MM-DD HH:mm:ss` 格式字符串自定义日期格式。
- `smartFileHeader.autoInsertOnSave`: 使用布尔值控制是否在保存时自动插入文件头部。
- `smartFileHeader.alignFields`: 使用布尔值控制是否对齐头部字段以提高可读性。
- `smartFileHeader.useColonInFields`: 使用布尔值控制是否在头部字段后使用冒号（例如：'@Author: name' vs '@Author name'）。

### 1.0.0

- 初始发布，提供 JS/TS 文件的基本功能。

### 1.0.1

- 更新 readme.md 和 logo

### 1.0.2

- 增加 alignFields 设置，用于控制是否对齐头部字段。

### 1.0.3

- 增加 useColonInFields 设置，用于控制是否在头部字段后使用冒号。

### 1.0.4

- 增加 release-it 配置，用于自动化发布流程。
- 增加 textMate 支持
  如果你需要配置注释中的一些字段的颜色，可以在`settings.json`中修改，参考下面的配置示例：

```json
"editor.tokenColorCustomizations": {
  "textMateRules": [
    {
      "scope": "keyword.control.fileheader.field",
      "settings": { "foreground": "#C586C0", "fontStyle": "bold" }
    },
    {
      "scope": "constant.other.datetime.fileheader",
      "settings": { "foreground": "#B5CEA8" }
    },
    {
      "scope": "constant.other.email.fileheader",
      "settings": { "foreground": "#4EC9B0" }
    }
  ]
}
```
