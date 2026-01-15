# vs code 插件开发注意事项

## pnpm使用相关

如果开发插件时使用pnpm，需要注意以下几点

- README.md 文件不能与初始化仓库的文档相同，需要自己变更其中的内容
- pnpm 的 symlinks 与 vsce 不兼容，如果您的打包过程中出现类似 `npm ERR! missing` 这样的错误，可以尝试使用以下指令
  - 打包时可以使用`tsup src/extension.ts --format cjs --external vscode --no-shims` 或者 `vsce package --no-dependencies`
- 发布时同理，可以采用以下指令
  - `npx @vscode/vsce publish --no-dependencies`

## 参考文章

- [vscode 插件开发示例](https://github.com/microsoft/vscode-extension-samples)
- [vscode 插件发布文档](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vscode 开发指南](https://juejin.cn/post/7250375753598894135)

## 优秀同类插件推荐
- [better-comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments) - 一个增强注释功能的插件，可以参考其注释解析方式。
- [file-header-comment](https://marketplace.visualstudio.com/items?itemName=stevencl.add-file-header-comment) - 一个功能类似的插件，可以参考其实现方式。
