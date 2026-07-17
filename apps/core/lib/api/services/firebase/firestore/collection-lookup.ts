import type { Firestore } from 'firebase-admin/firestore'

/**
 * Fetches an entire Firestore collection once and builds a case-insensitive
 * name -> document ID lookup map. Used by bulk import routes to resolve/validate
 * references (e.g. position names, permission names) without a per-row query.
 */
export async function buildNameToIdMap(
  firestore: Firestore,
  collectionName: string,
  nameField = 'name'
): Promise<Map<string, string>> {
  const snapshot = await firestore.collection(collectionName).get()
  const map = new Map<string, string>()

  snapshot.forEach((docSnap) => {
    const name = docSnap.data()[nameField]
    if (typeof name === 'string') {
      map.set(name.toLowerCase(), docSnap.id)
    }
  })

  return map
}
