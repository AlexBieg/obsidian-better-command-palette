# Obsidian Better Command Palette
A plugin for Obsidian that adds a command palatte that is more user friendly and more feature rich. Use `cmd+shift+p` to to open the palette.

## Features
### Backspace to close
When the palette has no text entered into the input and you press backspace, then the palette will close. This can be turned off in the settings.

### Recent Choices
Choices that have been recently used will bubble up to the top of the command list.

### Pinned Commands
Commands that have been pinned in the default `Command Palette` will be pinned here as well.

### File Opening
Better Command Palette allows you to open files from the same input without needing to run a command or press `cmd+o first`. Once the palette is open just type `/` (This can be changed in the settings) and you will be searching files to open. Press `enter` to open the file in the active pane or prese `cmd+enter` to open the file in a new pane.

### File Creation
If after searching for files to open there are no results you may press `cmd+enter` to create a file with the same name as you have entered. You may specify directories. If the directory path does not exist it will create it.

### File Searching using Tags
Better Command Palette allows you to find and open files that contain the tags you search for.
Type `#` (configurable in the settings) to begin searching for files that have that tag. Press enter to open the selected file.

### Macro Commands
Macros can be created in the settings tab for Better Command Palette. Each Macro must be give a name, delay, and at least one command. If any of these are not set the macro will not show up in the command palette.

The delay is the number of milliseconds the macro will wait between each command. This can be useful for commands that take some time to complete.

Any command can be added including other macro commands. Each command is run in sequence. At each step the macro will check if the next command can be run. Certain commands require certain conditions to be met. A an error message will be shown if a command could not be run. The macro will only be shown in the command palette if the first command can be run at that time.

Hotkeys can be assigned to the macro in the normal hotkey tab after the macro has been created.

## Development
### Project Setup
1. Clone the repo
2. Run `npm install`

### Development Build
Run `npm run dev`

This will create a directory named `test-vault` in your repo (automatically ignored by git). You can point obsidian to this directory and use it as a testing environment. Files are automatically watched and the dev server will restart when they are changed.

### Local Build
Run `npm run build-local`

This builds the plugin in production mode and copies the needed files to the root of the repo (automatically ignored by git). This is to allow people who wish to manually install the plugin on their machines to easily do so by copying the plugin to their plugin directory and running the command.

### Production Build
Run `npm run build`

Builds the plugin for production and puts all neccessary files into the `dist` directory. Pretty much only used by github actions for releases.