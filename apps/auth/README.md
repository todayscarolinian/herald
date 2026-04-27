Prerequisites:

- [Vercel CLI](https://vercel.com/docs/cli) installed globally
- Redis instance (only required when using the BullMQ email queue worker)

To develop locally:

```
npm install
vc dev
```

```
open http://localhost:3000
```

To build locally:

```
npm install
vc build
```

To deploy:

```
npm install
vc deploy
```

Redis for Email Queue Worker

The email service uses BullMQ for background email processing.

- Redis is required when running the email queue worker
- Make sure Redis is running before starting the microservice if `USE_EMAIL_QUEUE=true`
- To run the microservice without Redis, set:

```env
USE_EMAIL_QUEUE=false
```

When `USE_EMAIL_QUEUE=false`, emails are sent directly through Resend instead of being queued through BullMQ.
