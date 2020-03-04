import {getItem} from '../collections';

import {useEntryState} from './EntryStateProvider';
import {expandUrls} from './expandUrls';

/**
 * Look up a file by its collection and perma id.
 *
 * @param {Object} options
 * @param {String} options.collectionName - Collection name of file type to look for (in camel case).
 * @param {String} options.permaId - Perma id of file look up
 *
 * @example
 * const imageFile = useFile({collectionName: 'imageFiles', permaId: 5});
 * imageFile // =>
 *   {
 *     id: 102,
 *     permaId: 5,
 *     width: 1000,
 *     height: 500,
 *     urls: {
 *       large: 'https://...'
 *     },
 *   }
 */
export function useFile({collectionName, permaId}) {
  const entryState = useEntryState();

  return expandUrls(
    collectionName,
    getItem(entryState.collections, collectionName, permaId),
    entryState.config && entryState.config.fileUrlTemplates
  );
}
