# Налаштування SMTP Поштового Сервера на VPS

## Попередні вимоги
- Ubuntu 22.04+ VPS
- Домен `zynorvia.com` з доступом до DNS
- SSL-сертифікат (Let's Encrypt)

---

## 1. Встановлення Postfix + Dovecot

```bash
# Оновлення системи
sudo apt update && sudo apt upgrade -y

# Встановлення Postfix (обрати "Internet Site", ввести zynorvia.com)
sudo apt install -y postfix postfix-policyd-spf-python

# Встановлення Dovecot (для IMAP)
sudo apt install -y dovecot-core dovecot-imapd dovecot-lmtpd

# OpenDKIM для підпису листів
sudo apt install -y opendkim opendkim-tools
```

## 2. Налаштування DNS записів

У панелі управління доменом додайте:

| Тип   | Ім'я             | Значення                                         | TTL  |
|-------|------------------|--------------------------------------------------|------|
| MX    | zynorvia.com     | mail.zynorvia.com (пріоритет 10)                 | 3600 |
| A     | mail             | `<IP_ВАШОГО_VPS>`                                | 3600 |
| TXT   | zynorvia.com     | `v=spf1 ip4:<IP_VPS> a mx ~all`                  | 3600 |
| TXT   | _dmarc           | `v=DMARC1; p=quarantine; rua=mailto:admin@zynorvia.com` | 3600 |
| TXT   | default._domainkey | `<DKIM_ПУБЛІЧНИЙ_КЛЮЧ>` (генерується нижче)     | 3600 |

## 3. Конфігурація Postfix

```bash
sudo nano /etc/postfix/main.cf
```

```ini
# Основні налаштування
myhostname = mail.zynorvia.com
mydomain = zynorvia.com
myorigin = $mydomain
mydestination = localhost
inet_interfaces = all

# Віртуальні поштові скриньки
virtual_mailbox_domains = zynorvia.com
virtual_mailbox_base = /var/mail/vhosts
virtual_mailbox_maps = hash:/etc/postfix/vmailbox
virtual_minimum_uid = 100
virtual_uid_maps = static:5000
virtual_gid_maps = static:5000
virtual_transport = lmtp:unix:private/dovecot-lmtp

# TLS
smtpd_tls_cert_file = /etc/letsencrypt/live/zynorvia.com/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/zynorvia.com/privkey.pem
smtpd_tls_security_level = may
smtp_tls_security_level = may

# SASL автентифікація
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
smtpd_recipient_restrictions = permit_sasl_authenticated, permit_mynetworks, reject_unauth_destination

# Обмеження
message_size_limit = 52428800

# DKIM
milter_protocol = 6
milter_default_action = accept
smtpd_milters = inet:localhost:8891
non_smtpd_milters = inet:localhost:8891
```

## 4. Створення поштових скриньок

```bash
# Створення користувача для пошти
sudo groupadd -g 5000 vmail
sudo useradd -g vmail -u 5000 -d /var/mail/vhosts -s /usr/sbin/nologin vmail
sudo mkdir -p /var/mail/vhosts/zynorvia.com

# Файл поштових скриньок
sudo nano /etc/postfix/vmailbox
```

```
support@zynorvia.com    zynorvia.com/support/
no-reply@zynorvia.com   zynorvia.com/no-reply/
info@zynorvia.com       zynorvia.com/info/
team@zynorvia.com       zynorvia.com/team/
```

```bash
sudo postmap /etc/postfix/vmailbox
sudo chown -R vmail:vmail /var/mail/vhosts
```

## 5. Налаштування паролів (Dovecot)

```bash
# Генерація паролів
sudo doveadm pw -s SHA512-CRYPT

# Файл паролів
sudo nano /etc/dovecot/users
```

```
support@zynorvia.com:{SHA512-CRYPT}<хеш_паролю>::5000:5000::/var/mail/vhosts/zynorvia.com/support::
no-reply@zynorvia.com:{SHA512-CRYPT}<хеш_паролю>::5000:5000::/var/mail/vhosts/zynorvia.com/no-reply::
info@zynorvia.com:{SHA512-CRYPT}<хеш_паролю>::5000:5000::/var/mail/vhosts/zynorvia.com/info::
team@zynorvia.com:{SHA512-CRYPT}<хеш_паролю>::5000:5000::/var/mail/vhosts/zynorvia.com/team::
```

## 6. Конфігурація Dovecot

```bash
sudo nano /etc/dovecot/dovecot.conf
```

```ini
protocols = imap lmtp
listen = *

mail_location = maildir:/var/mail/vhosts/%d/%n
mail_uid = 5000
mail_gid = 5000

passdb {
  driver = passwd-file
  args = /etc/dovecot/users
}
userdb {
  driver = static
  args = uid=5000 gid=5000 home=/var/mail/vhosts/%d/%n
}

service lmtp {
  unix_listener /var/spool/postfix/private/dovecot-lmtp {
    mode = 0600
    user = postfix
    group = postfix
  }
}

service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0660
    user = postfix
    group = postfix
  }
}

ssl = required
ssl_cert = </etc/letsencrypt/live/zynorvia.com/fullchain.pem
ssl_key = </etc/letsencrypt/live/zynorvia.com/privkey.pem
```

## 7. Налаштування DKIM

```bash
# Генерація ключів
sudo mkdir -p /etc/opendkim/keys/zynorvia.com
sudo opendkim-genkey -b 2048 -d zynorvia.com -D /etc/opendkim/keys/zynorvia.com -s default -v
sudo chown -R opendkim:opendkim /etc/opendkim

# Конфігурація
sudo nano /etc/opendkim.conf
```

```ini
AutoRestart             Yes
AutoRestartRate         10/1h
Syslog                  yes
SyslogSuccess           Yes
LogWhy                  Yes
Mode                    sv
Canonicalization        relaxed/simple
ExternalIgnoreList      refile:/etc/opendkim/TrustedHosts
InternalHosts           refile:/etc/opendkim/TrustedHosts
KeyTable                refile:/etc/opendkim/KeyTable
SigningTable             refile:/etc/opendkim/SigningTable
Socket                  inet:8891@localhost
PidFile                 /var/run/opendkim/opendkim.pid
UMask                   002
UserID                  opendkim:opendkim
```

```bash
# Trusted hosts
echo -e "127.0.0.1\nlocalhost\n*.zynorvia.com" | sudo tee /etc/opendkim/TrustedHosts

# Key table
echo "default._domainkey.zynorvia.com zynorvia.com:default:/etc/opendkim/keys/zynorvia.com/default.private" | sudo tee /etc/opendkim/KeyTable

# Signing table
echo "*@zynorvia.com default._domainkey.zynorvia.com" | sudo tee /etc/opendkim/SigningTable

# Отримати DKIM публічний ключ для DNS
sudo cat /etc/opendkim/keys/zynorvia.com/default.txt
# Скопіюйте значення p=... та додайте як TXT запис в DNS
```

## 8. SSL сертифікат для пошти

```bash
# Розширити існуючий сертифікат (якщо вже є для zynorvia.com)
sudo certbot certonly --nginx -d mail.zynorvia.com -d zynorvia.com

# Або додати до існуючого:
sudo certbot --expand -d zynorvia.com -d mail.zynorvia.com
```

## 9. Відкрити порти в фаєрволі

```bash
sudo ufw allow 25/tcp    # SMTP
sudo ufw allow 465/tcp   # SMTPS
sudo ufw allow 587/tcp   # Submission
sudo ufw allow 993/tcp   # IMAPS
sudo ufw reload
```

## 10. Запуск та перевірка

```bash
# Перезапуск всіх сервісів
sudo systemctl restart postfix
sudo systemctl restart dovecot
sudo systemctl restart opendkim

# Увімкнення автозапуску
sudo systemctl enable postfix dovecot opendkim

# Перевірка
sudo postfix check
sudo doveconf -n
echo "Test mail" | mail -s "Test" support@zynorvia.com
```

## 11. Інтеграція з додатком

Після налаштування, в адмін-панелі Zynorvia (вкладка "Пошта" → Налаштування):

| Поле           | Значення для support@zynorvia.com    |
|----------------|--------------------------------------|
| Email адреса   | `support@zynorvia.com`               |
| Ім'я           | `Zynorvia Support`                   |
| SMTP хост      | `localhost` або `mail.zynorvia.com`  |
| SMTP порт      | `465` (SSL) або `587` (STARTTLS)     |
| Логін          | `support@zynorvia.com`               |
| Пароль         | (пароль з кроку 5)                   |
| IMAP хост      | `localhost` або `mail.zynorvia.com`  |
| IMAP порт      | `993`                                |

Повторіть для всіх адрес: `info@`, `team@`, `no-reply@`.

---

## Рекомендовані адреси

| Адреса                    | Призначення                           |
|---------------------------|---------------------------------------|
| `support@zynorvia.com`    | Підтримка користувачів                |
| `no-reply@zynorvia.com`   | Системні листи (верифікація, дайджести) |
| `info@zynorvia.com`       | Загальна інформація                   |
| `team@zynorvia.com`       | Внутрішня комунікація                 |
