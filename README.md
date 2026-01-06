# smart-file-header README

A simple VS Code extension to automatically add and update file headers with metadata such as author, date, and description.

## Features

- Automatically inserts a customizable file header when a new file is created.
- Updates the "Last Modified" date each time the file is saved.
- Supports JS/TS programming languages with configurable header formats.

## Extension Settings

This extension contributes the following settings:
you can customize these settings in your VS Code settings.json file.

- "smartFileHeader.author": The author of the file it will defalut use git config user.name.
- "smartFileHeader.email": The email of the author it will defalut use git email.
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

**Enjoy to Code!**
