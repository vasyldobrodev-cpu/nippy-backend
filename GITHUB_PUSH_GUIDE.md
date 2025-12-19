# GitHub Push Guide - Fixing 403 Error

## 🔐 Authentication Issue

The 403 error means GitHub is rejecting your authentication. Here are solutions:

## ✅ Solution 1: Use SSH (Recommended)

### Step 1: Check if you have SSH keys
```bash
# Check if SSH key exists
ls ~/.ssh/id_rsa.pub
# Or on Windows:
Test-Path $env:USERPROFILE\.ssh\id_rsa.pub
```

### Step 2: Generate SSH key (if you don't have one)
```bash
ssh-keygen -t ed25519 -C "vasyl.dobro.dev@gmail.com"
# Press Enter to accept default location
# Optionally set a passphrase (recommended)
```

### Step 3: Add SSH key to GitHub
1. Copy your public key:
   ```bash
   # Windows PowerShell
   Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
   # Or if using RSA:
   Get-Content $env:USERPROFILE\.ssh\id_rsa.pub
   ```

2. Go to GitHub → Settings → SSH and GPG keys
3. Click "New SSH key"
4. Paste your public key
5. Save

### Step 4: Change remote URL to SSH
```bash
git remote set-url origin git@github.com:vasyldobrodev-cpu/nippy-backend.git
```

### Step 5: Test connection
```bash
ssh -T git@github.com
# Should say: "Hi vasyldobrodev-cpu! You've successfully authenticated..."
```

### Step 6: Push
```bash
git push origin main
# Or your branch name
```

---

## ✅ Solution 2: Use Personal Access Token (HTTPS)

### Step 1: Create Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "nippy-backend-push")
4. Select scopes: **repo** (full control of private repositories)
5. Click "Generate token"
6. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

### Step 2: Update remote URL with token
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/vasyldobrodev-cpu/nippy-backend.git
```

Replace `YOUR_TOKEN` with your actual token.

### Step 3: Push
```bash
git push origin main
```

**Note:** You'll be prompted for password - use your token as the password.

---

## ✅ Solution 3: Use GitHub CLI (Alternative)

### Install GitHub CLI
```bash
# Windows (using winget)
winget install --id GitHub.cli

# Or download from: https://cli.github.com/
```

### Authenticate
```bash
gh auth login
# Follow the prompts
```

### Push
```bash
git push origin main
```

---

## 🔍 Troubleshooting

### Check current remote URL
```bash
git remote -v
```

### If using HTTPS and getting 403:
1. **Clear cached credentials:**
   ```bash
   # Windows
   git credential-manager-core erase
   # Or use Windows Credential Manager to remove GitHub entries
   ```

2. **Use token in URL:**
   ```bash
   git remote set-url origin https://YOUR_TOKEN@github.com/vasyldobrodev-cpu/nippy-backend.git
   ```

### If using SSH and getting permission denied:
1. **Test SSH connection:**
   ```bash
   ssh -T git@github.com
   ```

2. **Check SSH agent:**
   ```bash
   # Start SSH agent (Windows)
   Start-Service ssh-agent
   ssh-add $env:USERPROFILE\.ssh\id_ed25519
   ```

---

## 📝 Quick Commands Reference

```bash
# Check remote
git remote -v

# Change to SSH
git remote set-url origin git@github.com:vasyldobrodev-cpu/nippy-backend.git

# Change to HTTPS with token
git remote set-url origin https://YOUR_TOKEN@github.com/vasyldobrodev-cpu/nippy-backend.git

# Push to main branch
git push origin main

# Push to current branch
git push origin HEAD

# Push with upstream
git push -u origin main
```

---

## ⚠️ Security Notes

1. **Never commit tokens or SSH keys to git**
2. **Use SSH keys with passphrases**
3. **Rotate tokens regularly**
4. **Use fine-grained tokens when possible (GitHub's newer token type)**

---

## 🎯 Recommended Approach

**Use SSH** - It's more secure and convenient once set up:
- No need to enter credentials each time
- More secure than tokens in URLs
- Works with all Git operations

