# Search++
![](./screenshots/1.gif)

This is plugin is based on the code of [mrj-text-expand](https://github.com/nhaouari/obsidian-text-expand), it inserts the found results on the note you're working on. 

## Install
- If you have previous versions of plugin - remove them
- You need Obsidian v0.9.7+
- Get [Latest release]()
- Extract files and place them to your vault's plugins folder: `<vault>/.obsidian/plugins/`
- Reload Obsidian
- If prompted about Safe Mode, you can disable safe mode and enable the plugin. Otherwise head to Settings, third-party plugins, make sure safe mode is off and enable the plugin from there.


## How to use

-   Type `{{SEARCH_TEXT/NUMBER_OF_CHARS}}` in your note where `SEARCH_TEXT` a text which you want to search, and NUMBER_OF_CHARS is the number of chars before and after the found text you want to extract. 

Examples: `{{My Note/300}}`, `{{tag:#tag/500}}`.
-   Put a cursor on that line
-   Open command palette and find `Search++:` commands (you can attach hotkeys in settings menu)

It should wrap the `{{ }}` line and add notes which was found below.
You can call command in a `{{ }}` line to update results.
