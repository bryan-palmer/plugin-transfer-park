import React from "react";
import { VERSION, Utils, StateHelper } from "@twilio/flex-ui";
import { FlexPlugin } from "flex-plugin";

import TransferParkButton from "./components/TransferPark/TransferParkButton";
import { TransferPark } from "./components/TransferPark/TransferPark";

const PLUGIN_NAME = "TransferParkPlugin";

export default class TransferParkPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    this.registerReducers(manager);

    flex.ParticipantCanvas.Actions.Content.add(
      <TransferParkButton key="participant-canvas-list-item-transfer-park-button" />,
      task => task.attributes.direction === "inbound"
    );

    // complete first reservation after successful transfer
    flex.Actions.addListener("afterTransferTask", payload => {
      if (payload.task.attributes.workerParked) {
        flex.Actions.invokeAction("CompleteTask", {
          task: payload.task,
          reason: "worker parked call"
        })
          .catch(e => {
            console.log("Error invoking CompleteTask: ", e);
          });
      }
    });

    flex.Actions.replaceAction("AcceptTask", (payload, original) => {
      let currentState = manager.store.getState(),
        activeTask;

      // no active call?
      if (!StateHelper.getCurrentPhoneCallState()) {
        return original(payload);
      }

      // find task for current worker call sid
      // todo: lazy logic; update and move to helper -or- check for preexisting method
      currentState.flex.worker.tasks.forEach(t => {
        if (
          t.channelType === "voice" &&
          t.conference &&
          t.conference.liveWorkers.length &&
          t.conference.liveWorkers[0].isMyself
        ) {
          activeTask = t;
        }
      });

      return new Promise((resolve, reject) => {
        // am I on the phone already? no? ==> exit
        if (currentState.flex.phone.connection) {
          if (
            // todo: replace with lightbox?
            window.confirm(
              `Are you sure you want to put the active call on hold?`
            )
          ) {
            // put current call on hold and answer new
            TransferPark(
              activeTask,
              currentState.flex.worker.attributes.contact_uri,
              currentState.flex.worker.worker.sid
            ).then(result => {
              resolve();
            })
              .catch(e => {
                console.log("Error TransferPark(): ", e);
                reject(e);
              });
          } else {
            reject("worker declined to park current caller");
          }
        } else {
          resolve();
        }
      }).then(() => original(payload));
    });

    // create custom channel definition "transferParkChannel"
    const transferParkChannel = flex.DefaultTaskChannels.createCallTaskChannel(
      "transferParkChannel",
      task =>
        task.taskChannelUniqueName === "voice" &&
        task.attributes.workerParked === true &&
        task.status === "pending"
    );

    transferParkChannel.templates.TaskListItem = {
      firstLine: task => `${task.attributes.from} (PARKED)`,
      secondLine: task =>
        `Parked (${Utils.formatTimeDuration(
          (Date.now() - task.dateCreated),
          "full"
        )}): ${Utils.formatTimeDuration(
          task.age * 1000 + (Date.now() - task.dateCreated),
          "full"
        )}`
    };

    transferParkChannel.templates.IncomingTaskCanvas =
      transferParkChannel.templates.TaskListItem;

    transferParkChannel.icons = {
      list: "Eye",
      active: "EyeBold"
    };
    transferParkChannel.colors.main = "green";
    transferParkChannel.removedComponents = [
      { target: "TaskListButtons", key: "reject" },
      { target: "IncomingTaskCanvasActions", key: "Reject" }
    ];

    transferParkChannel.addedComponents = [
      {
        target: "TaskListButtons",
        component: (
          <TransferParkButton key="incoming-task-canvas-action-transfer-park-button" />
        ),
        options: {
          if: props => props.status === "accepted"
        }
      }
    ];

    flex.TaskChannels.register(transferParkChannel);
  }

  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint: disable-next-line
      console.error(
        `You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`
      );
      return;
    }
  }
}
