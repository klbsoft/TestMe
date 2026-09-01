# TestMe 📝

> Secure, anonymous testing platform for teachers and students

[![Status](https://img.shields.io/badge/status-in%20development-orange.svg)]()
[![React](https://img.shields.io/badge/React-18.x-blue.svg)]()
[![AWS](https://img.shields.io/badge/AWS-EC2-orange.svg)]()
[![Encryption](https://img.shields.io/badge/Encryption-AES%20256-green.svg)]()

## What is TestMe?

TestMe is a web app that lets teachers create and manage tests while keeping student grades 100% anonymous. Only teachers can decrypt and see who grades belong to. Students can also practice with existing tests to improve their skills.

### Key Features
- **Full Anonymity**: Only teachers can see who grades belong to
- **AES-256 Encryption**: All test data encrypted from the moment it's taken
- **Practice Mode**: Students can improve using existing tests
- **Dual Interface**: Client side for students, management side for teachers
- **AWS EC2**: Built on Amazon Web Services infrastructure

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Cloud**: AWS EC2
- **Database**: MongoDB
- **Security**: AES-256 encryption

## Current Components

- `ActionBtn` - Interactive action button
- `Avatar` - Bot avatar display
- `Describe` - Main test interface
- `Image` - Responsive image display
- `Message` - Chat message bubble
- `ProgressBar` - Interactive progress indicator

## Getting Started

```bash
# Clone the repo
git clone https://github.com/yourusername/testme.git

# Install dependencies
cd testme
npm install

# Run development server
npm run dev

# Build for production
npm run build
