# Limchat

A clean, private, mobile-first chat web app built for username-based messaging.

## What it does
- Unique usernames with username + password account creation
- Username search
- One-to-one private conversations
- Row-level security so users can only read conversations they belong to
- Realtime message delivery with Supabase Realtime
- Private file metadata/storage foundation
- Responsive WhatsApp-style mobile navigation
- Installable PWA
- Lime-green custom Limchat mark

## Stack
- HTML, CSS, vanilla JavaScript
- Supabase Auth, Postgres, Realtime and Storage
- Supabase Edge Function for username/password account creation

The browser never receives the Supabase service-role key. Passwords are handled by Supabase Auth; the public client only uses the publishable key.

## Database
Limchat uses the `limchat_*` tables in the connected Supabase project. RLS is enabled on all Limchat data tables, with membership checks on conversations and messages.

## Run
Serve the repository from any static web host. Open `index.html` through a web server (not `file://`) so the service worker can register.

## Important
The current MVP is intentionally focused on private one-to-one text chat. Voice/video calls, read receipts, typing indicators and push notifications are deliberately not part of the first build; those can be added after the core messaging flow is stable.
