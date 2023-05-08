import { OnRpcRequestHandler, OnCronjobHandler } from '@metamask/snaps-types';
import { heading, panel, text } from '@metamask/snaps-ui';

const Fox = {
  birth: 0, // should be epoch time 
  age: 0,
  health: 100, // range: 0 to 100
  hunger: 50, // range: 0 to 100
  happiness: 50, // range: 0 to 100
  name: "", 
  stamp: 0 // should be epoch time 
};

const foxBirth = function(name:String) { 
  let myFox = Object.create(Fox); 
  myFox.birth =  myFox.stamp = Date.now(); 
  myFox.name = name; 
  return myFox; 
}

const foxSave = async function(fox:Object) { 
  let state = { petFox: fox }; 
  await snap.request({ 
    method: 'snap_manageState', 
    params: { operation: 'update', newState: state }, 
  }); 
}

const foxCall = async function() { 
  let state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as { petFox: Object } | null;

  if (!state) {
    state = { petFox: foxBirth('Foxy') };
    // initialize state if empty and set default data
    await snap.request({
      method: 'snap_manageState',
      params: { operation: 'update', newState: state },
    });
  }

  return state.petFox; 
}

const humanReadableDate = function(timestamp) { 
  const date = new Date(timestamp);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  let hour = date.getHours();
  const amOrPm = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  const minute = date.getMinutes();
  return `${hour}:${minute} ${amOrPm} ${month} ${day}, ${year}`;
}

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  switch (request.method) {
    case 'fireCronjob':
      return true; 
    default:
      throw new Error('Method not found.');
  }
};

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  switch (request.method) {
    case 'hello':
      const input = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'prompt',
          content: panel([
            heading('Would you like to adopt a pet 🦊?'),
            text('Give your pet a name:'),
          ]),
        },
      });
      const name = input ? input.trim() : 'Fox'; 
      const myFox = foxBirth(name); 
      foxSave(myFox); 
      const birthdate = humanReadableDate(myFox.birth); 
      return snap.request({
        method: 'snap_dialog', 
        params: { 
          type: 'alert', 
          content: panel([
            heading('Say 👋 to your little friend!'),
            text('You now have your own pet 🦊 to love and care for.'),
            text(`🦊 **Name**: ${myFox.name}`), 
            text(`📅 **Born**: ${birthdate}`), 
            text('Make sure to feed it and show it plenty of 💙!'), 
          ]), 
        }, 
      }); 
    default:
      throw new Error('Method not found.');
  }
};
