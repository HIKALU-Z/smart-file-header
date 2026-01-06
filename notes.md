# vs code 插件开发注意事项

## pnpm使用相关

如果开发插件时使用pnpm，需要注意以下几点

- README.md 文件不能与初始化仓库的文档相同，需要自己变更其中的内容
- pnpm 的 symlinks 与 vsce 不兼容，如果您的打包过程中出现类似 `npm ERR! missing` 这样的错误，可以尝试使用以下指令
  - 打包时可以使用`tsup src/extension.ts --format cjs --external vscode --no-shims`
- 发布时同理，可以采用以下指令
  - `npx @vscode/vsce publish --no-dependencies`

## 参考文章

- [vscode 插件开发示例](https://github.com/microsoft/vscode-extension-samples)
- [vscode 插件发布文档](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vscode 开发指南](https://juejin.cn/post/7250375753598894135)
