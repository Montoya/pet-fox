/**
 * The snap origin to use.
 * Will default to the local hosted snap if no value is provided in environment.
 */
export const defaultSnapOrigin = process.env.SNAP_ORIGIN as string;
export const syncSnapOrigin = process.env.SYNC_SNAP_ORIGIN as string;
