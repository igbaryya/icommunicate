# iCommunicate

A private LAN messenger. One machine runs the server. Every other machine on the same network opens it in a browser, chats in real time, and sends files. Nothing leaves the network: messages live in SQLite and attachments live on disk on the host.

Each machine shows up under its OS hostname. There is a shared **#general** channel and a direct conversation between any two machines.

## Requirements

- Node.js 20 or newer
- A machine that stays on and is reachable from the rest of the LAN

## Run it

```bash
npm install
copy .env.example .env   # macOS / Linux: cp .env.example .env
npm run dev
```

Open the UI at [http://localhost:5173](http://localhost:5173). The sidebar lists the address other machines should use. During development that is `http://<LAN-IP>:5173`.

`npm run dev` starts two processes:

| Port | Process | What it is |
| --- | --- | --- |
| 5173 | Vite | The UI, with hot reload. API and WebSocket calls are proxied to the server. |
| 4000 | Express | The API, WebSocket server, SQLite database, and file storage. |

Other machines must use the Vite address while `npm run dev` is running. Port 4000 is the API, and it only serves the UI after a production build.

## Production

```bash
npm run build
npm start
```

The server listens on `PORT` (4000 by default) and serves the built UI from the same port. Other machines open `http://<LAN-IP>:4000`.

On Windows, allow inbound TCP on that port in the firewall the first time.

## Configuration

Copy `.env.example` to `.env`. Both files are read from the repo root.

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | Interface the server binds to. |
| `PORT` | `4000` | API and WebSocket port. |
| `STORAGE_DIR` | `storage` | Directory for the database and attachments. |
| `MAX_FILE_SIZE_MB` | `100` | Largest single upload. |
| `LAN_ONLY` | `true` | Reject clients whose address is not a private LAN address. |

## How a machine is named

The host is shown as `os.hostname()`. Another machine is named from reverse DNS / NetBIOS of its IP, and falls back to the IP when the LAN cannot resolve it.

## Layout

```
apps/server     Express, Socket.IO, SQLite, attachment storage
apps/client     React, Redux Toolkit, Vite
packages/shared Types, socket events, and limits used by both
storage/        Local database and files. Not part of the repo.
```

`storage/` and `.env` are gitignored. Cloning the repo does not include chat history or uploaded files.
