import {
  type DocumentData,
  getDocs,
  limit,
  type Query,
  query,
  type QueryDocumentSnapshot,
  startAfter,
} from 'firebase/firestore'

// Cap on how many docs are pulled from Firestore per round-trip. This is purely
// an internal batching detail — it does NOT cap the limit a caller can request;
// callers loop in batches of this size to satisfy any requested page size.
export const FIRESTORE_BATCH_SIZE = 10

// Walks forward `offset` docs from the start of baseQuery, in batches of
// FIRESTORE_BATCH_SIZE, returning the cursor to resume from. Returns
// undefined if the query doesn't have that many docs.
export async function advanceCursor(
  baseQuery: Query<DocumentData>,
  offset: number
): Promise<QueryDocumentSnapshot<DocumentData> | undefined> {
  let cursor: QueryDocumentSnapshot<DocumentData> | undefined
  let remaining = offset

  while (remaining > 0) {
    const step = Math.min(FIRESTORE_BATCH_SIZE, remaining)
    const cursorQuery = cursor
      ? query(baseQuery, startAfter(cursor), limit(step))
      : query(baseQuery, limit(step))

    const snapshot = await getDocs(cursorQuery)
    if (snapshot.empty) {
      return undefined
    }

    cursor = snapshot.docs[snapshot.docs.length - 1]
    remaining -= snapshot.docs.length

    if (snapshot.docs.length < step) {
      return undefined
    }
  }

  return cursor
}

// Fetches up to `count` docs starting after `cursor`, in batches of
// FIRESTORE_BATCH_SIZE so a single call can satisfy any requested page size.
export async function fetchDocsInBatches(
  baseQuery: Query<DocumentData>,
  cursor: QueryDocumentSnapshot<DocumentData> | undefined,
  count: number
): Promise<QueryDocumentSnapshot<DocumentData>[]> {
  const docs: QueryDocumentSnapshot<DocumentData>[] = []
  let currentCursor = cursor
  let remaining = count

  while (remaining > 0) {
    const step = Math.min(FIRESTORE_BATCH_SIZE, remaining)
    const batchQuery = currentCursor
      ? query(baseQuery, startAfter(currentCursor), limit(step))
      : query(baseQuery, limit(step))

    const snapshot = await getDocs(batchQuery)
    if (snapshot.empty) {
      break
    }

    docs.push(...snapshot.docs)
    currentCursor = snapshot.docs[snapshot.docs.length - 1]
    remaining -= snapshot.docs.length

    if (snapshot.docs.length < step) {
      break
    }
  }

  return docs
}

// Fetches `pageLimit` docs for page `page` (1-based) from baseQuery, walking
// forward via advanceCursor and batching via fetchDocsInBatches so any
// requested limit is satisfied in as few round trips as possible.
export async function fetchPaginatedDocs(
  baseQuery: Query<DocumentData>,
  page: number,
  pageLimit: number
): Promise<QueryDocumentSnapshot<DocumentData>[]> {
  const offset = (page - 1) * pageLimit

  let cursor: QueryDocumentSnapshot<DocumentData> | undefined
  if (offset > 0) {
    cursor = await advanceCursor(baseQuery, offset)
    if (!cursor) {
      return []
    }
  }

  return fetchDocsInBatches(baseQuery, cursor, pageLimit)
}
