#!/bin/bash

# Zynorvia DKIM Setup Script
# This script installs and configures OpenDKIM for Postfix

set -e

DOMAIN="zynorvia.com"
SELECTOR="default"

echo "Installing OpenDKIM..."
sudo apt-get update
sudo apt-get install -y opendkim opendkim-tools

# 1. Configure OpenDKIM
echo "Configuring OpenDKIM..."
sudo tee /etc/opendkim.conf > /dev/null <<EOF
Syslog          yes
UMask           002
Domain          $DOMAIN
Selector        $SELECTOR
KeyFile         /etc/dkimkeys/$SELECTOR.private
Socket          local:/var/spool/postfix/opendkim/opendkim.sock
PidFile         /var/run/opendkim/opendkim.pid
TrustAnchorFile /usr/share/dns/root.key
UserID          opendkim:opendkim
EOF

# 2. Setup Directory
sudo mkdir -p /var/spool/postfix/opendkim
sudo chown opendkim:postfix /var/spool/postfix/opendkim

# 3. Generate Keys (if not exist)
if [ ! -f "/etc/dkimkeys/$SELECTOR.private" ]; then
    echo "Generating new DKIM keys..."
    sudo opendkim-genkey -s $SELECTOR -d $DOMAIN
    sudo mkdir -p /etc/dkimkeys
    sudo mv $SELECTOR.private /etc/dkimkeys/
    sudo mv $SELECTOR.txt /etc/dkimkeys/
    sudo chown -R opendkim:opendkim /etc/dkimkeys
    sudo chmod 600 /etc/dkimkeys/$SELECTOR.private
fi

# 4. Integrate with Postfix
echo "Integrating with Postfix..."
sudo postconf -e "milter_protocol = 6"
sudo postconf -e "milter_default_action = accept"
sudo postconf -e "smtpd_milters = local:opendkim/opendkim.sock"
sudo postconf -e "non_smtpd_milters = local:opendkim/opendkim.sock"

# 5. Restart Services
echo "Restarting services..."
sudo systemctl restart opendkim
sudo systemctl restart postfix

echo "-------------------------------------------------------"
echo "SUCCESS! DKIM is now configured on the server."
echo "IMPORTANT: You must ensure your DNS TXT record for $SELECTOR._domainkey.$DOMAIN matches this public key:"
cat /etc/dkimkeys/$SELECTOR.txt
echo "-------------------------------------------------------"
echo "Also, remember to set your PTR record (rDNS) to $DOMAIN in your VPS panel."
