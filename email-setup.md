# Email Setup Instructions

## Current Status
✅ Email functionality is now integrated into the application
✅ Applications will be sent to: **wernerenterprisesrecuritment@gmail.com**
✅ Server is running with fallback email handling

## How It Works
When users submit applications (both applicant and immigrant), the system will:
1. Save the application to the database
2. Attempt to send an email notification to `wernerenterprisesrecuritment@gmail.com`
3. If email sending fails, it saves the email content to a file in `./data/emails/`

## To Enable Real Email Sending

### Option 1: Using Environment Variables (Recommended)
Set these environment variables before starting the server:

```bash
set SMTP_USER=wernerenterprisesrecuritment@gmail.com
set SMTP_PASS=20022002@Theo
npm start
```

### Option 2: Using Gmail App Password (Most Secure)
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Use that app password instead of your regular password

### Option 3: For Testing (Current Setup)
The system currently saves emails to files in `./data/emails/` folder so you can see what would be sent.

## Email Content
Each application email includes:
- Applicant's full information (excluding password)
- Application type (Driver or Immigrant Driver)
- Submission timestamp
- IP address of submitter

## Testing
1. Go to http://localhost:8002/applicant-signup.htm
2. Fill out and submit an application
3. Check the console logs or `./data/emails/` folder for email content

## Security Notes
- Passwords are never included in emails
- Use App Passwords, not regular Gmail passwords
- Consider using environment variables for production