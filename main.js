import './style.css';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyD1b7InCyJf03f82MBrFCXNd_1lir3nWrQ",
  authDomain: "lil-testing.firebaseapp.com",
  databaseURL: "https://lil-testing-default-rtdb.firebaseio.com",
  projectId: "lil-testing",
  storageBucket: "lil-testing.appspot.com",
  messagingSenderId: "309006701748",
  appId: "1:309006701748:web:2cfa73093e14fbcc2af3e1"
};


if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const firestore = firebase.firestore();
const database = firebase.database();

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};

const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = new MediaStream();

// HTML Elements
const webcamVideo = document.getElementById('webcamVideo');
const remoteVideo = document.getElementById('remoteVideo'); // Ensure this is correctly referenced
const roomInput = document.getElementById('roomInput');
const joinButton = document.getElementById('joinButton');
const hangupButton = document.getElementById('hangupButton');

// Automatically fill room ID if provided in the URL
const urlParams = new URLSearchParams(window.location.search);
const roomIdFromUrl = urlParams.get('room');
if (roomIdFromUrl) {
    roomInput.value = roomIdFromUrl;
    joinRoom(roomIdFromUrl);
}

// Function to join a room
async function joinRoom(roomId) {
    roomInput.value = roomId;
    joinButton.textContent = "Connecting…";
    joinButton.disabled = true;

    const callDoc = firestore.collection('calls').doc(roomId);
    const answerCandidates = callDoc.collection('answerCandidates');
    const offerCandidates = callDoc.collection('offerCandidates');

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    webcamVideo.srcObject = localStream;
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
        remoteStream.addTrack(event.track);
        remoteVideo.srcObject = remoteStream; // Ensure the remote video stream is set
    };

    // Listen for remote ICE candidates
    offerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
            }
        });
    });

    // Get call data
    const callData = (await callDoc.get()).data();
    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
    await callDoc.update({ answer });

    // Save answer ICE candidates to Firestore
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            answerCandidates.add(event.candidate.toJSON());
        }
    };

    hangupButton.disabled = false;
}

// Hang up functionality
hangupButton.onclick = () => {
    pc.close();
    localStream.getTracks().forEach((track) => track.stop());
    hangupButton.disabled = true;
    joinButton.disabled = false;
    joinButton.textContent = "Join Room";
};
