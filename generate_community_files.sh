#!/bin/bash
# Generate all community files for a repo
# Args: $1 = repo_path, $2 = repo_name, $3 = repo_description

REPO_PATH="$1"
REPO_NAME="$2"
REPO_DESC="$3"
YEAR="2026"
AUTHOR="Mulky Malikul Dhaher"
EMAIL="mulkymalikuldhaher@email.com"
GITHUB="https://github.com/mulkymalikuldhrs"
DISCLAIMER_EN="**For Education Purpose Only.** All content, code, and documentation provided in this repository are intended solely for educational and research purposes. Nothing in this repository constitutes financial, investment, legal, or professional advice. The authors and contributors assume no responsibility or liability for any losses, damages, or consequences arising from the use of this software or information provided herein."
DISCLAIMER_ID="**Hanya untuk Tujuan Pendidikan.** Semua konten, kode, dan dokumentasi dalam repositori ini hanya ditujukan untuk tujuan pendidikan dan penelitian. Penulis dan kontributor tidak bertanggung jawab atas risiko atau kerugian apa pun yang timbul dari penggunaan perangkat lunak atau informasi yang disediakan."
DISCLAIMER_CN="**仅用于教育目的。** 本仓库中的所有内容、代码和文档仅用于教育和研究目的。作者和贡献者对因使用本软件或提供的信息而造成的任何损失、损害或后果不承担任何责任。"

# CONTRIBUTING.md
cat > "$REPO_PATH/CONTRIBUTING.md" << EOF
# Contributing to ${REPO_NAME}

Thank you for your interest in contributing to **${REPO_NAME}**! We welcome contributions from the community.

## 🇬🇧 English

### How to Contribute
1. **Fork** the repository
2. Create a **feature branch** (\`git checkout -b feature/amazing-feature\`)
3. **Commit** your changes (\`git commit -m 'Add amazing feature'\`)
4. **Push** to the branch (\`git push origin feature/amazing-feature\`)
5. Open a **Pull Request**

### Guidelines
- Follow the existing code style
- Write clear, descriptive commit messages
- Add tests for new features
- Update documentation as needed
- Be respectful and constructive in discussions

## 🇮🇩 Bahasa Indonesia

### Cara Berkontribusi
1. **Fork** repositori ini
2. Buat **branch fitur** (\`git checkout -b feature/amazing-feature\`)
3. **Commit** perubahan Anda (\`git commit -m 'Tambah fitur baru'\`)
4. **Push** ke branch (\`git push origin feature/amazing-feature\`)
5. Buka **Pull Request**

## 🇨🇳 中文

### 如何贡献
1. **Fork** 本仓库
2. 创建**特性分支** (\`git checkout -b feature/amazing-feature\`)
3. **提交**您的更改 (\`git commit -m 'Add amazing feature'\`)
4. **推送**到分支 (\`git push origin feature/amazing-feature\`)
5. 发起 **Pull Request**

---

## ⚠️ Disclaimer

${DISCLAIMER_EN}

${DISCLAIMER_ID}

${DISCLAIMER_CN}

---

## 📬 Contact

**${AUTHOR}** — [${EMAIL}](mailto:${EMAIL})

GitHub: ${GITHUB}
EOF

# CODE_OF_CONDUCT.md
cat > "$REPO_PATH/CODE_OF_CONDUCT.md" << EOF
# Code of Conduct — ${REPO_NAME}

## 🇬🇧 English

### Our Pledge
We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards
- **Positive behavior**: Using welcoming language, being respectful, accepting constructive criticism, focusing on what is best for the community
- **Unacceptable behavior**: Harassment, trolling, insulting comments, public or private harassment, publishing others' private information

### Enforcement
Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at ${EMAIL}.

## 🇮🇩 Bahasa Indonesia

### Janji Kami
Kami sebagai anggota, kontributor, dan pemimpin berjanji untuk membuat partisipasi dalam komunitas kami bebas dari pelecehan.

## 🇨🇳 中文

### 我们的承诺
我们作为成员、贡献者和领导者，承诺让每个人在我们的社区中都有无骚扰的体验。

---

## ⚠️ Disclaimer

${DISCLAIMER_EN}

${DISCLAIMER_ID}

${DISCLAIMER_CN}
EOF

# SECURITY.md
cat > "$REPO_PATH/SECURITY.md" << EOF
# Security Policy — ${REPO_NAME}

## 🇬🇧 English

### Reporting a Vulnerability
If you discover a security vulnerability in **${REPO_NAME}**, please report it by emailing **${EMAIL}**.

Please do NOT create a public GitHub issue for security vulnerabilities.

### What to Include
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

### Response Time
We will acknowledge your report within 48 hours and provide a detailed response within 7 days.

## 🇮🇩 Bahasa Indonesia

### Melaporkan Kerentanan
Jika Anda menemukan kerentanan keamanan di **${REPO_NAME}**, silakan laporkan melalui email **${EMAIL}**.

### Apa yang Disertakan
- Deskripsi kerentanan
- Langkah-langkah untuk mereproduksi
- Dampak potensial
- Perbaikan yang disarankan (jika ada)

## 🇨🇳 中文

### 报告漏洞
如果您在 **${REPO_NAME}** 中发现安全漏洞，请通过电子邮件 **${EMAIL}** 报告。

---

## ⚠️ Disclaimer

${DISCLAIMER_EN}

${DISCLAIMER_ID}

${DISCLAIMER_CN}

---

**Contact:** ${AUTHOR} — [${EMAIL}](mailto:${EMAIL})
EOF

# LICENSE
cat > "$REPO_PATH/LICENSE" << EOF
MIT License

Copyright (c) ${YEAR} ${AUTHOR}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# .github directory and templates
mkdir -p "$REPO_PATH/.github/ISSUE_TEMPLATE"
mkdir -p "$REPO_PATH/.github"

# PR Template
cat > "$REPO_PATH/.github/PULL_REQUEST_TEMPLATE.md" << EOF
## Description

Please include a summary of the changes and the related issue.

Fixes # (issue)

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code
- [ ] My changes generate no new warnings
- [ ] I have added tests
- [ ] New and existing unit tests pass

---

**⚠️ For Education Purpose Only — No responsibility or liability is assumed.**
EOF

# Bug Report Template
cat > "$REPO_PATH/.github/ISSUE_TEMPLATE/bug_report.md" << EOF
---
name: Bug Report
about: Report a bug in ${REPO_NAME}
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen.

## Screenshots
If applicable, add screenshots.

## Environment
- OS: 
- Browser: 
- Version: 

---

**⚠️ For Education Purpose Only — No responsibility or liability is assumed.**
EOF

# Feature Request Template
cat > "$REPO_PATH/.github/ISSUE_TEMPLATE/feature_request.md" << EOF
---
name: Feature Request
about: Suggest a feature for ${REPO_NAME}
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## Feature Description
A clear description of the feature you'd like.

## Problem Statement
What problem does this feature solve?

## Proposed Solution
How do you envision this feature working?

## Alternatives Considered
Any alternative solutions you've considered.

---

**⚠️ For Education Purpose Only — No responsibility or liability is assumed.**
EOF

# Question Template
cat > "$REPO_PATH/.github/ISSUE_TEMPLATE/question.md" << EOF
---
name: Question
about: Ask a question about ${REPO_NAME}
title: '[QUESTION] '
labels: question
assignees: ''
---

## Question
Your question here.

## Context
Any additional context.

---

**⚠️ For Education Purpose Only — No responsibility or liability is assumed.**
EOF

# Issue template config
cat > "$REPO_PATH/.github/ISSUE_TEMPLATE/config.yml" << EOF
blank_issues_enabled: false
contact_links:
  - name: Email Support
    url: mailto:${EMAIL}
    about: Contact the maintainer directly via email.
EOF

# FUNDING.yml
cat > "$REPO_PATH/.github/FUNDING.yml" << EOF
custom: ['${GITHUB}']
EOF

echo "Community files generated for ${REPO_NAME}"
