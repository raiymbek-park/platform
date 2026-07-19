# MSW — Network Mocking Examples

Mock Service Worker (MSW) intercepts real HTTP/GraphQL requests at the network layer; the component, hooks, and fetch all run for real — only the response crossing the network is supplied by the test.

**MSW is legitimate for exactly two things — and neither is faking your own backend:**

1. A **genuinely external server you do not own** — a third-party API (maps, payments, weather, an LLM). Its response *is* the external boundary, so supplying it is correct.
2. The **transport-contract set** — tests whose subject *is* the wire: outgoing headers, request batching, serialization round-trips, and HTTP-status → error mapping. Here the network itself is under test, not the logic behind it.

> ❌ **Not for mocking your own backend.** The network line between a client and a server you *both own* is an internal seam. Hand-writing its responses fabricates your own validation, authorization, derivation, and projection — the very code the test should exercise. See "The network is not automatically the boundary" in [testing-strategy.md](../testing-strategy.md) and `review.md` §D. For your own server, run it for real and mock only the datastore (the widest-boundary rule). If the project has an in-process harness for that, its example file — not this one — is what to load.

## Why MSW, Not Module Mocking

Module-level mocking (`vi.mock` / `jest.mock`) replaces whole modules — the test stops verifying that parts work together. Each mock is a hole in integration. When you must intercept at the network (an external server, or a transport test), MSW is the right tool — but the "what to mock" litmus below still governs *what the response may contain*.

```typescript
// ❌ Module mocking — test verifies nothing real
jest.mock('./placesApi')
jest.mock('./hooks/useGeolocation')

// ✅ Network mocking of a THIRD-PARTY API you don't own
//    (the maps provider IS the external boundary)
server.use(
  http.get('https://maps.example.com/v1/nearby', () =>
    HttpResponse.json([{ id: 1, name: 'Blue Bottle', lat: 37.7, lng: -122.4 }]),
  ),
)
render(<NearbyCafes userLocation={{ lat: 37.7, lng: -122.4 }} />)
expect(await screen.findByText('Blue Bottle')).toBeInTheDocument()
expect(screen.getByText('0.3 km')).toBeInTheDocument() // distance computed by YOUR code
```

The mock returns the third party's **raw payload** (coordinates); the app's own logic derives the displayed distance. It does **not** return a value your server would have computed — that is the line between a boundary mock and a fabricated backend.

## What to Mock

```
✅ Mock:     Genuinely external servers (third-party APIs), the transport under test, animations
❌ Don't mock: Your own server's responses, business logic, authorization, child components, hooks, store
```

**Litmus (identical to `review.md` §D) — look at what the response carries:**

```
A third party's raw data                              → legitimate boundary mock.
Your own server's computed output (ids, derived/
aggregated fields, status codes, an allow/deny
authorization verdict, a localized/filtered projection) → fabricated backend. Stop.
```

## Transport-Contract Tests (the second legitimate use)

When the subject of the test *is* the wire — not the logic behind it — MSW is correct even against your own server. Assert what the client puts on the wire and how it maps the response back:

```typescript
it('requests carry the active locale header', async () => {
  let sent: string | null = null
  server.use(
    http.get('*/resource', ({ request }) => {
      sent = request.headers.get('x-locale')
      return HttpResponse.json({})
    }),
  )
  await client.resource.query()
  expect(sent).toBe('ru')
})
```

Keep this set **thin** — headers, serialization, batching, HTTP-status → error mapping. Anything about business behavior belongs below the network, at the datastore boundary, exercised through the real server.

## Contract Safety with Codegen

When the API has a schema (GraphQL, OpenAPI, tRPC), generate typed handlers from it so a schema change breaks the test at compile time — this keeps even the thin transport set honest.

```typescript
import { graphql } from './generated/msw-handlers'

server.use(
  graphql.query('GetBooking', ({ variables }) => ({
    data: { booking: { id: variables.id, status: 'confirmed' } }, // TS errors if a field is renamed
  })),
)
```

```
Typed handlers for:  GraphQL ✅  tRPC ✅  REST + OpenAPI ✅  gRPC + Protobuf ✅
Not for:             Unspecified REST without schema ❌
```
