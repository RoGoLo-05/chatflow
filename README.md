# 💬 Chatflow

App de mensajería en tiempo real estilo WhatsApp/Discord, construida desde cero con tecnologías profesionales.

## 🚀 Demo

> App desplegada próximamente

## ✨ Funcionalidades

- 👤 Registro e inicio de sesión con JWT
- 💬 Chats privados en tiempo real
- 👥 Grupos de chat con múltiples miembros
- ⚡ Mensajes instantáneos con WebSockets
- 😄 Reacciones a mensajes en tiempo real
- 🕓 Historial de mensajes persistente
- 🟢 Indicador de estado online

## 🛠️ Stack tecnológico

### Frontend
- **Next.js 16** + React + TypeScript
- **Tailwind CSS** para estilos
- **Socket.io Client** para WebSockets

### Backend
- **NestJS** + TypeScript
- **WebSockets** con Socket.io
- **JWT** para autenticación
- **bcrypt** para encriptación de contraseñas

### Base de datos
- **PostgreSQL** en Supabase
- **Prisma ORM** para gestión de datos

## 🏗️ Arquitectura

```
chatflow/
├── backend/          # API REST + WebSocket Server (NestJS)
│   ├── src/
│   │   ├── auth/     # Registro, login, JWT
│   │   ├── users/    # Gestión de usuarios
│   │   ├── chats/    # Mensajes y grupos
│   │   ├── chat/     # Gateway WebSockets
│   │   └── prisma/   # Conexión base de datos
│   └── prisma/
│       └── schema.prisma
└── frontend/         # Interfaz de usuario (Next.js)
├── app/
│   ├── page.tsx      # Login / Registro
│   └── chat/
│       └── page.tsx  # Dashboard de chat
└── lib/
├── api.ts        # Llamadas HTTP al backend
└── socket.ts     # Conexión WebSocket
```

## 📦 Instalación local

### Requisitos
- Node.js v20+
- Cuenta en Supabase (PostgreSQL)

### Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Variables de entorno

Crea `backend/.env`:
DATABASE_URL="tu_url_de_supabase"

## 📡 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /auth/register | Registro de usuario |
| POST | /auth/login | Inicio de sesión |
| GET | /users/search | Buscar usuarios |
| POST | /chats/send | Enviar mensaje privado |
| GET | /chats/conversation/:id1/:id2 | Historial de conversación |
| POST | /chats/groups/create | Crear grupo |
| POST | /chats/groups/add-member | Añadir miembro a grupo |
| GET | /chats/groups/:id/messages | Mensajes de grupo |

## 🔌 Eventos WebSocket

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| sendMessage | Cliente → Servidor | Enviar mensaje |
| newMessage | Servidor → Cliente | Recibir mensaje |
| joinRoom | Cliente → Servidor | Unirse a sala |
| addReaction | Cliente → Servidor | Añadir reacción |
| reactionAdded | Servidor → Cliente | Reacción recibida |
| typing | Cliente → Servidor | Indicador de escritura |

## 👨‍💻 Autor

**Roberto** — [GitHub](https://github.com/RoGoLo-05)