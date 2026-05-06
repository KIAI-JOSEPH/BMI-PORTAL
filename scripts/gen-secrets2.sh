#!/bin/sh
JWT=$(openssl rand -hex 48)
ENC=$(openssl rand -hex 16)
PBP=$(openssl rand -base64 16 | tr -d '=+/')
echo "JWT_SECRET=$JWT"
echo "ENCRYPTION_KEY=$ENC"
echo "PB_ADMIN_PASSWORD=$PBP"
