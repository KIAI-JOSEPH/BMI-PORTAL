#!/bin/sh
echo "JWT_SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(48).toString('hex'))")"
echo "ENCRYPTION_KEY=$(node -e "process.stdout.write(require('crypto').randomBytes(16).toString('hex'))")"
echo "PB_ADMIN_PASSWORD=$(node -e "process.stdout.write(require('crypto').randomBytes(12).toString('base64url'))")"
