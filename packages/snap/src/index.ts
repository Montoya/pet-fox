import { OnRpcRequestHandler, OnCronjobHandler } from '@metamask/snaps-types';
import { heading, panel, text } from '@metamask/snaps-ui';

const answers = [
  'Certainly',
  'Without a doubt',
  'Absolutely',
  'You betcha',
  'I think so',
  'It is likely',
  'Unlikely',
  'Negative',
  'Not looking good',
  'Doubtful',
  'I think not',
  'Not going to happen',
  'Unsure, ask again later...',
  'Hard to say, ask again later...',
  'Unclear, ask again later...',
];

const Fox = {
  birth: 0, // should be epoch time
  age: 0, // based on epoch time too
  health: 100.0, // range: 0 to 100
  hunger: 50.0, // range: 0 to 100
  happiness: 50.0, // range: 0 to 100
  dirty: 0.0, // everybody poops
  name: 'Fox',
  stamp: 0, // should be epoch time
  lastNotify: 0, // also epoch time
  updateModifier: 1,
};

const foxBirth = function (name: string) {
  const myFox = Object.assign({}, Fox);
  myFox.birth = myFox.stamp = Date.now();
  myFox.name = name;
  if (name === 'Max Pain') {
    myFox.updateModifier = 200;
  }
  return myFox;
};

const foxUpdate = async function (fox: typeof Fox) {
  // pass by reference
  if (fox.health == 0) {
    return;
  } // it's so over
  // take a fox and update it based on how much time has elapsed
  // then update the stamp
  // first, get the current epoch time
  const rightNow = Date.now();
  // then, get how much time has elapsed
  const elapsedTime = rightNow - fox.stamp;
  // the age of the fox should increase
  fox.age += elapsedTime;
  // the dirtiness increases
  fox.dirty += 0.000000047 * elapsedTime * fox.updateModifier; // works out to 1 every 6 hours
  if (fox.dirty > 6.0) {
    fox.dirty = 6; // maxes at 6
  }
  // the fox's hunger should decrease (which is kind of counter intuitive because it's getting more hungry) by 0.00000069 each millisecond
  fox.hunger -= 0.00000089 * elapsedTime * fox.updateModifier; // was 69
  if (fox.hunger < 0) {
    fox.hunger = 0.0;
  } // bounds check

  // now if the hunger is under 10 then the health should start to decrease at a quicker rate
  if (fox.hunger < 10) {
    fox.health -= 0.000001226 * elapsedTime * fox.updateModifier; // was 926
  }

  if (fox.health < 0) {
    fox.health = 0;
  } // bounds check, but also... death

  let hpyMod = 1;
  if (fox.health < 33) {
    hpyMod = 3;
  } else if (fox.health < 66) {
    hpyMod = 2;
  }
  hpyMod += Math.floor(fox.dirty);
  fox.happiness -= 0.000000425 * hpyMod * elapsedTime * fox.updateModifier; // was 425
  if (fox.happiness < 0) {
    fox.happiness = 0;
  } // bounds check, but also... wow. sad.
  fox.stamp = rightNow;
};

const foxNotify = async function (fox: typeof Fox) {
  // pass by reference
  const rightNow = Date.now();
  // should send notifications based on current state, once every hour at most...
  const elapsedNotifyTime = rightNow - fox.lastNotify;
  if (elapsedNotifyTime > 3599999 / fox.updateModifier) {
    // 1 hour
    let message = '';
    if (fox.health < 50) {
      message = 'Your pet fox is sick and needs attention soon!';
    } else if (fox.hunger < 25) {
      message = 'Your pet fox is hungry and needs to be fed!';
    } else if (fox.happiness < 24) {
      message = 'Your pet fox is sad and misses you!';
    } else if (fox.dirty >= 1) {
      message = 'Your pet fox needs its habitat cleaned!';
    }

    if (message.length > 0) {
      await snap.request({
        method: 'snap_notify',
        params: {
          type: 'inApp',
          message,
        },
      });

      await snap.request({
        method: 'snap_notify',
        params: {
          type: 'native',
          message,
        },
      });
      fox.lastNotify = rightNow;
    }
  }
};

const foxSave = async function (fox: typeof Fox) {
  const state = { petFox: fox };
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
};

const foxCheck = async function () {
  const state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });
  if (state) {
    return true;
  }
  return false;
};

const foxCall = async function () {
  let state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });

  if (!state) {
    state = { petFox: foxBirth('Fox') };
    // initialize state if empty and set default data
    await snap.request({
      method: 'snap_manageState',
      params: { operation: 'update', newState: state },
    });
  }

  return state.petFox as typeof Fox;
};

const foxFeed = async function () {
  // get the fox
  const fox = await foxCall();
  if (fox.health == 0) {
    return fox;
  } // it's so over
  fox.hunger += 40;
  if (fox.hunger > 100) {
    fox.hunger = 100.0;
  }
  await foxSave(fox);
  return fox;
};

const foxPet = async function () {
  // get the fox
  const fox = await foxCall();
  if (fox.health == 0) {
    return fox;
  } // it's so over
  fox.happiness += 20;
  if (fox.happiness > 100) {
    fox.happiness = 100.0;
  }
  await foxSave(fox);
  return fox;
};

const foxHeal = async function () {
  // get the fox
  const fox = await foxCall();
  if (fox.health == 0) {
    return fox;
  } // it's so over

  if (fox.hunger >= 20) {
    // no medicine on an empty stomach!
    fox.health = 100.0; // make this one simple
  }
  await foxSave(fox);
  return fox;
};

const foxClean = async function () {
  // get the fox
  const fox = await foxCall();
  if (fox.health == 0) {
    return fox;
  } // it's so over
  fox.dirty -= 1;
  if (fox.dirty < 0) {
    fox.dirty = 0;
  }
  await foxSave(fox);
  return fox;
};

const periodicUpdate = async function () {
  // for cronjob
  // get the fox
  const fox = await foxCall();
  await foxUpdate(fox);
  await foxNotify(fox);
  await foxSave(fox);
};

const manualUpdate = async function () {
  // for dapp
  // get the fox
  const fox = await foxCall();
  await foxUpdate(fox);
  await foxSave(fox);
  return fox;
};

const humanReadableDate = function (timestamp: number) {
  const date = new Date(timestamp);
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  let hour = date.getHours();
  const amOrPm = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  const minute = date.getMinutes();
  return `${hour}:${minute} ${amOrPm} ${month} ${day}, ${year}`;
};

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  switch (request.method) {
    case 'fireCronjob':
      await periodicUpdate();
      break;
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
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'check':
      return await foxCheck();
    case 'update':
      return await manualUpdate();
    case 'feed':
      return await foxFeed();
    case 'pet':
      return await foxPet();
    case 'heal':
      return await foxHeal();
    case 'clean':
      return await foxClean();
    case 'speak':
      try {
        const message = request.params.message.trim();
        if (message.length > 0) {
          return await snap.request({
            method: 'snap_dialog',
            params: {
              type: 'alert',
              content: panel([
                heading('What does the 🦊 say?'),
                text(`🦊💬 ${message}`),
              ]),
            },
          });
        }
      } catch (error) {}
      break;
    case 'ask':
      // get the fox
      const fox = await foxCall();
      let query = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'prompt',
          content: panel([
            heading('Ask your pet 🦊 a question!'),
            text(`Enter your question below and ${fox.name} will answer it:`),
          ]),
        },
      });
      query = query && typeof query === 'string' ? query.trim() : '';
      if (query.length > 0) {
        const prediction = answers[Math.floor(Math.random() * answers.length)];
        return snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: panel([
              heading('Here is your prediction'),
              text(`_You asked:_ ${query}`),
              text(`🦊💬 ${prediction}`),
            ]),
          },
        });
      }
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: panel([
            heading('Sorry, please try again'),
            text(
              'You must enter a ❓ in the previous prompt to get a prediction!',
            ),
          ]),
        },
      });

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
      const name = input && typeof input === 'string' ? input.trim() : 'Fox';
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
