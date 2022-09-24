"use strinct";

const socket = io.connect();

const localVideo = document.querySelector("#localVideo-container video");
const videoGrid = document.querySelector("#videoGrid");
const notification = document.querySelector("#notification");
const notify = (message) => {
  notification.innerHTML = message;
};

const pcConfig = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
    },
  ],
};

const audioLevelQueue = Array(10).fill(0);

/**
 * Initialize webrtc
 */
const webrtc = new Webrtc(socket, pcConfig, {
  log: true,
  warn: true,
  error: true,
});

/**
 * Create or join a room
 */
const roomInput = document.querySelector("#roomId");
const joinBtn = document.querySelector("#joinBtn");
joinBtn.addEventListener("click", () => {
  const room = roomInput.value;
  if (!room) {
    notify("Room ID not provided");
    return;
  }

  webrtc.joinRoom(room);
});

const setTitle = (status, e) => {
  const room = e.detail.roomId;

  console.log(`Room ${room} was ${status}`);

  notify(`Room ${room} was ${status}`);
  document.querySelector("h1").textContent = `Room: ${room}`;
  webrtc.gotStream();
};
webrtc.addEventListener("createdRoom", setTitle.bind(this, "created"));
webrtc.addEventListener("joinedRoom", setTitle.bind(this, "joined"));

/**
 * Leave the room
 */
const leaveBtn = document.querySelector("#leaveBtn");
leaveBtn.addEventListener("click", () => {
  webrtc.leaveRoom();
});
webrtc.addEventListener("leftRoom", (e) => {
  const room = e.detail.roomId;
  document.querySelector("h1").textContent = "";
  notify(`Left the room ${room}`);
});

/**
 * Mute audio
 */
const muteBtn = document.getElementById("muteAudioBtn");
muteBtn.addEventListener("click", (e) => {
  const element = e.target;

  const audioStatus = {
    mute: false,
    mic_on: true,
  };
  const currentStatus = webrtc._localStream.getAudioTracks()[0].enabled;

  if (currentStatus === audioStatus["mic_on"]) {
    webrtc._localStream.getAudioTracks()[0].enabled = audioStatus["mute"];

    element.textContent = "mic_on";
  } else if (currentStatus === audioStatus["mute"]) {
    webrtc._localStream.getAudioTracks()[0].enabled = audioStatus["mic_on"];

    element.textContent = "mute";
  }
});

/**
 * hide camera
 */
const hideCameraBtn = document.getElementById("hideCameraBtn");
hideCameraBtn.addEventListener("click", (e) => {
  const element = e.target;

  const cameraStatus = {
    hide_camera: false,
    active_camera: true,
  };
  const currentStatus = webrtc._localStream.getVideoTracks()[0].enabled;

  if (currentStatus === cameraStatus["active_camera"]) {
    webrtc._localStream.getVideoTracks()[0].enabled =
      cameraStatus["hide_camera"];

    element.textContent = "active_camera";
  } else if (currentStatus === cameraStatus["hide_camera"]) {
    webrtc._localStream.getVideoTracks()[0].enabled =
      cameraStatus["active_camera"];

    element.textContent = "hide_camera";
  }
});

/**
 * Get local media
 */
webrtc
  .getLocalStream(true, { width: 640, height: 480 })
  .then((stream) => (localVideo.srcObject = stream));

webrtc.addEventListener("kicked", () => {
  document.querySelector("h1").textContent = "You were kicked out";
  videoGrid.innerHTML = "";
});

webrtc.addEventListener("userLeave", (e) => {
  console.log(`user ${e.detail.socketId} left room`);
});

/**
 * Handle new user connection
 */
webrtc.addEventListener("newUser", (e) => {
  const socketId = e.detail.socketId;
  const stream = e.detail.stream;

  const videoContainer = document.createElement("div");
  videoContainer.setAttribute("class", "grid-item");
  videoContainer.setAttribute("id", socketId);

  const video = document.createElement("video");
  video.setAttribute("autoplay", true);
  video.setAttribute("muted", true); // set to false
  video.setAttribute("playsinline", true);
  video.setAttribute("id", "otherVideo");
  video.srcObject = stream;

  const p = document.createElement("p");
  p.textContent = socketId;

  videoContainer.append(p);
  videoContainer.append(video);

  // If user is admin add kick buttons
  if (webrtc.isAdmin) {
    const kickBtn = document.createElement("button");
    kickBtn.setAttribute("class", "kick_btn");
    kickBtn.textContent = "Kick";

    kickBtn.addEventListener("click", () => {
      webrtc.kickUser(socketId);
    });

    videoContainer.append(kickBtn);
  }
  videoGrid.append(videoContainer);

  // audio level
  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 32;
  const sourceNode = audioCtx.createMediaStreamSource(stream);

  sourceNode.connect(analyser);

  let dataArray = new Uint8Array(analyser.frequencyBinCount);

  const getLevel = () => {
    analyser.getByteTimeDomainData(dataArray);
    return Array.from(dataArray).reduce(
      (a, b) => Math.abs(127 - a) + Math.abs(127 - b)
    );
  };

  const audioLevelElem = document.getElementById("volume");
  const refresh = () => {
    const level = getLevel();

    audioLevelQueue.shift();
    audioLevelQueue.push(level);

    const maxLevel = Math.max(...audioLevelQueue);

    audioLevelElem.setAttribute("value", maxLevel);
    requestAnimationFrame(refresh);
  };

  requestAnimationFrame(refresh);
});

/**
 * Handle user got removed
 */
webrtc.addEventListener("removeUser", (e) => {
  const socketId = e.detail.socketId;
  if (!socketId) {
    // remove all remote stream elements
    videoGrid.innerHTML = "";
    return;
  }
  document.getElementById(socketId).remove();
});

/**
 * Handle errors
 */
webrtc.addEventListener("error", (e) => {
  const error = e.detail.error;
  console.error(error);

  notify(error);
});

/**
 * Handle notifications
 */
webrtc.addEventListener("notification", (e) => {
  const notif = e.detail.notification;
  console.log(notif);

  notify(notif);
});
