const socket = io("/", {
    transports: ["polling"],
});
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const showParticipants = document.querySelector("#showParticipants");
const stopVideorecord = document.querySelector("#stopVideorecord");
const recordVideo = document.querySelector("#recordVideo");
const backBtn = document.querySelector(".header__back");
const ROOM_ID = document.getElementById("room").getAttribute("data-roomid");
myVideo.muted = true;

backBtn.addEventListener("click", () => {
    document.querySelector(".main__left").style.display = "flex";
    document.querySelector(".main__left").style.flex = "1";
    document.querySelector(".main__right").style.display = "none";
    document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
    document.querySelector(".main__right").style.display = "flex";
    document.querySelector(".main__right").style.flex = "1";
    document.querySelector(".main__left").style.display = "none";
    document.querySelector(".header__back").style.display = "block";
});

showParticipants.addEventListener("click", () => {
    var redirectWindow = window.open("/showParticipants", "_blank");
    redirectWindow.location;
});
// let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

const user = document.getElementById("userS").getAttribute("userName");
myVideo.setAttribute("id", user);
mylabel = document.createElement("label");
mylabel.setAttribute("for", user);
mylabel.innerHTML = user;
myVideo.appendChild(mylabel);
video = "";
var peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "443",
});

let myVideoStream;
navigator.mediaDevices
    .getUserMedia({
        audio: true,
        video: true,
    })
    .then(async (stream) => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream);

        peer.on("call", (call) => {
            call.answer(stream);
            const video = document.createElement("video");
            video.setAttribute("id", call.peer);
            label1 = document.createElement("label");
            label1.setAttribute("for", call.peer);
            label1.innerHTML = call.peer;
            video.appendChild(label1);
            // alert("user id set");
            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream);
            });
        });

        socket.on("user-connected", (userId, userName_team) => {
            connectToNewUser(userId, userName_team, stream);
        });
        socket.on("user-disconnected", (userId) => {
            const call = peer.call(userId, stream);
            document.getElementById(call.peer).remove();
        });
        let recorder = RecordRTC(stream, {
            type: "video",
        });
        recordVideo.addEventListener("click", () => {
            stopVideorecord.style.display = "flex";
            recordVideo.style.display = "none";
            recorder.startRecording();
        });
        stopVideorecord.addEventListener("click", () => {
            stopVideorecord.style.display = "none";
            recordVideo.style.display = "flex";
            recorder.stopRecording(function () {
                let blob = recorder.getBlob();
                invokeSaveAsDialog(blob, user + ".webm");
            });
        });
    });
const removeuser = (userId, stream) => {
    const call = peer.call(userId, stream);
    document.getElementById(call.peer).remove();
};

const connectToNewUser = (userId, userName_team, stream) => {
    alert(userName_team + " joined");
    // tempAlert("close", 5000);
    const call = peer.call(userId, stream);
    video = document.createElement("video");
    video.setAttribute("id", call.peer);
    label1 = document.createElement("label");
    label1.setAttribute("for", call.peer);
    label1.innerHTML = call.peer;
    video.appendChild(label1);
    call.on("stream", (userVideoStream) => {
        video.srcObject = userVideoStream;
        video.addEventListener("loadedmetadata", () => {
            video.play();
            videoGrid.append(video);
        });
    });
};

peer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
        videoGrid.append(video);
    });
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
    if (text.value.length !== 0) {
        socket.emit("message", text.value);
        text.value = "";
    }
});

text.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && text.value.length !== 0) {
        socket.emit("message", text.value);
        text.value = "";
    }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
muteButton.addEventListener("click", () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        html = `<i class="fas fa-microphone-slash"></i>`;
        muteButton.classList.toggle("background__red");
        muteButton.innerHTML = html;
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        html = `<i class="fas fa-microphone"></i>`;
        muteButton.classList.toggle("background__red");
        muteButton.innerHTML = html;
    }
});

stopVideo.addEventListener("click", () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        html = `<i class="fas fa-video-slash"></i>`;
        stopVideo.classList.toggle("background__red");
        stopVideo.innerHTML = html;
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        html = `<i class="fas fa-video"></i>`;
        stopVideo.classList.toggle("background__red");
        stopVideo.innerHTML = html;
    }
});

function leaveMeet() {
    window.location.replace("/home");
}

inviteButton.addEventListener("click", (e) => {
    url = window.location.href.split("/");
    str = "Website:- https://boomgroup24.herokuapp.com/" + "\n" + "Meet id:- " + url[4] + "\npasscode:- " + url[5];
    prompt("Copy to clipboard: Ctrl+C, Enter", str);
    // alert(str);
});

socket.on("createMessage", (message, userName) => {
    messages.innerHTML =
        messages.innerHTML +
        `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${userName === user ? "me" : userName}</span> </b>
        <span>${message}</span>
    </div>`;
});

function tempAlert(msg, duration) {
    var el = document.createElement("div");
    el.setAttribute("style", "position:absolute;top:40%;left:20%;background-color:white;");
    el.innerHTML = msg;
    setTimeout(function () {
        el.parentNode.removeChild(el);
    }, duration);
    document.body.appendChild(el);
}
