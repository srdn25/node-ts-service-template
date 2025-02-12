$CA_KEY=/keys/ca.key

echo "< Set the user group for certificate >"
chmod 400 /keys/ca.key
chown mongodb:mongodb /keys/ca.key