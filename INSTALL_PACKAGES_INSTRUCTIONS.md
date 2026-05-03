# Install Required Packages - Instructions

## Issue
The Vite development server is showing an error because the required npm packages for Word and SVG download functionality are not installed:
- `docx` - For generating Word documents
- `file-saver` - For saving files to disk
- `@types/file-saver` - TypeScript definitions for file-saver

## Solution

### Option 1: Using Terminal (Recommended)
Open your terminal in the project root directory and run:

```bash
cd /home/nissi/bmi-ums
npm install docx file-saver @types/file-saver
```

### Option 2: Using WSL Terminal
If you're using WSL, open a WSL terminal and run:

```bash
cd ~/bmi-ums
npm install docx file-saver @types/file-saver
```

### Option 3: Add to package.json and Install
Alternatively, you can manually add these to your `package.json` dependencies section:

```json
"dependencies": {
  "@types/qrcode": "^1.5.6",
  "cors": "^2.8.6",
  "docx": "^8.5.0",
  "file-saver": "^2.0.5",
  "@types/file-saver": "^2.0.7",
  "express-rate-limit": "^8.2.1",
  ...
}
```

Then run:
```bash
npm install
```

## After Installation

Once the packages are installed:
1. The Vite error will disappear
2. The development server will reload automatically
3. The Word and SVG download buttons will work correctly

## Verification

To verify the packages are installed, check your `node_modules` directory:
```bash
ls node_modules | grep -E "docx|file-saver"
```

You should see:
- `docx`
- `file-saver`
- `@types` (containing file-saver)

## Package Details

### docx (v8.5.0+)
- **Purpose**: Generate Microsoft Word (.docx) documents
- **Size**: ~2.5 MB
- **License**: MIT
- **Documentation**: https://docx.js.org/

### file-saver (v2.0.5+)
- **Purpose**: Save files on the client-side
- **Size**: ~5 KB
- **License**: MIT
- **Documentation**: https://github.com/eligrey/FileSaver.js

### @types/file-saver (v2.0.7+)
- **Purpose**: TypeScript type definitions for file-saver
- **Size**: ~3 KB
- **License**: MIT

## Troubleshooting

### If npm is not found:
```bash
# Check if Node.js is installed
node --version
npm --version

# If not installed, install Node.js and npm
# For Ubuntu/Debian:
sudo apt update
sudo apt install nodejs npm
```

### If permission errors occur:
```bash
# Use sudo (not recommended for npm packages)
sudo npm install docx file-saver @types/file-saver

# OR fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### If installation is slow:
The packages will download approximately 3-4 MB of data. This may take a minute depending on your internet connection.

## Expected Output

After running the install command, you should see output similar to:
```
added 3 packages, and audited 234 packages in 15s

45 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

## Next Steps

After successful installation:
1. ✅ The Vite error will be resolved
2. ✅ Refresh your browser (Ctrl+R or Cmd+R)
3. ✅ Navigate to Transcripts section
4. ✅ Click on a student to view their transcript
5. ✅ Test the new Word and SVG download buttons

## Status Check

Run this command to verify all packages are installed:
```bash
npm list docx file-saver @types/file-saver
```

Expected output:
```
bmi-ums-frontend@1.0.0 /home/nissi/bmi-ums
├── @types/file-saver@2.0.7
├── docx@8.5.0
└── file-saver@2.0.5
```

---

**Note**: The PowerShell/WSL path translation issue prevented automatic installation. Please run the command manually in your terminal.
