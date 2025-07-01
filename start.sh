#!/usr/bin/env bash

set -e

# Colors for output
green='\033[0;32m'
red='\033[0;31m'
reset='\033[0m'

# Check for Docker
if ! command -v docker &> /dev/null; then
  echo -e "${red}Docker not found. Installing Docker...${reset}"
  if [ -f /etc/debian_version ]; then
    sudo apt-get update && sudo apt-get install -y ca-certificates curl gnupg lsb-release
    curl -fsSL https://get.docker.com | sudo sh
  elif [ -f /etc/arch-release ]; then
    sudo pacman -Sy --noconfirm docker
  elif [ -f /etc/redhat-release ]; then
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
  else
    echo -e "${red}Please install Docker manually for your OS.${reset}"
    exit 1
  fi
else
  echo -e "${green}Docker is already installed.${reset}"
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo -e "${red}Docker Compose not found. Installing Docker Compose...${reset}"
  sudo curl -L "https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
else
  echo -e "${green}Docker Compose is already installed.${reset}"
fi

# Copy .env.example to .env if not present
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${green}Created .env from .env.example. Please edit .env with your secrets before continuing.${reset}"
  read -p "Press Enter to continue after editing .env..."
else
  echo -e "${green}.env file already exists.${reset}"
fi

# Start Docker Compose
echo -e "${green}Starting DocsX with Docker Compose...${reset}"
docker-compose up --build 