# LAN-Based Local Chat Application

Transform this project into a **LAN-based messaging application** that allows multiple local machines to communicate with each other over the same local network.

## Core Concept

The application should work as a local chat server accessible by other machines on the LAN using the host machine's IP address and port.

Each machine running the application should be able to discover or connect to another machine using:

- IP address
- Port
- Machine hostname (used as the display name)

No cloud services or external infrastructure should be required.

## Functional Requirements

### 1. LAN Chat Communication

- Expose the application over the local network.
- Allow other machines to connect using `http://<IP>:<PORT>`.
- Support real-time messaging between connected machines.
- Automatically identify each machine using its operating system hostname.
- Use the machine hostname as the default username/display name.
- Display online/offline connection status.
- Show message timestamps.
- Support multiple machines and concurrent chat sessions.

### 2. Message Attachments

- Support sending files as chat message attachments.
- Allow users to upload and download files between connected machines.
- Display attachment previews where possible (images, PDFs, etc.).
- Display file name, size, and file type.
- Show upload/download progress.
- Store all transferred files locally.

### 3. Local Database

Use a **local real-time database** to persist application data.

Requirements:
- Persist chat messages.
- Persist machine/device information.
- Persist conversation history.
- Support real-time updates across connected clients.
- Ensure data survives application restarts.
- No external database services or cloud dependencies.

### 4. Local File Storage

All files must be stored locally on the host machine.

- Create a dedicated local storage directory.
- Organize attachments in a structured directory.
- Store file metadata and references in the database.
- Avoid storing binary file content directly in the database.
- Ensure downloaded files are accessible locally.
- Provide configurable storage location if practical.

## UI/UX Requirements

Build a modern, polished desktop-friendly chat interface.

Design direction:
- Dark-first UI.
- Modern developer-tool aesthetic.
- Clean, minimal, and professional.
- Smooth animations and transitions.
- Responsive layout.

Suggested interface:

**Sidebar**
- Connected machines.
- Online/offline indicators.
- Conversations list.
- Machine hostname and IP address.

**Main Chat**
- Message bubbles with clear sender identification.
- Timestamps.
- File attachment cards.
- Image and document previews.
- Drag-and-drop file upload.
- Message input with attachment support.
- Real-time message updates.

**Connection Status**
- Display the local server's IP and port.
- Indicate whether the LAN server is running.
- Show connected clients.
- Provide connection information for other machines.

## Architecture & Technical Expectations

- Keep the architecture lightweight and suitable for local deployment.
- Use WebSockets or an equivalent real-time communication mechanism.
- Implement proper file-transfer handling.
- Handle multiple concurrent clients.
- Handle disconnections and reconnections gracefully.
- Validate file uploads and enforce configurable file-size limits.
- Restrict access to the local network where practical.
- Do not depend on third-party cloud storage, hosted databases, or external messaging services.

## Important Principles

1. Local-first: All application data stays on the local machines/network.
2. Real-time: Messages and connection status update immediately.
3. Persistent: Messages and attachments survive restarts.
4. Simple: Other machines should be able to connect without complicated configuration.
5. Reliable: Handle network interruptions and failed file transfers.
6. Secure: Validate incoming requests and prevent unauthorized file access.

**Final Goal:** Turn this project into a private, self-hosted LAN messenger — essentially a lightweight local alternative to Slack, where machines on the same network can chat and exchange files without relying on the internet or cloud services.