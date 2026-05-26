# New Environment Bundle
> Region: ap-southeast-2 | Account: 012276878427

## Folder Structure

```
bundle/
├── lambda/
│   ├── http_bff.py     → paste into Lambda: scriptgenerator-bff
│   └── ws_bff.py       → paste into Lambda: scriptgenerator-bff-ws
│
└── ui/
    ├── .env.example    → copy to .env.local, fill URLs as steps complete
    ├── amplify.yml     → Amplify build spec (already configured)
    ├── package.json
    ├── src/            → full Next.js app source
    └── public/
        └── sw.js       → service worker
```

## Cognito Values (Step 1 — Done)
| Key | Value |
|---|---|
| User Pool ID | `ap-southeast-2_TING9KcBS` |
| Client ID | `4u526tl9qftouvrt1fgvmblojc` |
| Issuer URL | `https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_TING9KcBS` |

## Remaining Steps
See `../HANDOVER.md` for step-by-step progress.
