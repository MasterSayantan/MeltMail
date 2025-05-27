# MailMelt - Temp Mail Web Site 

MailMelt is a temporary email web application that allows users to generate disposable email addresses and check their inbox in real-time. This is a fully frontend-only version that uses the public [mail.tm](https://mail.tm) API directly from the browser, so no backend server or cloud service is required.

## Features

- Generate a temporary email address with a preferred name and unique suffix.
- View incoming emails in a dynamic inbox feed.
- Copy email address to clipboard with one click.
- Refresh inbox manually or enable auto-refresh.
- Delete the current temporary email.
- Countdown timer showing email expiration (10 minutes).
- Neon-themed, attractive purple and cyan UI with animations.
- Responsive and user-friendly design.

## How to Use

1. Open `index.html` in a modern web browser.
2. Enter your preferred name in the input field.
3. Click the **Generate** button to create a temporary email address.
4. The generated email will appear in the badge; click **Copy** to copy it.
5. Incoming emails will be displayed in the inbox section.
6. Use **Refresh** to manually update the inbox or enable **Auto Refresh**.
7. Click **Delete** to remove the current temporary email.
8. Watch the expiration countdown timer; emails expire after 10 minutes.

## Technology Stack

- HTML5, CSS3 (TailwindCSS + custom neon styles)
- Vanilla JavaScript
- Public mail.tm API for temporary email services

## Deployment

This is a static frontend application and can be hosted on any static site hosting platform such as:

- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

Simply upload the contents of the `copy_name` folder to your hosting platform.

## Test Site

You can test the live version of MailMelt here:  
[https://mastersayantan.github.io/MeltMail/](https://mastersayantan.github.io/MeltMail/)


## License

This project is open source and available under the Apache License Version 2.0.

### Author Details

- Author: Sayantan Saha  
- LinkedIn: https://linkedin.com/in/mastersayantan  
- GitHub: https://github.com/MasterSayantan
