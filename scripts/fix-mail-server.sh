#!/bin/bash

# Zynorvia Mail Server Fix Script
# Resolves "Relay access denied" for zynorvia.com

set -e

echo "Checking Postfix configuration..."

# 1. Check if virtual_mailbox_domains contains zynorvia.com
CURRENT_DOMAINS=$(postconf -h virtual_mailbox_domains)

if [[ $CURRENT_DOMAINS != *"zynorvia.com"* ]]; then
    echo "Adding zynorvia.com to virtual_mailbox_domains..."
    sudo postconf -e "virtual_mailbox_domains = zynorvia.com"
else
    echo "zynorvia.com already in virtual_mailbox_domains."
fi

# 2. Ensure /etc/postfix/vmailbox exists and has the correct entries
VMAILBOX="/etc/postfix/vmailbox"

if [ ! -f "$VMAILBOX" ]; then
    echo "Creating $VMAILBOX..."
    sudo touch "$VMAILBOX"
fi

# Add entries if missing
declare -a ACCOUNTS=("support@zynorvia.com" "info@zynorvia.com" "team@zynorvia.com" "no-reply@zynorvia.com")

for account in "${ACCOUNTS[@]}"; do
    if ! grep -q "$account" "$VMAILBOX"; then
        echo "Adding $account to $VMAILBOX..."
        echo -e "$account\tzynorvia.com/${account%@*}/" | sudo tee -a "$VMAILBOX"
    fi
done

# 3. Update lookup table and reload Postfix
echo "Updating lookup tables..."
sudo postmap "$VMAILBOX"

echo "Reloading Postfix..."
sudo systemctl reload postfix

echo "SUCCESS: Postfix configuration updated."
echo "Please try sending a test email to team@zynorvia.com now."
