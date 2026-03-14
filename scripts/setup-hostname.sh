#!/bin/bash
# Zynorvia Hostname Fix Script
set -e
DOMAIN="zynorvia.com"
echo "Setting hostname to $DOMAIN..."
hostnamectl set-hostname $DOMAIN
echo "127.0.0.1 localhost $DOMAIN" > /etc/hosts
sudo systemctl restart postfix
echo "Hostname updated to $(hostname)"
