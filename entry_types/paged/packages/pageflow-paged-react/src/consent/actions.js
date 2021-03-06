export const REQUEST = 'CONSENT_REQUEST';
export const DENY_ALL = 'CONSENT_DENY_ALL';
export const ACCEPT_ALL = 'CONSENT_ACCEPT_ALL';
export const SAVE = 'CONSENT_SAVE';

export function request({vendors}) {
 return {
   type: REQUEST,
   payload: {vendors}
 };
}

export function denyAll() {
  return {
    type: DENY_ALL
  };
}

export function acceptAll() {
  return {
    type: ACCEPT_ALL
  };
}

export function save(vendors) {
 return {
   type: SAVE,
   payload: vendors
 };
}
