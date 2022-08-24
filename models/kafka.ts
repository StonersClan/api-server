import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "sih",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

export const pushMsgToQueue = async (msg: any) => {
  await producer.connect();
  await producer.send({
    topic: "quickstart",
    messages: [
      {
        value: JSON.stringify(msg),
      },
    ],
  });
  await producer.disconnect();
};
