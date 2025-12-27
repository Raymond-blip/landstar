# Email Setup Instructions

## Current Status
✅ Email functionality is integrated and working
✅ Applications are being processed and saved
✅ Email fallback system is working (saves to files when Gmail auth fails)
✅ Target email: **wernerenterprisesrecuritment@gmail.com**

## 🚨 IMPORTANT: Gmail Authentication Issue
The system is currently saving emails to files because Gmail requires an **App Password** for security.

### Quick Fix Options:

#### Option 1: Enable "Less Secure Apps" (Temporary)
1. Go to https://myaccount.google.com/security
2. Turn ON "Less secure app access" 
3. Restart the server - emails will start sending immediately

#### Option 2: Use App Password (Recommended)
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Replace the password in server.js with the App Password
5. Restart the server

#### Option 3: Check Email Files (Current Working Solution)
All application emails are being saved to: `./data/emails/`
- Each application creates a separate email file
- Files contain all applicant information
- You can manually check these files for new applications

## How It Currently Works
✅ **Applications are being received and saved to database**
✅ **Email content is being generated correctly**  
✅ **Email files are being saved to ./data/emails/ folder**
❌ **Gmail delivery fails due to authentication (needs App Password)**

## Testing
1. Submit an application at: http://localhost:8002/applicant-signup.htm
2. Check console logs for confirmation
3. Check `./data/emails/` folder for the email content
4. All applicant data is safely stored in the database

## Email Content
Each application email includes:
- Applicant's full information (excluding password)
- Application type (Driver or Immigrant Driver)  
- Submission timestamp
- IP address of submitter

## Next Steps
1. **Immediate**: Check `./data/emails/` folder for applications
2. **Short-term**: Enable "Less secure apps" for Gmail
3. **Long-term**: Set up App Password for better security