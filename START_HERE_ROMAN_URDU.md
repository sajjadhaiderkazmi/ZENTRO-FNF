# Zentro - POS — shuru yahan se karein

Developed By [Sajjad Haider](mailto:sajjadhaiderconnect@gmail.com)

Yeh v0.2 mein real backend aur connected panels wala source project hai. Windows desktop software ka build source bhi hai. Ready-made `.exe` abhi ZIP mein nahin hai; usko Windows par build aur test karna hai.

## Pehle local server chala kar dekhein

1. ZIP extract karein, phir **zentro-pos** folder VS Code mein open karein.
2. Official Node.js **24.22.1+** install karein.
3. VS Code ke terminal mein `npm run bootstrap` chalayein. Apna Power naam, username aur 14–128 characters ka password choose karein. Password type hote hue screen par nazar nahin aayega.
4. `npm start` chalayein. Browser mein `http://127.0.0.1:4173` open karein.
5. Power login ke liye company code khali rakhein. Apna username/password dein.
6. Authenticator app mein displayed setup key add karein, six-digit code verify karein aur recovery codes private jagah save karein.

Root backend ke liye `npm install` zaroori nahin. Koi default username/password nahin diya gaya. Windows par same kaam ke liye `Create-Power-Account.bat` aur `Start-Zentro.bat` bhi hain.

## Company kaise deni hai

Power Console → Create company. Company code, admin username, owner, expiry aur limits set karein. Aik **activation key** aur us se alag **owner invitation token** milega. Dono foran private save karein; dobara full secret nazar nahin aayega. Owner ko alag trusted channels se dein.

Owner **Accept company / staff invitation** mein dono values daal kar apna password choose karega, pehla terminal enroll hoga aur MFA complete karega. Phir company code + admin username se login hoga. Admin Team panel se staff invitations, roles aur branch access de sakta hai. Staff apna password khud choose karta hai. Email apne aap send nahin hoti.

Additional counter par Admin sign in karke **Terminals → Enroll this terminal** mein key dega. Uske baad cashier apne account se login karke sale kar sakta hai. Admin server se linked company records aur reports doosri jagah se bhi dekh sakta hai.

Products, customer ya staff ko delete karne par financial history bachane ke liye archive/disable kiya jata hai.

## Computer software aur online panel ka farq

- **Cloud mode:** Windows par installed desktop app, online backend, Power/Admin panel. Sab terminals same online server se connect honge. Checkout ke liye internet chahiye.
- **Local mode:** Computer par embedded server/database ke saath chal sakta hai; internet ke baghair bhi. Lekin iska data/accounts cloud se sync nahin hote.

Aapke multiple companies aur worldwide reports ke liye **cloud mode** use hoga. Har company ka alag local server bana dene se central reports nahin banengi.

## Windows installer banana

Windows x64 build computer par `desktop/desktop-config.json` mein apne real HTTPS server ka URL set karein:

```json
{"mode":"cloud","serverUrl":"https://YOUR-ACTUAL-SERVER-DOMAIN"}
```

Standalone ke liye `{"mode":"local","serverUrl":""}` use karein. Phir terminal mein:

```sh
npm --prefix desktop install
npm run desktop
npm --prefix desktop run dist:win
```

Ya `Build-Windows-App.bat` chalayein. Installer `release/windows/` mein banne ki configuration hai. Build aur scanner/printer ka actual test Windows par baqi hai. Public distribution ke liye apna code-signing certificate aur verified signed build chahiye.

## Backup aur AI ko dena

`.env.example` mein real configuration ka format hai. `npm run backup` encrypted backup banata hai, `npm run restore` empty folder mein restore karta hai. Manual maintenance se pehle software/server band karein. Automatic backup tabhi chalega jab protected environment mein passphrase aur backup directory configure hon; startup log enabled/disabled batata hai. Backup files ko alag storage par copy karna aur passphrase sambhalna operator ka kaam hai.

ZIP poori coding AI ko upload karein aur `docs/BACKEND_AI_PROMPT.md` ka prompt dein. Backend already bana hua hai; AI ko existing code preserve karke Windows build, deployment, offline synchronization aur baqi release gates complete karne hain.

`Zentro-POS.html` sirf pehle wala local demo hai. Real accounts/server ke liye upar wale commands use karein. Detailed test results `docs/QA_REPORT.md` mein hain. Zero vulnerabilities ya hack-proof hone ki guarantee nahin di ja sakti.
