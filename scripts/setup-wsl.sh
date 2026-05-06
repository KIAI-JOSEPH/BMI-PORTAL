#!/bin/bash
set -e

echo "=== BMI UMS Open Source - WSL Setup Script ==="
echo ""

# Create project directory
mkdir -p ~/bmi-ums-open-source/{backend,frontend,scripts,data}
cd ~/bmi-ums-open-source

echo "[1/4] Installing Ollama..."
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh
    echo "✓ Ollama installed"
else
    echo "✓ Ollama already installed"
fi

echo ""
echo "[2/4] Downloading PocketBase..."
cd ~/bmi-ums-open-source/backend
LATEST_TAG=$(curl -s https://api.github.com/repos/pocketbase/pocketbase/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
echo "Latest PocketBase version: $LATEST_TAG"

if [ ! -f "pocketbase" ]; then
    wget -q "https://github.com/pocketbase/pocketbase/releases/download/$LATEST_TAG/pocketbase_linux_amd64.zip"
    unzip -o pocketbase_linux_amd64.zip
    chmod +x pocketbase
    rm pocketbase_linux_amd64.zip
    echo "✓ PocketBase installed"
else
    echo "✓ PocketBase already exists"
fi

echo ""
echo "[3/4] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✓ Node.js installed"
else
    echo "✓ Node.js already installed: $(node --version)"
fi

echo ""
echo "[4/4] Installing NVM (Node Version Manager)..."
if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    echo "✓ NVM installed"
else
    echo "✓ NVM already installed"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Project structure:"
ls -la ~/bmi-ums-open-source/
echo ""
echo "Next steps:"
echo "1. Start PocketBase: cd ~/bmi-ums-open-source/backend && ./pocketbase serve"
echo "2. Download Llama model: ollama pull llama3.2"
echo "3. Start Ollama: ollama serve"
echo ""
echo "PocketBase Admin UI will be at: http://localhost:8090/_/"
echo "Ollama API will be at: http://localhost:11434"
