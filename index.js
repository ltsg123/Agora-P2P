import "./AgoraRTC_N-production.js";

import { $, getQueryVariable } from "./utils.js";
var localVideo, localAudio;
let remoteAudio;
const autoSubVideo = false;
const remoteVolumes = [];

const appid = getQueryVariable("appid") ?? "";
const channel = getQueryVariable("channel") ?? "test1_";

AgoraRTC.setParameter("SHOW_GLOBAL_CLIENT_LIST", true);
AgoraRTC.setParameter("P2P", true);
AgoraRTC.setParameter("SHOW_P2P_LOG", true);

window.client = AgoraRTC.createClient({
  mode: "live",
  codec: "vp8",
  clientRoleOptions: { level: 1, delay: 3000 },
  role: "host",
});

async function subscribe(uid, mediaType) {
  const user = client.remoteUsers.find((u) => u.uid === uid);
  console.log("start subscribe", user);
  await client.subscribe(user, mediaType);

  if (mediaType !== "video" && user.audioTrack && !user.audioTrack.isPlaying) {
    remoteAudio = user.audioTrack;
    const remoteVolume1 = document.createElement("p");
    const remoteVolume2 = document.createElement("p");

    document.getElementById("remote_volume").appendChild(remoteVolume1);
    document.getElementById("remote_volume").appendChild(remoteVolume2);
    remoteVolumes.push({
      el1: remoteVolume1,
      el2: remoteVolume2,
      audioTrack: user.audioTrack,
    });
    user.audioTrack.play();
  }
  if (user.videoTrack && !user.videoTrack.isPlaying) {
    const player = `
      <div id="player-${uid}" style="width: 640px; height: 480px;"></div>
    `;
    $("remote-stream-list").insertAdjacentHTML("beforeend", player);

    user.videoTrack.play(`player-${uid}`);
  }
}

async function unsubscribe(uid, mediaType) {
  const user = client.remoteUsers.find((u) => u.uid === uid);
  console.log("unsubscribe", uid);
  await client.unsubscribe(user, mediaType);
  console.log("unsubscribe success");

  if (!user.videoTrack) {
    $(`player-${uid}`).remove();
  }
}

function handleUserJoined(user) {
  const id = user.uid;
  $(`remote-${id}`)?.remove();
  const li = document.createElement("li");
  li.id = `remote-${id}`;
  const item = `<p>UID: <span>${id}</span> Audio: <span id="remote-${id}.audio" class="audio">${!!user.hasAudio}</span> Video: <span id="remote-${id}.video" class="video">${!!user.hasVideo}</span></p>
  `;
  li.insertAdjacentHTML("beforeend", item);
  const button1 = document.createElement("button");
  button1.innerText = "订阅视频";
  button1.onclick = () => subscribe(id, "video");
  li.appendChild(button1);
  const button2 = document.createElement("button");
  button2.innerText = "订阅音频";
  button2.onclick = () => subscribe(id, "audio");
  li.appendChild(button2);
  const button5 = document.createElement("button");
  button5.innerText = "取消订阅音频";
  button5.onclick = () => unsubscribe(id, "audio");
  li.appendChild(button5);
  const button6 = document.createElement("button");
  button6.innerText = "重新订阅音频";
  button6.onclick = () => resubscribe(id, "audio");
  li.appendChild(button6);
  const button3 = document.createElement("button");
  button3.innerText = "取消订阅音视频";
  button3.onclick = () => unsubscribe(id);
  li.appendChild(button3);
  const button4 = document.createElement("button");
  button4.innerText = "取消订阅视频";
  button4.onclick = () => unsubscribe(id, "video");
  li.appendChild(button4);

  $("remote_list").appendChild(li);
}

function handleUserPublished(user, mediaType) {
  const id = user.uid;
  const span = $(`remote-${id}.${mediaType}`);
  if (!span) return;

  span.textContent = `${mediaType === "audio" ? user.hasAudio : user.hasVideo}`;

  if (autoSubVideo) {
    if (user.hasVideo) {
      subscribe(id, "video");
    }
  }
}

function handleUserUnpublished(user, mediaType) {
  console.warn("user-unpublished", user, mediaType);
  const id = user.uid;
  const span = $(`remote-${id}.${mediaType}`);
  if (!span) return;

  span.textContent = `${mediaType === "audio" ? user.hasAudio : user.hasVideo}`;
}

function handleUserLeft(user) {
  const id = user.uid;
  $(`remote-${id}`).remove();
}

onload = () => {
  const localVolume1 = document.createElement("p");
  const localVolume2 = document.createElement("p");
  setInterval(() => {
    const showVolume = (volumObj) => {
      const { el1, el2, audioTrack } = volumObj;
      el1.innerText = Math.floor(audioTrack._source.getAccurateVolumeLevel());

      el2.innerText = audioTrack.getVolumeLevel() * 100;
    };
    if (localAudio) {
      showVolume({
        el1: localVolume1,
        el2: localVolume2,
        audioTrack: localAudio,
      });
    }
    if (remoteVolumes.length > 0) {
      remoteVolumes.forEach((volume) => {
        showVolume(volume);
      });
    }
  }, 100);
  document.getElementById("local_volume").appendChild(localVolume1);
  document.getElementById("local_volume").appendChild(localVolume2);
};

function bindButtons() {
  $("join").onclick = async () => {
    await client.join(appid, channel, null);
  };
  $("leave").onclick = async () => {
    await client.leave();
  };

  $("pub").onclick = async () => {
    [localAudio, localVideo] = await AgoraRTC.createMicrophoneAndCameraTracks();

    localVideo.play("local");
    localAudio.play();

    await client.publish([localAudio]);
    await client.publish([localVideo]);
    console.log("publish success");
  };

  $("unpub").onclick = async () => {
    await client.unpublish();
    localAudio && localAudio.close();
    localVideo && localVideo.close();
  };

  $("muteVideo").onclick = async () => {
    localVideo && localVideo.setMuted(true);
  };
  $("unmuteVideo").onclick = async () => {
    localVideo && localVideo.setMuted(false);
  };
  $("muteAudio").onclick = async () => {
    localAudio && localAudio.setMuted(true);
  };
  $("unmuteAudio").onclick = async () => {
    localAudio && localAudio.setMuted(false);
  };
}

function bindClientEvents() {
  client.on("user-info-updated", (uid, message) => {
    console.log("user info updated", uid, message);
  });

  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);
  client.on("user-joined", handleUserJoined);
  client.on("user-left", handleUserLeft);
}

async function bindEvnets() {
  bindButtons();
  bindClientEvents();
}

bindEvnets();
