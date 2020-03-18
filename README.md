# Flex Transfer Park Plugin (v1.0.0)
Provides agent the ability to handle multiple concurrent calls by parking (AKA place on hold) an existing call and answering another

>**Status:** POC working with [flex-ui v1.14.1](https://www.twilio.com/docs/flex/release-notes/flex-ui-release-notes#v-1141)
>
> See [Flex Changes](#flex-changes) section before mixing with other plugins

## How It Works

* When an agent parks a call, [Flex Action](https://www.twilio.com/docs/flex/actions-framework) `TransferTask` is invoked to put the caller back into the queue
  * A single task will have multiple reservations
  * Parked customers are placed on hold as conference participants
* Worker's Task Channel capacity for `voice` must be greater than 1
* TaskRouter Workflow requires a high `Task Reservation Timeout` value so that the parked call reservation can wait longer. This may impact reporting metric and customer experience.

## Scenarios

### #1: Agent wants to accept and park Customer1
1. Agent accepts incoming call from `Customer1`
2. Agent wants to park call, and clicks park button on `ParticipantCanvas`
3. Action `TransferTask` invoked to initiate cold transfer, with new attributes:
   * `workerParked = true`
   * `targetWorkerContactUri = <current worker contact uri>`
4. TaskRouter Workflow's has a dedicated primary filter that detects the parked task and preserves it for the worker
 (`workerParked == true`), and uses a single Routing Step.
   * Queue: `Everyone`
   * Expression (`worker.contact_uri == task.targetWorkerContactUri`)
   * Timeout: `None`
   * *see: [samples/TaskRouter_Workflow.json](https://github.com/bryan-palmer/plugin-transfer-park/blob/master/samples/TaskRouter_Workflow.json)*

### #2: Agent speaking with Customer1, when Customer2 calls
1. Agent is currently on a call with `Customer1`, when an inbound task is received for `Customer2`
2. Agent accepts `Customer2` call
3. Browser window.confirm() asks worker if they are OK putting `Customer1` on hold
4. `Customer1` is parked via method described above in `Scenario1`
5. `Customer2` call is answered

### #3: Agent wants to park Customer2 and speak with Customer1
* Method A) *Identical to Scenario #2*
* Method B) Agent can park `Customer2` first, then accept `Customer1` task  

## Flex Changes

The following changes to default Flex behavior//UI may not play well together when combined with multiple plugins (e.g. there can only be one `AcceptTask` Action, but multiple plugins may attempt to change it)

### Default Behavior
1. Replaced Action `AcceptTask` to check if worker is already on a call
2. Added listener `afterTransferTask` invokes Action `CompleteTask` to auto-complete reservation on parked call

### UI
1. new `CallTaskChannel` definition `transferParkChannel` renders parked calls in task list
2. new `TransferParkButton` added to inbound task `ParticipantCanvas` and `TaskListButtons` 

## How to Setup
1. Update TaskRouter Workflow (*see [samples/TaskRouter_Workflow.json](https://github.com/bryan-palmer/plugin-transfer-park/blob/master/samples/TaskRouter_Workflow.json)*)
2. Run this plugin (instructions below)
3. Make test calls!


## Remaining Action Items

### Todo
   - TR: update workflow logic to prevent worker from receiveing >channelMax-1 tasks (padding for transfer)
   - UI: update to use latest flex-ui version
   - UI: fix channel definition for 'transfered' calls. It's showing a group of ppl and not incomingPhone
   - UI: replace window.confirm() with styled lightbox  (`TransferParkPlugin.js`)
   - UI: refactor logic for retrieving activeTask (`TransferParkPlugin.js`)
   - UX: error handling on transfer failure
   - UX: when completing taskA, how to prevent the twilio client disconnect dingdong notification?

### Needs Additional Design+Review
   - Flex: Check for any recent changes to `TransferTask` Action to simplify worker targeting logic
   - TaskRouter
     - scenario: what happens to the call if it's not picked up again?
     - what's the best approach for handling reservation timeouts for the new task resulting in activity ==> Offline?
   - Confirm out of the box behavior not impacted
     - Transfer UI (to queue and worker)
   - Historical Reporting
     - How is the single task with multiple reservations+segments represented? Accurate?
       - https://www.twilio.com/docs/flex/flex-wfo/analytics-data-model
       - https://www.twilio.com/docs/flex/flex-wfo/conversation-structure
     - Is the queue level reporting accurate across transfers?
   - Realtime Reporting
     - Confirm UI is consistent

## Screenshots

![1) CustomerB Task Received](https://github.com/bryan-palmer/plugin-transfer-park/blob/master/screenshots/1_incomingCustomerB.png)
![2) Window Confirm Action](https://github.com/bryan-palmer/plugin-transfer-park/blob/master/screenshots/2_acceptCustomerBWindowConfirm.png)
![3) CustomerA Parked](https://github.com/bryan-palmer/plugin-transfer-park/blob/master/screenshots/3_CustomerAParked.png)
![4) CustomerB Parked](https://github.com/bryan-palmer/plugin-transfer-park/blob/master/screenshots/4_CustomerBParked.png)

---

# Twilio Flex Plugin

Twilio Flex Plugins allow you to customize the appearance and behavior of [Twilio Flex](https://www.twilio.com/flex). If you want to learn more about the capabilities and how to use the API, check out our [Flex documentation](https://www.twilio.com/docs/flex).

## Setup

Make sure you have [Node.js](https://nodejs.org) as well as [`npm`](https://npmjs.com) installed.

Afterwards, install the dependencies by running `npm install`:

```bash
cd 

# If you use npm
npm install
```

## Development

In order to develop locally, you can use the Webpack Dev Server by running:

```bash
npm start
```

This will automatically start up the Webpack Dev Server and open the browser for you. Your app will run on `http://localhost:8080`. If you want to change that you can do this by setting the `PORT` environment variable:

```bash
PORT=3000 npm start
```

When you make changes to your code, the browser window will be automatically refreshed.

## Deploy

Once you are happy with your plugin, you have to bundle it in order to deploy it to Twilio Flex.

Run the following command to start the bundling:

```bash
npm run build
```

Afterwards, you'll find in your project a `build/` folder that contains a file with the name of your plugin project. For example, `plugin-example.js`. Take this file and upload it into the Assets part of your Twilio Runtime.

Note: Common packages like `React`, `ReactDOM`, `Redux` and `ReactRedux` are not bundled with the build because they are treated as external dependencies so the plugin will depend on Flex to provide them globally.