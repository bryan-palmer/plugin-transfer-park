import { Actions } from "@twilio/flex-ui";

export function TransferPark(task, workerContactUri, workerSid) {
  return new Promise((resolve, reject) => {
    let newAttributes = task.attributes;

    newAttributes.workerParked = true;
    newAttributes.targetWorkerContactUri = workerContactUri;

    Actions.invokeAction("TransferTask", {
      sid: task.sid,
      targetSid: workerSid, // my worker!
      options: {
        attributes: newAttributes,
        mode: "COLD"
      }
    })
      .then(result => {
        resolve();
      })
      .catch(e => {
        console.log("Error invoking TransferTask: ", e);

        reject();
      });
  });
}
