#!/usr/bin/env bash
set -euo pipefail

: "${DIRECTADMIN_FTP_HOST:?Set the DIRECTADMIN_FTP_HOST secret}"
: "${DIRECTADMIN_FTP_USER:?Set the DIRECTADMIN_FTP_USER secret}"
: "${DIRECTADMIN_FTP_PASSWORD:?Set the DIRECTADMIN_FTP_PASSWORD secret}"
: "${DIRECTADMIN_FTP_PATH:?Set the DIRECTADMIN_FTP_PATH variable}"

if [[ ! "$DIRECTADMIN_FTP_HOST" =~ ^[A-Za-z0-9.-]+$ ]]; then
  echo 'DIRECTADMIN_FTP_HOST must be a hostname without a protocol or port.' >&2
  exit 1
fi
if [[ ! "$DIRECTADMIN_FTP_PATH" =~ ^/?[A-Za-z0-9._/-]+$ || "$DIRECTADMIN_FTP_PATH" == *..* || "$DIRECTADMIN_FTP_PATH" == '/' ]]; then
  echo 'DIRECTADMIN_FTP_PATH must be an existing directory under the FTP account.' >&2
  exit 1
fi

test -f dist/index.html
test -f dist/api/index.php
test -f dist/.htaccess

# Never upload the local placeholder or a developer's real database password.
mkdir -p .directadmin-upload
rsync -a --delete --exclude='.db-password' dist/ .directadmin-upload/
test ! -e .directadmin-upload/api/.db-password

# lftp uses explicit FTPS on port 21. A valid TLS certificate is required.
# No --delete flag: existing server-only files and database credentials stay put.
lftp -u "$DIRECTADMIN_FTP_USER","$DIRECTADMIN_FTP_PASSWORD" "ftp://$DIRECTADMIN_FTP_HOST:21" <<LFTP_COMMANDS
set cmd:fail-exit yes
set ftp:ssl-force yes
set ftp:ssl-protect-data yes
set ftp:list-options -a
set ssl:verify-certificate yes
set ssl:check-hostname yes
set net:timeout 20
set net:max-retries 2
cd $DIRECTADMIN_FTP_PATH
mirror -R --no-perms --upload-older --verbose=1 .directadmin-upload .
put .directadmin-upload/.htaccess -o .htaccess
put .directadmin-upload/api/.htaccess -o api/.htaccess
bye
LFTP_COMMANDS
